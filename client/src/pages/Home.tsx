import { Sidebar } from "@/components/Sidebar";
import { ChatInput } from "@/components/ChatInput";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { useSendMessage } from "@/hooks/use-chat";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import type { ChatAttachment } from "@/lib/chat";

export default function Home() {
  const [, setLocation] = useLocation();
  const sendMessageMutation = useSendMessage();
  const { toast } = useToast();

  const handleSend = async (message: string, attachments?: ChatAttachment[]) => {
    const apiKey = localStorage.getItem("anthropic_api_key");
    if (!apiKey) {
      toast({
        title: "API Key Missing",
        description: "Please set your Anthropic API Key in settings first.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await sendMessageMutation.mutateAsync({
        message,
        apiKey,
        attachments: attachments || []
      } as any);

      setLocation(`/chat/${response.conversationId}`);
    } catch (error) {
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
        <div className="flex-1 flex flex-col items-center justify-center overflow-hidden">
          <WelcomeScreen onPromptSelect={(msg) => handleSend(msg)} />
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
