import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSupabaseAuth } from '@/core/integrations/supabase/auth';
import { Button } from '@/modules/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shared/components/ui/card';
import { Input } from '@/modules/shared/components/ui/input';
import { Label } from '@/modules/shared/components/ui/label';
import { useToast } from '@/modules/shared/hooks/use-toast';
import { Loader2 } from "lucide-react";
import { GoogleSignInButton } from '@/modules/shared/components/GoogleSignInButton';

interface LocationState {
  returnTo?: string;
  storyId?: string;
}

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, signIn, signUp } = useSupabaseAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const state = location.state as LocationState;
  const returnPath = state?.returnTo || "/";

  useEffect(() => {
    if (isAuthenticated) {
      navigate(returnPath);
    }
  }, [isAuthenticated, navigate, returnPath]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { error } = await signIn(email, password);
      if (error) {
        toast({ title: "Sign In Failed", description: error.message, variant: "destructive" });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { error } = await signUp(email, password, name);
      if (error) {
        toast({ title: "Sign Up Failed", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Check your email", description: "We sent you a confirmation link." });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container flex items-center justify-center min-h-[80vh] py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
            FlipMyEra
          </h1>
          <p className="text-gray-600 mt-2">
            Sign in to access your alternate timelines
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">
              {activeTab === "login" ? "Sign In to FlipMyEra" : "Create a FlipMyEra Account"}
            </CardTitle>
            <CardDescription className="text-center">
              {activeTab === "login"
                ? "Enter your credentials to access your alternate timelines"
                : "Join us to explore your alternate timelines"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-2 mb-6">
              <Button
                variant={activeTab === "login" ? "default" : "outline"}
                onClick={() => setActiveTab("login")}
                className="flex-1"
              >
                Sign In
              </Button>
              <Button
                variant={activeTab === "register" ? "default" : "outline"}
                onClick={() => setActiveTab("register")}
                className="flex-1"
              >
                Register
              </Button>
            </div>

            <GoogleSignInButton className="w-full mb-4" />

            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
              </div>
            </div>

            {activeTab === "login" ? (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700" disabled={isLoading}>
                  {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing In...</> : "Sign In"}
                </Button>
                <div className="text-center">
                  <Button variant="link" className="text-sm" onClick={() => navigate('/reset-password')}>
                    Forgot your password?
                  </Button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" type="text" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input id="signup-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input id="signup-password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700" disabled={isLoading}>
                  {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Account...</> : "Create Account"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
