import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { BookOpen, LogOut, Settings, User } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user, signOut } = useAuth();
  const { toast } = useToast();

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

  const handleSettingsClick = async () => {
    const { data: settings } = await supabase
      .from('api_settings')
      .select('*')
      .limit(1)
      .single();

    if (!settings?.groq_api_key) {
      toast({
        title: "API Configuration Missing",
        description: "Your account requires API configuration to access all features. Please contact support for assistance.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen">
      <nav className="fixed top-0 right-0 p-4 z-50 flex gap-2">
        {isAuthenticated ? (
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
                <Link to="/dashboard" className="flex items-center">
                  <BookOpen className="h-4 w-4 mr-2" />
                  My Dashboard
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/dashboard?tab=billing" className="flex items-center">
                  <Settings className="h-4 w-4 mr-2" />
                  Account & Billing
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="flex items-center text-red-500">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Link to="/auth">
            <Button variant="outline" size="icon" className="bg-white/80 backdrop-blur-sm">
              <User className="h-5 w-5" />
            </Button>
          </Link>
        )}
      </nav>
      {children}
    </div>
  );
};
