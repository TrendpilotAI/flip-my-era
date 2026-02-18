import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSupabaseAuth } from '@/core/integrations/supabase/auth';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/modules/shared/components/ui/dialog';
import { Button } from '@/modules/shared/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/shared/components/ui/tabs';
import { Input } from '@/modules/shared/components/ui/input';
import { Label } from '@/modules/shared/components/ui/label';
import { Sparkles, LogIn, UserPlus, Loader2 } from "lucide-react";
import { GoogleSignInButton } from './GoogleSignInButton';

interface AuthDialogProps {
  trigger?: React.ReactNode | null;
  onSuccess?: () => void | Promise<void>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const AuthDialog = ({ trigger, onSuccess, open, onOpenChange }: AuthDialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const { isAuthenticated, signIn, signUp } = useSupabaseAuth();

  const isControlled = open !== undefined;
  const dialogOpen = isControlled ? open : internalOpen;

  const handleOpenChange = useCallback((value: boolean) => {
    if (!isControlled) setInternalOpen(value);
    if (!value) setIsLoading(false);
    onOpenChange?.(value);
  }, [isControlled, onOpenChange]);

  const handleSuccess = useCallback(() => {
    handleOpenChange(false);
    if (onSuccess) void onSuccess();
  }, [handleOpenChange, onSuccess]);

  const defaultTrigger = (
    <Button variant="outline" className="gap-2">
      <LogIn className="h-4 w-4" />
      Sign In
    </Button>
  );

  const shouldRenderTrigger = trigger !== null;

  useEffect(() => {
    if (isAuthenticated && dialogOpen) handleSuccess();
  }, [isAuthenticated, dialogOpen, handleSuccess]);

  useEffect(() => {
    if (!dialogOpen) setIsLoading(false);
  }, [dialogOpen]);

  if (isAuthenticated) {
    if (!shouldRenderTrigger) return null;
    return <>{trigger || defaultTrigger}</>;
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const { error } = await signIn(email, password);
    if (error) setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const { error } = await signUp(email, password, name);
    if (error) setIsLoading(false);
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
      {shouldRenderTrigger && (
        <DialogTrigger asChild>
          {trigger || defaultTrigger}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <Sparkles className="h-6 w-6 text-purple-500" />
            Welcome to Flip My Era
          </DialogTitle>
          <DialogDescription className="text-lg text-gray-600">
            Sign up to save your stories, access your personal dashboard, and unlock premium features
          </DialogDescription>
        </DialogHeader>
        
        <GoogleSignInButton className="w-full" />

        <div className="relative my-2">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or</span>
          </div>
        </div>

        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          
          <TabsContent value="signin" className="space-y-4 mt-4">
            <form onSubmit={handleSignIn} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="dialog-email">Email</Label>
                <Input id="dialog-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="dialog-password">Password</Label>
                <Input id="dialog-password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600" disabled={isLoading}>
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing In...</> : <><LogIn className="h-4 w-4 mr-2" /> Sign In</>}
              </Button>
            </form>
          </TabsContent>
          
          <TabsContent value="signup" className="space-y-4 mt-4">
            <form onSubmit={handleSignUp} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="dialog-name">Name</Label>
                <Input id="dialog-name" type="text" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="dialog-signup-email">Email</Label>
                <Input id="dialog-signup-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="dialog-signup-password">Password</Label>
                <Input id="dialog-signup-password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600" disabled={isLoading}>
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Account...</> : <><UserPlus className="h-4 w-4 mr-2" /> Create Account</>}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
        
        <div className="text-center pt-4 border-t">
          <p className="text-xs text-gray-500">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
