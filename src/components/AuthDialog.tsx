
import { useState, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Mail, Key, Loader2, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

declare global {
  interface Window {
    turnstile: {
      render: (element: string | HTMLElement, options: any) => string;
      reset: (widgetId: string) => void;
    };
  }
}

export const AuthDialog = ({ trigger }: { trigger: React.ReactNode }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileWidgetId = useRef<string | null>(null);

  const initTurnstile = useCallback(() => {
    if (window.turnstile && !turnstileWidgetId.current) {
      turnstileWidgetId.current = window.turnstile.render('#dialog-turnstile-widget', {
        sitekey: '1x00000000000000000000AA',
        callback: function(token: string) {
          setTurnstileToken(token);
        },
      });
    }
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!turnstileToken) {
      toast({
        title: "Error",
        description: "Please complete the Turnstile challenge",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          phone,
          options: {
            data: {
              phone: phone
            },
            captchaToken: turnstileToken
          }
        });
        if (error) throw error;
        toast({
          title: "Welcome aboard! ✨",
          description: "Check your email to confirm your account.",
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
          options: {
            captchaToken: turnstileToken
          }
        });
        if (error) throw error;
        toast({
          title: "Welcome back! ✨",
          description: "Successfully signed in.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Oops!",
        description: error.message,
        variant: "destructive",
      });
      // Reset Turnstile widget on error
      if (turnstileWidgetId.current) {
        window.turnstile.reset(turnstileWidgetId.current);
        setTurnstileToken(null);
      }
    } finally {
      setLoading(false);
    }
  };

  // Initialize Turnstile when dialog opens
  const handleDialogOpen = () => {
    setTimeout(initTurnstile, 100); // Small delay to ensure DOM is ready
  };

  return (
    <Dialog onOpenChange={(open) => {
      if (open) handleDialogOpen();
    }}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-semibold text-[#4A4A4A]">
            {isSignUp ? "Create Your Memory Vault" : "Return to Your Stories"}
          </DialogTitle>
          <p className="text-center text-purple-600 mt-2">
            Save your precious e-memories here. Start for free. Add credits to create and save new e-memory books.
          </p>
        </DialogHeader>

        <form onSubmit={handleAuth} className="space-y-4 mt-4">
          <div className="space-y-2">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="email"
                placeholder="Email"
                className="pl-10"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="relative">
              <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="password"
                placeholder="Password"
                className="pl-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {isSignUp && (
            <div className="space-y-2">
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="tel"
                  placeholder="Phone Number"
                  className="pl-10"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          <div id="dialog-turnstile-widget" className="flex justify-center"></div>

          <Button
            type="submit"
            disabled={loading || !turnstileToken}
            className="w-full bg-gradient-to-r from-[#E5DEFF] to-[#FFDEE2] text-[#4A4A4A] hover:opacity-90 transition-opacity"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isSignUp ? "Creating your vault..." : "Coming back..."}
              </>
            ) : (
              <>
                {isSignUp ? "Create Memory Vault" : "Return to Stories"}
                <Sparkles className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="link"
            onClick={() => {
              setIsSignUp(!isSignUp);
              if (turnstileWidgetId.current) {
                window.turnstile.reset(turnstileWidgetId.current);
                setTurnstileToken(null);
              }
            }}
            className="w-full text-purple-600"
          >
            {isSignUp
              ? "Already have a memory vault? Sign in"
              : "New here? Create your memory vault"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
