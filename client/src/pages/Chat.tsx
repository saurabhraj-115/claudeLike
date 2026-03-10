import { Sidebar } from "@/components/Sidebar";
import { ChatInput } from "@/components/ChatInput";
import { MessageList } from "@/components/MessageList";
import { useConversation, useSendMessage } from "@/hooks/use-chat";
import { useToast } from "@/hooks/use-toast";
import { useRoute } from "wouter";
import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import type { Message } from "@shared/schema";
import type { ChatAttachment } from "@/lib/chat";

export default function Chat() {
  const [, params] = useRoute("/chat/:id");
  const id = params ? parseInt(params.id) : null;
  
  const { data: conversation, isLoading: isFetching } = useConversation(id);
  const sendMessageMutation = useSendMessage();
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [pendingMessages, setPendingMessages] = useState<Message[]>([]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversation?.messages, pendingMessages, sendMessageMutation.isPending]);

  useEffect(() => {
    if (!conversation?.messages?.length) {
      return;
    }

    setPendingMessages((current) =>
      current.filter((pending) => {
        return !conversation.messages.some((message) => {
          return (
            message.role === pending.role &&
            message.content === pending.content &&
            JSON.stringify(message.attachments || []) === JSON.stringify(pending.attachments || [])
          );
        });
      })
    );
  }, [conversation?.messages]);

  const handleSend = async (message: string, attachments?: ChatAttachment[]) => {
    if (!id) return;
    
    const apiKey = localStorage.getItem("anthropic_api_key");
    if (!apiKey) {
      toast({
        title: "API Key Missing",
        description: "Please set your Anthropic API Key in settings first.",
        variant: "destructive",
      });
      return;
    }

    const optimisticMessage: Message = {
      id: -Date.now(),
      conversationId: id,
      role: "user",
      content: message,
      attachments: attachments || [],
      createdAt: new Date(),
    };
    setPendingMessages((current) => [...current, optimisticMessage]);

    sendMessageMutation.mutate({
      message,
      conversationId: id,
      apiKey,
      attachments: attachments || []
    } as any, {
      onError: (error) => {
        setPendingMessages([]);
        toast({
          title: "Error sending message",
          description: error.message,
          variant: "destructive",
        });
      }
    });
  };

  if (isFetching && !conversation) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 ml-0 md:ml-[280px] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </main>
      </div>
    );
  }

  const displayMessages = [...(conversation?.messages || []), ...pendingMessages];
  
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-0 md:ml-[280px] flex flex-col h-screen">
        <div className="flex-1 overflow-hidden flex flex-col relative">
          <div ref={scrollRef} className="flex-1 overflow-y-auto scroll-smooth">
            <MessageList 
              messages={displayMessages} 
              isLoading={sendMessageMutation.isPending} 
            />
          </div>
          
          <div className="flex-shrink-0 bg-gradient-to-t from-background via-background to-transparent pt-6">
            <ChatInput 
              onSend={handleSend} 
              isLoading={sendMessageMutation.isPending} 
            />
          </div>
        </div>
      </main>
    </div>
  );
}
