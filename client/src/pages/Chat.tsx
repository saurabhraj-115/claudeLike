import { Sidebar } from "@/components/Sidebar";
import { ChatInput } from "@/components/ChatInput";
import { MessageList } from "@/components/MessageList";
import { useConversation, useSendMessage } from "@/hooks/use-chat";
import { useToast } from "@/hooks/use-toast";
import { useRoute } from "wouter";
import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

export default function Chat() {
  const [, params] = useRoute("/chat/:id");
  const id = params ? parseInt(params.id) : null;
  
  const { data: conversation, isLoading: isFetching } = useConversation(id);
  const sendMessageMutation = useSendMessage();
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversation?.messages, sendMessageMutation.isPending]);

  const handleSend = async (message: string, attachments?: { name: string; content: string }[]) => {
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

    sendMessageMutation.mutate({
      message,
      conversationId: id,
      apiKey,
      attachments: attachments || []
    } as any, {
      onError: (error) => {
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
      <div className="flex min-h-screen bg-[#FBFBF9]">
        <Sidebar />
        <main className="flex-1 ml-0 md:ml-[280px] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </main>
      </div>
    );
  }

  const displayMessages = [...(conversation?.messages || [])];
  
  return (
    <div className="flex min-h-screen bg-[#FBFBF9]">
      <Sidebar />
      <main className="flex-1 ml-0 md:ml-[280px] flex flex-col h-screen">
        <div className="flex-1 overflow-hidden flex flex-col relative">
          <div ref={scrollRef} className="flex-1 overflow-y-auto scroll-smooth">
            <MessageList 
              messages={displayMessages} 
              isLoading={sendMessageMutation.isPending} 
            />
          </div>
          
          <div className="flex-shrink-0 bg-gradient-to-t from-[#FBFBF9] via-[#FBFBF9] to-transparent pt-6">
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
