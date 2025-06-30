import { useState } from "react";
import { useClerkAuth } from "@/contexts/ClerkAuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, LogIn, UserPlus } from "lucide-react";

interface AuthDialogProps {
  trigger?: React.ReactNode;
}

export const AuthDialog = ({ trigger }: AuthDialogProps) => {
  const [open, setOpen] = useState(false);
  const { SignInButton, SignUpButton } = useClerkAuth();

  const defaultTrigger = (
    <Button variant="outline" className="gap-2">
      <LogIn className="h-4 w-4" />
      Sign In
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Welcome to Flip My Era
          </DialogTitle>
          <DialogDescription>
            Sign in to save your stories and access your personal dashboard
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
                <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600">
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In
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
                <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create Account
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