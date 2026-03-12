import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { getAuthHeaders } from "@/lib/queryClient";
import type { ChatAttachment } from "@/lib/chat";
import type { Conversation } from "@shared/schema";

// Fetch all conversations
export function useConversations() {
  return useQuery({
    queryKey: [api.conversations.list.path],
    queryFn: async () => {
      const res = await fetch(api.conversations.list.path, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch conversations");
      return api.conversations.list.responses[200].parse(await res.json());
    },
  });
}

// Fetch single conversation with messages
export function useConversation(id: number | null) {
  return useQuery({
    queryKey: [api.conversations.get.path, id],
    queryFn: async () => {
      if (!id) return null;
      const url = buildUrl(api.conversations.get.path, { id });
      const res = await fetch(url, { headers: getAuthHeaders() });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch conversation");
      return api.conversations.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

// Create a new conversation
export function useCreateConversation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(api.conversations.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      });
      if (!res.ok) throw new Error("Failed to create conversation");
      return api.conversations.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.conversations.list.path] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create new chat",
        variant: "destructive",
      });
    },
  });
}

// Delete a conversation
export function useDeleteConversation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.conversations.delete.path, { id });
      const res = await fetch(url, { method: "DELETE", headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to delete conversation");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.conversations.list.path] });
      toast({ title: "Conversation deleted" });
    },
  });
}

// Send a chat message (Core AI logic)
export function useSendMessage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      message, 
      conversationId, 
      apiKey,
      model,
      attachments = [],
    }: { 
      message: string, 
      conversationId?: number, 
      apiKey?: string,
      model?: string,
      attachments?: ChatAttachment[],
    }) => {
      const requestAttachments = attachments.map((attachment) =>
        attachment.kind === "image"
          ? {
              kind: "image" as const,
              name: attachment.name,
              content: attachment.content,
              mediaType: attachment.mediaType,
            }
          : attachment
      );

      const res = await fetch(api.chat.send.path, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(apiKey ? { "X-Api-Key": apiKey } : {}),
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ message, conversationId, model, attachments: requestAttachments }),
      });
      
      if (res.status === 401) throw new Error("Invalid API Key");
      if (!res.ok) throw new Error("Failed to send message");
      
      return api.chat.send.responses[200].parse(await res.json());
    },
    onSuccess: (data, variables) => {
      if (data.title) {
        queryClient.setQueryData<Conversation[] | undefined>(
          [api.conversations.list.path],
          (current) =>
            current?.map((conversation) =>
              conversation.id === data.conversationId
                ? { ...conversation, title: data.title }
                : conversation
            )
        );
      }
      queryClient.invalidateQueries({ queryKey: [api.conversations.list.path] });
      
      // Invalidate specific conversation to show new messages
      if (data.conversationId) {
        queryClient.invalidateQueries({ 
          queryKey: [api.conversations.get.path, data.conversationId] 
        });
      }
    },
  });
}
