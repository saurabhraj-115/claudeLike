import { Sidebar } from "@/components/Sidebar";
import { ChatInput } from "@/components/ChatInput";
import { MessageList } from "@/components/MessageList";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { useSendMessage } from "@/hooks/use-chat";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useEffect, useRef, useState } from "react";
import type { ChatAttachment } from "@/lib/chat";
import { DEFAULT_MODEL } from "@/lib/models";
import type { Message } from "@shared/schema";

export default function Home() {
  const [, setLocation] = useLocation();
  const sendMessageMutation = useSendMessage();
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [pendingMessages, setPendingMessages] = useState<Message[]>([]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [pendingMessages, sendMessageMutation.isPending]);

  const handleSend = async (message: string, attachments?: ChatAttachment[]) => {
    const apiKey = localStorage.getItem("anthropic_api_key");
    const model = localStorage.getItem("anthropic_model") || DEFAULT_MODEL;
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
      conversationId: -1,
      role: "user",
      content: message,
      attachments: attachments || [],
      createdAt: new Date(),
    };
    setPendingMessages([optimisticMessage]);

    try {
      const response = await sendMessageMutation.mutateAsync({
        message,
        apiKey,
        model,
        attachments: attachments || []
      } as any);

      setLocation(`/chat/${response.conversationId}`);
    } catch (error) {
      setPendingMessages([]);
      toast({
        title: "Error",
        description: "Failed to start conversation. Please check your API key.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-0 md:ml-[280px] flex flex-col h-screen relative">
        <div className="flex-1 overflow-hidden flex flex-col relative">
          <div ref={scrollRef} className="flex-1 overflow-y-auto scroll-smooth">
            {pendingMessages.length > 0 || sendMessageMutation.isPending ? (
              <MessageList
                messages={pendingMessages}
                isLoading={sendMessageMutation.isPending}
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center overflow-hidden">
                <WelcomeScreen onPromptSelect={(msg) => handleSend(msg)} />
              </div>
            )}
          </div>
        </div>
        
        <div className="flex-shrink-0 bg-gradient-to-t from-background via-background to-transparent pt-10">
          <ChatInput 
            onSend={handleSend} 
            isLoading={sendMessageMutation.isPending} 
          />
        </div>
      </main>
    </div>
  );
}
