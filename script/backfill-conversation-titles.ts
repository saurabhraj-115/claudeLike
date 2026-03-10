import "dotenv/config";
import { and, asc, eq } from "drizzle-orm";
import { db, pool } from "../server/db";
import { conversations, messages } from "../shared/schema";
import Anthropic from "@anthropic-ai/sdk";
import {
  buildFallbackConversationTitle,
  generateConversationTitle,
} from "../server/conversation-title";

type RetitleMode = "generic" | "fallback-match" | "all";

function parseMode() {
  const arg = process.argv[2]?.toLowerCase();
  if (!arg) {
    return "generic" as RetitleMode;
  }

  if (arg === "generic" || arg === "fallback-match" || arg === "all") {
    return arg;
  }

  throw new Error(`Unsupported mode "${arg}". Use one of: generic, fallback-match, all.`);
}

function shouldRetitleConversation(title: string | null, firstUserMessage: string, mode: RetitleMode) {
  if (mode === "all") {
    return true;
  }

  if (!title || title === "New Chat") {
    return true;
  }

  if (mode === "generic") {
    return false;
  }

  const fallbackTitle = buildFallbackConversationTitle(firstUserMessage);
  return title === fallbackTitle;
}

async function backfillConversationTitles() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY must be set to run the title backfill.");
  }

  const mode = parseMode();
  const anthropic = new Anthropic({ apiKey });
  const allConversations = await db.select().from(conversations);
  let updated = 0;

  for (const conversation of allConversations) {
    const [firstUserMessage] = await db
      .select()
      .from(messages)
      .where(and(eq(messages.conversationId, conversation.id), eq(messages.role, "user")))
      .orderBy(asc(messages.createdAt));

    if (!firstUserMessage) {
      continue;
    }

    if (!shouldRetitleConversation(conversation.title, firstUserMessage.content, mode)) {
      continue;
    }

    const generatedTitle = await generateConversationTitle({
      anthropic,
      message: firstUserMessage.content,
      attachments: firstUserMessage.attachments || [],
    });
    const title =
      generatedTitle === "New Chat"
        ? buildFallbackConversationTitle(firstUserMessage.content)
        : generatedTitle;

    if (title === "New Chat") {
      continue;
    }

    await db
      .update(conversations)
      .set({ title })
      .where(eq(conversations.id, conversation.id));

    updated += 1;
  }

  console.log(
    `Backfilled ${updated} conversation title${updated === 1 ? "" : "s"} in ${mode} mode.`
  );
}

backfillConversationTitles()
  .catch((error) => {
    console.error("Failed to backfill conversation titles:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
