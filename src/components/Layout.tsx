import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { BookOpen, LogOut, Settings, User, Crown } from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useClerkAuth } from "@/contexts/ClerkAuthContext";
import { SignedIn, SignedOut } from "@clerk/clerk-react";

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user, signOut, UserButton } = useClerkAuth();
  const { toast } = useToast();

  // Check if user is admin
  const isAdmin = user?.email === "admin@flipmyera.com" || 
                  user?.email === "danny.ijdo@gmail.com" ||
                  user?.email?.includes("trendpilot");

  const handleSignOut = async () => {
    try {
      const { error } = await signOut();
      if (error) throw error;
      
      toast({
        title: "Successfully Signed Out",
        description: "You have been securely logged out of your account. Come back soon!",
      });
    } catch (error) {
      console.error("Sign out error:", error);
      toast({
        title: "Sign Out Failed",
        description: "We couldn't sign you out properly. Please try again or refresh the page.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen">
      <nav className="fixed top-0 right-0 p-4 z-50 flex gap-2">
        <SignedIn>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="bg-white/80 backdrop-blur-sm">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-2 py-1.5 text-sm font-medium">
                {user?.name || user?.email}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/stories" className="flex items-center">
                  <BookOpen className="h-4 w-4 mr-2" />
                  My Stories
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/upgrade" className="flex items-center">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Upgrade Plan
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/settings-dashboard" className="flex items-center">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Link>
              </DropdownMenuItem>
              {isAdmin && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/admin" className="flex items-center text-purple-600">
                      <Crown className="h-4 w-4 mr-2" />
                      Admin Dashboard
                    </Link>
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="flex items-center text-red-500">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SignedIn>
        <SignedOut>
          <Link to="/auth">
            <Button variant="outline" size="icon" className="bg-white/80 backdrop-blur-sm">
              <User className="h-5 w-5" />
            </Button>
          </Link>
        </SignedOut>
      </nav>
      {children}
    </div>
  );
};
