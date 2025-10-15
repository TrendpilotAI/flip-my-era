import { useCallback, useEffect, useState } from "react";
import { useClerkAuth } from '@/modules/auth/contexts';
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
import { Sparkles, LogIn, UserPlus, Loader2 } from "lucide-react";

interface AuthDialogProps {
  trigger?: React.ReactNode | null;
  onSuccess?: () => void | Promise<void>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const AuthDialog = ({ trigger, onSuccess, open, onOpenChange }: AuthDialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { SignInButton, SignUpButton, isAuthenticated } = useClerkAuth();

  const isControlled = open !== undefined;
  const dialogOpen = isControlled ? open : internalOpen;

  const handleOpenChange = useCallback((value: boolean) => {
    if (!isControlled) {
      setInternalOpen(value);
    }
    if (!value) {
      setIsLoading(false);
    }
    onOpenChange?.(value);
  }, [isControlled, onOpenChange]);

  const handleSuccess = useCallback(() => {
    handleOpenChange(false);
    if (onSuccess) {
      void onSuccess();
    }
  }, [handleOpenChange, onSuccess]);

  const defaultTrigger = (
    <Button variant="outline" className="gap-2">
      <LogIn className="h-4 w-4" />
      Sign In
    </Button>
  );

  const shouldRenderTrigger = trigger !== null;

  // If user is already authenticated, just render the trigger
  if (isAuthenticated) {
    if (!shouldRenderTrigger) {
      return null;
    }
    return <>{trigger || defaultTrigger}</>;
  }

  useEffect(() => {
    if (isAuthenticated && dialogOpen) {
      handleSuccess();
    }
  }, [isAuthenticated, dialogOpen, handleSuccess]);

  useEffect(() => {
    if (!dialogOpen) {
      setIsLoading(false);
    }
  }, [dialogOpen]);

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
        
        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          
          <TabsContent value="signin" className="space-y-4 mt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                Welcome back! Sign in to continue your storytelling journey.
              </p>
              <SignInButton mode="modal">
                <Button 
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
                  onClick={() => setIsLoading(true)}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    <>
                      <LogIn className="h-4 w-4 mr-2" />
                      Sign In
                    </>
                  )}
                </Button>
              </SignInButton>
            </div>
          </TabsContent>
          
          <TabsContent value="signup" className="space-y-4 mt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                Join thousands of users creating amazing alternate timeline stories!
              </p>
              <SignUpButton mode="modal">
                <Button 
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
                  onClick={() => setIsLoading(true)}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Create Account
                    </>
                  )}
                </Button>
              </SignUpButton>
            </div>
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
