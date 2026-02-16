import { Message } from "@shared/schema";
import ReactMarkdown from "react-markdown";
import { Bot, User as UserIcon, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useState } from "react";

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
}

export function MessageList({ messages, isLoading }: MessageListProps) {
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const copyToClipboard = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-8 max-w-3xl mx-auto w-full">
      {messages.map((msg, index) => (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          key={msg.id || index} // Use index as fallback for optimistic updates
          className={cn(
            "flex gap-4 group",
            msg.role === "user" ? "flex-row-reverse" : "flex-row"
          )}
        >
          {/* Avatar */}
          <div className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm border border-border/50",
            msg.role === "assistant" 
              ? "bg-[#DA7756] text-white" 
              : "bg-white text-muted-foreground"
          )}>
            {msg.role === "assistant" ? <Bot className="w-5 h-5" /> : <UserIcon className="w-5 h-5" />}
          </div>

          {/* Message Content */}
          <div className={cn(
            "flex flex-col max-w-[85%]",
            msg.role === "user" ? "items-end" : "items-start"
          )}>
            <div className={cn(
              "text-[13px] font-medium mb-1 opacity-50 px-1",
              msg.role === "user" ? "text-right" : "text-left"
            )}>
              {msg.role === "assistant" ? "Claude" : "You"}
            </div>
            
            <div className={cn(
              "relative px-5 py-3.5 rounded-2xl text-[15px] leading-relaxed shadow-sm",
              msg.role === "user" 
                ? "bg-[#F2F0E9] text-foreground rounded-tr-sm" 
                : "bg-white text-foreground border border-border/40 rounded-tl-sm font-serif prose prose-neutral max-w-none"
            )}>
              {msg.role === "assistant" ? (
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              ) : (
                <p className="whitespace-pre-wrap font-sans">{msg.content}</p>
              )}

              {/* Copy Button for Assistant */}
              {msg.role === "assistant" && (
                <button
                  onClick={() => copyToClipboard(msg.content, msg.id)}
                  className="absolute -bottom-6 left-0 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-muted-foreground flex items-center gap-1 hover:text-foreground"
                >
                  {copiedId === msg.id ? (
                    <><Check className="w-3 h-3" /> Copied</>
                  ) : (
                    <><Copy className="w-3 h-3" /> Copy</>
                  )}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      ))}
      
      {isLoading && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex gap-4"
        >
          <div className="w-8 h-8 rounded-lg bg-[#DA7756] text-white flex items-center justify-center shrink-0 shadow-sm">
            <Bot className="w-5 h-5" />
          </div>
          <div className="bg-white px-5 py-4 rounded-2xl rounded-tl-sm border border-border/40 shadow-sm flex items-center gap-1.5 h-12">
            <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
            <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
            <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce"></span>
          </div>
        </motion.div>
      )}
      <div className="h-4" /> {/* Spacer */}
    </div>
  );
}
