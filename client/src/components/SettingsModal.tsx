import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { KeyRound, MoonStar, ShieldCheck } from "lucide-react";
import { useTheme } from "next-themes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CLAUDE_MODELS, DEFAULT_MODEL } from "@/lib/models";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const [apiKey, setApiKey] = useState("");
  const [appSecret, setAppSecret] = useState("");
  const [model, setModel] = useState(DEFAULT_MODEL);
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const storedKey = localStorage.getItem("anthropic_api_key");
    if (storedKey) setApiKey(storedKey);
    const storedSecret = localStorage.getItem("app_secret");
    if (storedSecret) setAppSecret(storedSecret);
    setModel(localStorage.getItem("anthropic_model") || DEFAULT_MODEL);
  }, [open]);

  const handleSave = () => {
    if (!apiKey.trim()) {
      localStorage.removeItem("anthropic_api_key");
    } else {
      localStorage.setItem("anthropic_api_key", apiKey.trim());
    }
    if (!appSecret.trim()) {
      localStorage.removeItem("app_secret");
    } else {
      localStorage.setItem("app_secret", appSecret.trim());
    }
    localStorage.setItem("anthropic_model", model);
    toast({ title: "Settings saved", description: "Your settings have been updated." });
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

          <div className="space-y-2">
            <Label htmlFor="app-secret">App Secret</Label>
            <Input
              id="app-secret"
              type="password"
              placeholder="Leave blank if APP_SECRET is not set on the server"
              value={appSecret}
              onChange={(e) => setAppSecret(e.target.value)}
              className="font-mono text-sm"
            />
            <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
              <ShieldCheck className="w-3 h-3 text-green-600" />
              Must match the APP_SECRET set in the server environment.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="theme">Appearance</Label>
            <Select value={theme ?? "system"} onValueChange={setTheme}>
              <SelectTrigger id="theme">
                <div className="flex items-center gap-2">
                  <MoonStar className="h-4 w-4 text-primary" />
                  <SelectValue placeholder="Choose theme" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">
              Theme preference is stored locally in your browser.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="model">Claude Model</Label>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger id="model">
                <SelectValue placeholder="Choose model" />
              </SelectTrigger>
              <SelectContent>
                {CLAUDE_MODELS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">
              This model will be used for new requests from this browser.
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
