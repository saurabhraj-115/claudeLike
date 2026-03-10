import { Link, useLocation } from "wouter";
import { useConversations, useDeleteConversation } from "@/hooks/use-chat";
import { Button } from "@/components/ui/button";
import { Plus, MessageSquare, Trash2, Settings, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SettingsModal } from "./SettingsModal";

export function Sidebar() {
  const [location, setLocation] = useLocation();
  const { data: conversations } = useConversations();
  const deleteMutation = useDeleteConversation();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleNewChat = () => {
    setLocation("/");
  };

  const handleDelete = (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("Delete this conversation?")) {
      deleteMutation.mutate(id, {
        onSuccess: () => {
          if (location === `/chat/${id}`) {
            setLocation("/");
          }
        }
      });
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-secondary/70 border-r border-border/50 backdrop-blur-sm">
      <div className="p-4">
        <Button 
          onClick={handleNewChat}
          className="w-full justify-start gap-2 bg-[#DA7756] hover:bg-[#C56545] text-white font-medium shadow-sm h-11 rounded-lg transition-all"
        >
          <Plus className="w-5 h-5" />
          New chat
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1 scrollbar-thin">
        {conversations?.map((conv) => (
          <Link key={conv.id} href={`/chat/${conv.id}`}>
            <div 
              className={cn(
                "group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 text-sm",
                location === `/chat/${conv.id}` 
                  ? "bg-card shadow-sm text-foreground font-medium" 
                  : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
              )}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <MessageSquare className="w-4 h-4 shrink-0 opacity-50" />
                <div className="flex flex-col truncate">
                  <span className="truncate">{conv.title || "New Chat"}</span>
                  <span className="text-[10px] opacity-60 font-normal">
                    {conv.createdAt ? format(new Date(conv.createdAt), "MMM d, h:mm a") : ""}
                  </span>
                </div>
              </div>
              
              <button 
                onClick={(e) => handleDelete(e, conv.id)}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 hover:text-destructive rounded transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </Link>
        ))}
      </div>

      <div className="p-4 border-t border-border/20 bg-foreground/5">
        <div 
          onClick={() => setIsSettingsOpen(true)}
          className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-background/70 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 border border-border/60 flex items-center justify-center text-xs font-bold text-primary">
            JD
          </div>
          <div className="flex flex-col text-sm">
            <span className="font-medium">Jane Doe</span>
            <span className="text-xs text-muted-foreground">Free Plan</span>
          </div>
          <Settings className="w-4 h-4 ml-auto text-muted-foreground" />
        </div>
      </div>

      <SettingsModal open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-[280px] h-screen fixed left-0 top-0">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar Trigger */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="bg-secondary/90 shadow-sm border border-border/50 backdrop-blur-sm">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-[280px]">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
