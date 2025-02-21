
import { Link } from "react-router-dom";
import { Settings as SettingsIcon, LogIn } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "Successfully signed out of your account.",
    });
    navigate("/auth");
  };

  return (
    <div className="relative min-h-screen">
      <nav className="absolute top-4 right-4 z-50 flex items-center gap-4">
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger className="focus:outline-none">
              <Avatar className="h-10 w-10 cursor-pointer">
                <AvatarImage src={user.user_metadata.avatar_url} />
                <AvatarFallback className="bg-purple-500 text-white">
                  {user.email?.[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate("/profile")}>
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSignOut}>
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Link
            to="/auth"
            className="p-2 bg-white/20 backdrop-blur-lg rounded-full hover:bg-white/30 transition-colors flex items-center gap-2"
            title="Sign in"
          >
            <LogIn className="w-6 h-6 text-white" />
          </Link>
        )}
        <Link
          to="/settings"
          className="p-2 bg-white/20 backdrop-blur-lg rounded-full hover:bg-white/30 transition-colors"
          title="Settings"
        >
          <SettingsIcon className="w-6 h-6 text-white" />
        </Link>
      </nav>
      {children}
    </div>
  );
};
