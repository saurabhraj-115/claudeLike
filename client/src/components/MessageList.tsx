import { Message } from "@shared/schema";
import ReactMarkdown from "react-markdown";
import { Bot, Copy, Check, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useState, type ReactNode } from "react";

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
}

const CLAUDE_AVATAR_SRC = "/favicon.svg";
const USER_AVATAR_SRC = "https://commons.wikimedia.org/wiki/Special:FilePath/Borat%20Sagdiyev.jpg";

function CodeBlock({
  children,
  onCopy,
  copied,
}: {
  children: ReactNode;
  onCopy: () => void;
  copied: boolean;
}) {
  return (
    <div className="group/code relative mb-4 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 text-zinc-100 shadow-sm px-6 pb-6 pt-16">
      <button
        onClick={onCopy}
        type="button"
        className="absolute right-4 top-4 z-10 flex items-center gap-1 rounded-md border border-zinc-700 bg-zinc-900/90 px-2 py-1 text-xs text-zinc-300 opacity-0 transition-all hover:bg-zinc-800 hover:text-white group-hover/code:opacity-100"
      >
        {copied ? (
          <><Check className="h-3 w-3" /> Copied</>
        ) : (
          <><Copy className="h-3 w-3" /> Copy</>
        )}
      </button>
      {children}
    </div>
  );
}

export function MessageList({ messages, isLoading }: MessageListProps) {
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const copyToClipboard = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getCodeText = (children: ReactNode) => {
    if (!children || typeof children !== "object" || !("props" in children)) {
      return "";
    }

    const codeChild = children as { props?: { children?: ReactNode } };
    const value = codeChild.props?.children;

    return Array.isArray(value) ? value.join("") : String(value ?? "");
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-8 max-w-6xl mx-auto w-full">
      {messages.map((msg, index) => (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          key={msg.id || index}
          className={cn(
            "flex gap-4 group",
            msg.role === "user" ? "flex-row-reverse" : "flex-row"
          )}
        >
          <div className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm border border-border/50 overflow-hidden",
            msg.role === "assistant" 
              ? "bg-[#DA7756] text-white" 
              : "bg-card text-muted-foreground"
          )}>
            {msg.role === "assistant" ? (
              <img
                src={CLAUDE_AVATAR_SRC}
                alt="Claude"
                className="h-full w-full object-cover"
              />
            ) : (
              <img
                src={USER_AVATAR_SRC}
                alt="Borat"
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            )}
          </div>

          <div className={cn(
            "flex flex-col",
            msg.role === "user" ? "items-end max-w-[72%]" : "items-start max-w-[92%] w-full"
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
                ? "bg-secondary text-foreground rounded-tr-sm" 
                : "bg-card text-foreground border border-border/40 rounded-tl-sm font-serif prose prose-neutral dark:prose-invert max-w-none"
            )}>
              {msg.role === "assistant" ? (
                <ReactMarkdown
                  components={{
                    pre: ({ children }) => (
                      <CodeBlock
                        copied={copiedId === msg.id}
                        onCopy={() => copyToClipboard(getCodeText(children), msg.id)}
                      >
                        {children}
                      </CodeBlock>
                    ),
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              ) : (
                <div className="space-y-3">
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {msg.attachments.map((file, i) => (
                        <div key={i} className="flex items-center gap-2 bg-background/70 border border-border/60 px-3 py-1.5 rounded-lg text-xs font-sans">
                          <FileText className="w-3.5 h-3.5 text-[#DA7756]" />
                          <span>{file.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="whitespace-pre-wrap font-sans">{msg.content}</p>
                </div>
              )}
              {msg.role === "assistant" && (
                <button
                  onClick={() => copyToClipboard(msg.content, msg.id)}
                  className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-muted-foreground flex items-center gap-1 rounded-md border border-border/60 bg-background/90 px-2 py-1 hover:text-foreground hover:bg-background"
                  type="button"
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
          <div className="bg-card px-5 py-4 rounded-2xl rounded-tl-sm border border-border/40 shadow-sm flex items-center gap-1.5 h-12">
            <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
            <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
            <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce"></span>
          </div>
        </motion.div>
      )}
      <div className="h-4" />
    </div>
  );
}
