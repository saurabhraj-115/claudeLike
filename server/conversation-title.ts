import Anthropic from "@anthropic-ai/sdk";

export function buildFallbackConversationTitle(message: string) {
  const singleLine = message.replace(/\s+/g, " ").trim();
  if (!singleLine) {
    return "New Chat";
  }

  return singleLine.length > 60 ? `${singleLine.slice(0, 57).trimEnd()}...` : singleLine;
}

function normalizeGeneratedTitle(title: string) {
  const normalized = title
    .replace(/^["'\s]+|["'\s]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) {
    return "New Chat";
  }

  return normalized.length > 60 ? `${normalized.slice(0, 57).trimEnd()}...` : normalized;
}

export async function generateConversationTitle({
  anthropic,
  model,
  message,
  attachments = [],
}: {
  anthropic: Anthropic;
  model: string;
  message: string;
  attachments?: { name: string; content: string }[];
}) {
  const attachmentContext = attachments.length
    ? `\n\nAttachments:\n${attachments.map((file) => `- ${file.name}`).join("\n")}`
    : "";

  try {
    const response = await anthropic.messages.create({
      model,
      max_tokens: 24,
      temperature: 0.2,
      system:
        "Generate a concise chat title. Return only the title text, no quotes, no punctuation at the end unless required. Keep it under 6 words.",
      messages: [
        {
          role: "user",
          content: `Create a short, natural conversation title for this opening user request:\n\n${message}${attachmentContext}`,
        },
      ],
    });

    const title = response.content.find((block) => block.type === "text")?.text ?? "";
    const normalizedTitle = normalizeGeneratedTitle(title);
    if (normalizedTitle !== "New Chat") {
      return normalizedTitle;
    }
  } catch (error) {
    console.error("Failed to generate conversation title:", error);
  }

  return buildFallbackConversationTitle(message);
}
