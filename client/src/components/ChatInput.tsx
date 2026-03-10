import { useState, useRef, useEffect } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { Button } from "@/components/ui/button";
import { Send, Paperclip, X, FileText } from "lucide-react";
import type { ChatAttachment } from "@/lib/chat";
import { useToast } from "@/hooks/use-toast";

const MAX_ATTACHMENT_SIZE = 1024 * 1024;
const ACCEPTED_FILE_TYPES = [
  ".txt",
  ".md",
  ".json",
  ".csv",
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".py",
  ".html",
  ".css",
  ".sql",
  ".xml",
  ".yaml",
  ".yml",
];

interface ChatInputProps {
  onSend: (message: string, attachments?: ChatAttachment[]) => void;
  isLoading: boolean;
}

export function ChatInput({ onSend, isLoading }: ChatInputProps) {
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleSubmit = () => {
    if ((!input.trim() && attachments.length === 0) || isLoading) return;
    onSend(input, attachments);
    setInput("");
    setAttachments([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleConvertToAttachment = () => {
    if (input.length > 1000) {
      const name = `pasted_text_${attachments.length + 1}.txt`;
      setAttachments([...attachments, { name, content: input }]);
      setInput("");
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleAttachmentClick = () => {
    if (isLoading) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) {
      return;
    }

    const nextAttachments: ChatAttachment[] = [];

    for (const file of files) {
      if (file.size > MAX_ATTACHMENT_SIZE) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds the 1 MB limit.`,
          variant: "destructive",
        });
        continue;
      }

      try {
        const content = await file.text();
        nextAttachments.push({ name: file.name, content });
      } catch {
        toast({
          title: "Unsupported file",
          description: `Could not read ${file.name} as text.`,
          variant: "destructive",
        });
      }
    }

    if (nextAttachments.length > 0) {
      setAttachments((current) => [...current, ...nextAttachments]);
    }

    event.target.value = "";
  };

  // Focus input on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  return (
    <div className="w-full max-w-3xl mx-auto p-4 pb-8">
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_FILE_TYPES.join(",")}
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2 px-2">
          {attachments.map((file, i) => (
            <div key={i} className="flex items-center gap-2 bg-secondary border border-border/40 px-3 py-1.5 rounded-lg text-sm group relative">
              <FileText className="w-4 h-4 text-[#DA7756]" />
              <span className="truncate max-w-[150px]">{file.name}</span>
              <button 
                onClick={() => removeAttachment(i)}
                className="hover:bg-foreground/5 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="relative group bg-card rounded-2xl shadow-sm border border-border/50 focus-within:border-border/70 transition-all duration-300">
        <TextareaAutosize
          ref={textareaRef}
          minRows={1}
          maxRows={8}
          placeholder="Message Claude..."
          className="w-full resize-none bg-transparent border-0 outline-none focus:outline-none focus:ring-0 p-4 pr-12 text-base placeholder:text-muted-foreground/60 font-sans"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
        />
        
        {input.length > 1000 && (
          <div className="px-4 pb-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleConvertToAttachment}
              className="h-7 text-xs gap-1.5 border-[#DA7756]/20 bg-[#DA7756]/5 hover:bg-[#DA7756]/10 text-[#DA7756]"
            >
              <FileText className="w-3 h-3" />
              Convert to .txt attachment
            </Button>
          </div>
        )}

        <div className="absolute bottom-2 right-2 flex items-center gap-1">
          <Button 
            size="icon" 
            variant="ghost" 
            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-transparent"
            onClick={handleAttachmentClick}
            disabled={isLoading}
            type="button"
          >
            <Paperclip className="w-4 h-4" />
          </Button>

          <Button
            size="icon"
            onClick={handleSubmit}
            disabled={(!input.trim() && attachments.length === 0) || isLoading}
            className={`
              h-8 w-8 transition-all duration-300
              ${(input.trim() || attachments.length > 0)
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
