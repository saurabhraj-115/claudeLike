import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import { buildFallbackConversationTitle, generateConversationTitle } from "./conversation-title";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Conversations
  app.get(api.conversations.list.path, async (req, res) => {
    const conversations = await storage.getConversations();
    res.json(conversations);
  });

  app.post(api.conversations.create.path, async (req, res) => {
    const conversation = await storage.createConversation({ title: "New Chat" });
    res.status(201).json(conversation);
  });

  app.get(api.conversations.get.path, async (req, res) => {
    const id = parseInt(req.params.id as string);
    const conversation = await storage.getConversation(id);
    if (!conversation) return res.status(404).json({ message: "Conversation not found" });
    
    const messages = await storage.getMessages(id);
    res.json({ ...conversation, messages });
  });

  app.delete(api.conversations.delete.path, async (req, res) => {
    await storage.deleteConversation(parseInt(req.params.id as string));
    res.status(204).send();
  });

  // Messages
  app.get(api.messages.list.path, async (req, res) => {
    const messages = await storage.getMessages(parseInt(req.params.id as string));
    res.json(messages);
  });

  app.post(api.messages.create.path, async (req, res) => {
    const conversationId = parseInt(req.params.id as string);
    const message = await storage.createMessage({
      conversationId,
      ...req.body,
    });
    res.status(201).json(message);
  });

  // Chat Endpoint
  app.post(api.chat.send.path, async (req, res) => {
    try {
      const { message, conversationId, apiKey, attachments = [] } = req.body;

      if (!apiKey) {
        return res.status(401).json({ message: "Anthropic API Key is required." });
      }

      const anthropic = new Anthropic({ apiKey });

      // Handle conversation ID
      let currentConversationId = conversationId;
      if (!currentConversationId) {
        const newConv = await storage.createConversation({ title: buildFallbackConversationTitle(message) });
        currentConversationId = newConv.id;
      }

      const conversation = await storage.getConversation(currentConversationId);
      const shouldGenerateTitle = !!conversation && (!conversation.title || conversation.title === "New Chat");

      // Get history
      const history = await storage.getMessages(currentConversationId);
      
      // Save user message with attachments
      await storage.createMessage({
        conversationId: currentConversationId,
        role: "user",
        content: message,
        attachments: attachments,
      });

      // Prepare messages for Anthropic
      const anthropicMessages: Anthropic.Messages.MessageParam[] = history.map(msg => ({
        role: msg.role as "user" | "assistant",
        content: msg.content + (msg.attachments && msg.attachments.length > 0 
          ? "\n\nAttachments:\n" + msg.attachments.map((a: any) => `[File: ${a.name}]\n${a.content}`).join("\n\n")
          : "")
      }));

      // Add current message with current attachments
      let currentContent = message;
      if (attachments.length > 0) {
        currentContent += "\n\nAttachments:\n" + (attachments as any[]).map(a => `[File: ${a.name}]\n${a.content}`).join("\n\n");
      }
      anthropicMessages.push({ role: "user", content: currentContent });

      const titlePromise = shouldGenerateTitle
        ? generateConversationTitle({
            anthropic,
            message,
            attachments,
          }).then((title) =>
            storage.updateConversation(currentConversationId, {
              title,
            })
          )
        : Promise.resolve(conversation);

      // Call Anthropic API
      const [response, updatedConversation] = await Promise.all([
        anthropic.messages.create({
          model: "claude-opus-4-6",
          max_tokens: 1024,
          messages: anthropicMessages,
        }),
        titlePromise,
      ]);

      const assistantContent = response.content.find(block => block.type === 'text')?.text || "";

      // Save assistant message
      await storage.createMessage({
        conversationId: currentConversationId,
        role: "assistant",
        content: assistantContent,
        attachments: [],
      });

      res.json({
        message: assistantContent,
        conversationId: currentConversationId,
        title: updatedConversation?.title || conversation?.title || buildFallbackConversationTitle(message),
      });

    } catch (error: any) {
      console.error("Anthropic API Error:", error);
      res.status(500).json({ message: error.message || "Failed to communicate with AI" });
    }
  });

  // Seed Data
  if (process.env.NODE_ENV !== "production") {
    const existing = await storage.getConversations();
    if (existing.length === 0) {
      const conv = await storage.createConversation({ title: "Welcome to AI Chat" });
      await storage.createMessage({
        conversationId: conv.id,
        role: "assistant",
        content: "Hello! I am your AI assistant. To get started, please enter your Anthropic API Key in the settings menu.",
      });
    }
  }

  return httpServer;
}
