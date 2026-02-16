import { useState, useRef, useEffect } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { Button } from "@/components/ui/button";
import { Send, Paperclip } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
}

export function ChatInput({ onSend, isLoading }: ChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    if (!input.trim() || isLoading) return;
    onSend(input);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Focus input on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  return (
    <div className="w-full max-w-3xl mx-auto p-4 pb-8">
      <div className="relative group bg-white rounded-2xl shadow-sm border border-border/50 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all duration-300">
        <TextareaAutosize
          ref={textareaRef}
          minRows={1}
          maxRows={8}
          placeholder="Message Claude..."
          className="w-full resize-none bg-transparent border-0 focus:ring-0 p-4 pr-12 text-base placeholder:text-muted-foreground/60 font-sans"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
        />
        
        <div className="absolute bottom-2 right-2 flex items-center gap-1">
          <Button 
            size="icon" 
            variant="ghost" 
            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-transparent"
            disabled
          >
            <Paperclip className="w-4 h-4" />
          </Button>

          <Button
            size="icon"
            onClick={handleSubmit}
            disabled={!input.trim() || isLoading}
            className={`
              h-8 w-8 transition-all duration-300
              ${input.trim() 
                ? "bg-[#DA7756] hover:bg-[#C56545] text-white shadow-md" 
                : "bg-muted text-muted-foreground cursor-not-allowed"}
            `}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <div className="text-center mt-2">
        <p className="text-xs text-muted-foreground/60">
          AI can make mistakes. Please use with discretion.
        </p>
      </div>
    </div>
  );
}
