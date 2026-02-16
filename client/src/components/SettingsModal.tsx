import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { KeyRound, ShieldCheck } from "lucide-react";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const [apiKey, setApiKey] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    const storedKey = localStorage.getItem("anthropic_api_key");
    if (storedKey) setApiKey(storedKey);
  }, [open]);

  const handleSave = () => {
    if (!apiKey.trim()) {
      localStorage.removeItem("anthropic_api_key");
    } else {
      localStorage.setItem("anthropic_api_key", apiKey.trim());
    }
    toast({ title: "Settings saved", description: "Your API key has been updated." });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif text-xl">
            <KeyRound className="w-5 h-5 text-primary" />
            API Configuration
          </DialogTitle>
          <DialogDescription>
            Enter your Anthropic API Key to enable chat functionality. 
            This is stored locally in your browser.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="api-key">Anthropic API Key</Label>
            <Input
              id="api-key"
              type="password"
              placeholder="sk-ant-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="font-mono text-sm"
            />
            <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
              <ShieldCheck className="w-3 h-3 text-green-600" />
              Your key is never stored on our servers, only passed through for the request.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} className="bg-[#DA7756] hover:bg-[#C56545] text-white">Save Changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
