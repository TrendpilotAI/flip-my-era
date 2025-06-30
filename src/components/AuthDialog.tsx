import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useClerkAuth } from "@/contexts/ClerkAuthContext";
import { Loader2, Sparkles } from "lucide-react";

interface AuthDialogProps {
  trigger: React.ReactNode;
  onSuccess?: () => void;
}

export const AuthDialog = ({ trigger, onSuccess }: AuthDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { SignInButton, SignUpButton, isAuthenticated } = useClerkAuth();

  const handleSuccess = () => {
    setIsOpen(false);
    if (onSuccess) {
      onSuccess();
    }
  };

  // If user is already authenticated, just render the trigger
  if (isAuthenticated) {
    return <>{trigger}</>;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
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
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            <SignUpButton mode="modal" afterSignUpUrl="/dashboard" afterSignInUrl="/dashboard">
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
                    <Sparkles className="mr-2 h-4 w-4" />
                    Create Account
                  </>
                )}
              </Button>
            </SignUpButton>
            
            <SignInButton mode="modal" afterSignInUrl="/dashboard">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setIsLoading(true)}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </SignInButton>
          </div>
          
          <div className="text-center text-sm text-gray-500">
            <p>By signing up, you agree to our Terms of Service and Privacy Policy</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 