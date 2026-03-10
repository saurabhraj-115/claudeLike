import { Sparkles, Code2, PenTool, BookOpen } from "lucide-react";
import { motion } from "framer-motion";

interface WelcomeScreenProps {
  onPromptSelect: (prompt: string) => void;
}

export function WelcomeScreen({ onPromptSelect }: WelcomeScreenProps) {
  const prompts = [
    {
      icon: <PenTool className="w-5 h-5 text-orange-500" />,
      title: "Draft an email",
      text: "Write a professional email to a client about a delay."
    },
    {
      icon: <Code2 className="w-5 h-5 text-blue-500" />,
      title: "Help me debug",
      text: "Find the bug in this React useEffect hook..."
    },
    {
      icon: <BookOpen className="w-5 h-5 text-emerald-500" />,
      title: "Summarize text",
      text: "Summarize this article into 3 key bullet points."
    },
    {
      icon: <Sparkles className="w-5 h-5 text-purple-500" />,
      title: "Brainstorm ideas",
      text: "Give me 5 creative ideas for a marketing campaign."
    }
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-4xl mx-auto w-full">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <div className="w-16 h-16 bg-[#DA7756] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-orange-500/20">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-4xl font-serif font-medium text-foreground mb-3">
          Good afternoon
        </h1>
        <p className="text-muted-foreground text-lg">
          How can I help you today?
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
        {prompts.map((prompt, idx) => (
          <motion.button
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.1 }}
            onClick={() => onPromptSelect(prompt.text)}
            className="text-left p-4 bg-card hover:bg-card/80 border border-border/50 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-muted/50 rounded-lg group-hover:bg-muted transition-colors">
                {prompt.icon}
              </div>
              <div>
                <h3 className="font-medium text-foreground mb-1 text-sm">{prompt.title}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2">{prompt.text}</p>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
