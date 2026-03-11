import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import { buildFallbackConversationTitle, generateConversationTitle } from "./conversation-title";

const MAX_RESPONSE_TOKENS = 4096;
const MAX_CONTINUATIONS = 3;

type ChatAttachment =
  | { kind?: "text"; name: string; content: string }
  | {
      kind: "image";
      name: string;
      content: string;
      mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp";
      previewUrl?: string;
    };

function isImageAttachment(
  attachment: ChatAttachment | { kind?: string; mediaType?: string },
): attachment is Extract<ChatAttachment, { kind: "image" }> {
  return attachment.kind === "image";
}

function buildUserContentBlocks(message: string, attachments: ChatAttachment[] = []): Anthropic.Messages.ContentBlockParam[] {
  const blocks: Anthropic.Messages.ContentBlockParam[] = [];
  const textAttachments = attachments.filter((attachment) => !isImageAttachment(attachment));
  const imageAttachments = attachments.filter((attachment) => isImageAttachment(attachment));

  let textContent = message;
  if (textAttachments.length > 0) {
    textContent +=
      "\n\nAttachments:\n" +
      textAttachments
        .map((attachment) => `[File: ${attachment.name}]\n${attachment.content}`)
        .join("\n\n");
  }

  if (textContent.trim()) {
    blocks.push({
      type: "text",
      text: textContent,
    });
  }

  for (const attachment of imageAttachments) {
    blocks.push({
      type: "image",
      source: {
        type: "base64",
        media_type: attachment.mediaType,
        data: attachment.content,
      },
    });
  }

  return blocks;
}

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
      const {
        message,
        conversationId,
        apiKey,
        model = "claude-sonnet-4-20250514",
        attachments = [],
      } = req.body;

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
      const anthropicMessages: Anthropic.Messages.MessageParam[] = history.map((msg) => ({
        role: msg.role as "user" | "assistant",
        content:
          msg.role === "user"
            ? buildUserContentBlocks(msg.content, (msg.attachments || []) as ChatAttachment[])
            : msg.content,
      }));

      // Add current message with current attachments
      anthropicMessages.push({
        role: "user",
        content: buildUserContentBlocks(message, attachments as ChatAttachment[]),
      });

      const titlePromise = shouldGenerateTitle
        ? generateConversationTitle({
            anthropic,
            model,
            message,
            attachments,
          }).then((title) =>
            storage.updateConversation(currentConversationId, {
              title,
            })
          )
        : Promise.resolve(conversation);

      // Call Anthropic API, continuing automatically if the model stops at max_tokens.
      const [assistantContent, updatedConversation] = await Promise.all([
        (async () => {
          const requestMessages = [...anthropicMessages];
          let fullText = "";

          for (let attempt = 0; attempt <= MAX_CONTINUATIONS; attempt += 1) {
            const response = await anthropic.messages.create({
              model,
              max_tokens: MAX_RESPONSE_TOKENS,
              messages: requestMessages,
            });

            const chunk = response.content
              .filter((block) => block.type === "text")
              .map((block) => block.text)
              .join("");

            fullText += chunk;

            if (response.stop_reason !== "max_tokens") {
              return fullText;
            }

            requestMessages.push({ role: "assistant", content: chunk });
            requestMessages.push({
              role: "user",
              content: "Continue exactly from where you stopped. Do not repeat prior text.",
            });
          }

          return fullText;
        })(),
        titlePromise,
      ]);

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
