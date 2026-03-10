import { z } from "zod";
import { insertConversationSchema, insertMessageSchema, conversations, messages } from "./schema";

export const api = {
  conversations: {
    list: {
      method: "GET",
      path: "/api/conversations",
      responses: {
        200: z.array(z.custom<typeof conversations.$inferSelect>()),
      },
    },
    create: {
      method: "POST",
      path: "/api/conversations",
      input: z.object({}).optional(),
      responses: {
        201: z.custom<typeof conversations.$inferSelect>(),
      },
    },
    get: {
      method: "GET",
      path: "/api/conversations/:id",
      responses: {
        200: z.custom<typeof conversations.$inferSelect & { messages: typeof messages.$inferSelect[] }>(),
        404: z.object({ message: z.string() }),
      },
    },
    delete: {
      method: "DELETE",
      path: "/api/conversations/:id",
      responses: {
        204: z.void(),
        404: z.object({ message: z.string() }),
      },
    }
  },
  messages: {
    create: {
      method: "POST",
      path: "/api/conversations/:id/messages",
      input: z.object({
        content: z.string(),
        role: z.enum(["user", "assistant"]),
        attachments: z.array(z.object({ name: z.string(), content: z.string() })).optional(),
      }),
      responses: {
        201: z.custom<typeof messages.$inferSelect>(),
      },
    },
    list: {
      method: "GET",
      path: "/api/conversations/:id/messages",
      responses: {
        200: z.array(z.custom<typeof messages.$inferSelect>()),
      },
    }
  },
  chat: {
    send: {
      method: "POST",
      path: "/api/chat",
      input: z.object({
        message: z.string(),
        conversationId: z.number().optional(),
        apiKey: z.string().optional(),
        attachments: z.array(z.object({ name: z.string(), content: z.string() })).optional(),
      }),
      responses: {
        200: z.object({
          message: z.string(),
          conversationId: z.number(),
          title: z.string(),
        }),
        401: z.object({ message: z.string() }),
        500: z.object({ message: z.string() }),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type ChatInput = z.infer<typeof api.chat.send.input>;
export type ChatResponse = z.infer<typeof api.chat.send.responses[200]>;
