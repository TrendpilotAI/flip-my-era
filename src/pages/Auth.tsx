
import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Mail, Key, Loader2 } from "lucide-react";

declare global {
  interface Window {
    turnstile: {
      render: (element: string | HTMLElement, options: any) => string;
      reset: (widgetId: string) => void;
    };
  }
}

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileWidgetId = useRef<string | null>(null);

  const initTurnstile = useCallback(() => {
    if (window.turnstile && !turnstileWidgetId.current) {
      turnstileWidgetId.current = window.turnstile.render('#turnstile-widget', {
        sitekey: '0x4AAAAAAA-Xwq8k7B8XTxwD',
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
        console.log("Signing up with captcha token:", turnstileToken);
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            captchaToken: turnstileToken
          }
        });
        if (error) throw error;
        toast({
          title: "Check your email",
          description: "We've sent you a confirmation link.",
        });
      } else {
        console.log("Signing in with captcha token:", turnstileToken);
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
          options: {
            captchaToken: turnstileToken
          }
        });
        if (error) throw error;
        toast({
          title: "Welcome back!",
          description: "Successfully signed in.",
        });
        navigate("/");
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      toast({
        title: "Error",
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

  // Initialize Turnstile when component mounts
  useEffect(() => {
    initTurnstile();
  }, [initTurnstile]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white/95 backdrop-blur-lg p-8 rounded-xl shadow-xl">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {isSignUp ? "Create your account" : "Sign in to your account"}
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleAuth}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="pl-10"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="pl-10"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div id="turnstile-widget" className="flex justify-center"></div>

          <div>
            <Button
              type="submit"
              disabled={loading || !turnstileToken}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isSignUp ? "Creating account..." : "Signing in..."}
                </>
              ) : (
                isSignUp ? "Sign up" : "Sign in"
              )}
            </Button>
          </div>

          <div className="text-center">
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
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              {isSignUp
                ? "Already have an account? Sign in"
                : "Don't have an account? Sign up"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Auth;
