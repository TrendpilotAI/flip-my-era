import { Link, useLocation } from "react-router-dom";
import { Button } from '@/modules/shared/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/modules/shared/components/ui/dropdown-menu';
import { BookOpen, LogOut, Settings, User, Crown, Sparkles, BookText, UserCircle, LayoutDashboard, History, Palette } from "lucide-react";
import { useToast } from '@/modules/shared/hooks/use-toast';
import { useClerkAuth } from '@/modules/auth/contexts/ClerkAuthContext';
import { useTheme } from '@/modules/shared/contexts/ThemeContext';
import { SignedIn, SignedOut } from "@clerk/clerk-react";
import { useState, useEffect, useRef } from "react";

export const NavigationBar = () => {
  const { isAuthenticated, user, signOut } = useClerkAuth();
  const { currentTheme } = useTheme();
  const { toast } = useToast();
  const location = useLocation();
  const [showAccountPopup, setShowAccountPopup] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  // Check if user is admin
  const isAdmin = user?.email === "admin@flipmyera.com" || 
                  user?.email === "danny.ijdo@gmail.com" ||
                  user?.email?.includes("trendpilot");

  // Handle clicking outside popup to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setShowAccountPopup(false);
      }
    };

    if (showAccountPopup) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAccountPopup]);

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

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ 
                  background: `linear-gradient(135deg, ${currentTheme.colors.primary}, ${currentTheme.colors.secondary})`
                }}
              >
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span 
                className="text-xl font-bold bg-clip-text text-transparent"
                style={{ 
                  backgroundImage: `linear-gradient(135deg, ${currentTheme.colors.primary}, ${currentTheme.colors.secondary})`
                }}
              >
                Flip My Era
              </span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            {/* About Section */}
            <Link 
              to="/about" 
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/about') 
                  ? 'bg-opacity-10' 
                  : 'text-gray-700 hover:bg-opacity-10'
              }`}
              style={{
                color: isActive('/about') ? currentTheme.colors.primary : undefined,
                backgroundColor: isActive('/about') ? `${currentTheme.colors.primary}20` : undefined,
              }}
              onMouseEnter={(e) => {
                if (!isActive('/about')) {
                  e.currentTarget.style.color = currentTheme.colors.primary;
                  e.currentTarget.style.backgroundColor = `${currentTheme.colors.primary}20`;
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive('/about')) {
                  e.currentTarget.style.color = '';
                  e.currentTarget.style.backgroundColor = '';
                }
              }}
            >
              <UserCircle className="w-4 h-4" />
              <span>About</span>
            </Link>

            {/* Story Section */}
            <Link 
              to="/" 
              className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors text-gray-700"
              style={{
                color: isActive('/') ? currentTheme.colors.primary : undefined,
                backgroundColor: isActive('/') ? `${currentTheme.colors.primary}20` : undefined,
              }}
              onMouseEnter={(e) => {
                if (!isActive('/')) {
                  e.currentTarget.style.color = currentTheme.colors.primary;
                  e.currentTarget.style.backgroundColor = `${currentTheme.colors.primary}20`;
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive('/')) {
                  e.currentTarget.style.color = '';
                  e.currentTarget.style.backgroundColor = '';
                }
              }}
            >
              <BookOpen className="w-4 h-4" />
              <span>Story</span>
            </Link>

            {/* Ebook Section */}
            <Link 
              to="/ebook-builder" 
              className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors text-gray-700"
              style={{
                color: isActive('/ebook-builder') ? currentTheme.colors.primary : undefined,
                backgroundColor: isActive('/ebook-builder') ? `${currentTheme.colors.primary}20` : undefined,
              }}
              onMouseEnter={(e) => {
                if (!isActive('/ebook-builder')) {
                  e.currentTarget.style.color = currentTheme.colors.primary;
                  e.currentTarget.style.backgroundColor = `${currentTheme.colors.primary}20`;
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive('/ebook-builder')) {
                  e.currentTarget.style.color = '';
                  e.currentTarget.style.backgroundColor = '';
                }
              }}
            >
              <BookText className="w-4 h-4" />
              <span>Ebook</span>
            </Link>

            {/* Account Section */}
            <SignedIn>
              <div className="relative" ref={popupRef}>
                <Button 
                  variant="ghost" 
                  onClick={() => setShowAccountPopup(!showAccountPopup)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors text-gray-700"
                  style={{
                    color: location.pathname.startsWith('/dashboard') ? currentTheme.colors.primary : undefined,
                    backgroundColor: location.pathname.startsWith('/dashboard') ? `${currentTheme.colors.primary}20` : undefined,
                  }}
                >
                  <User className="w-4 h-4" />
                  <span>Account</span>
                </Button>
                
                {/* Account Popup - Left Aligned */}
                {showAccountPopup && (
                  <div className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50 min-w-[200px]">
                    <div className="space-y-2">
                      <Button 
                        variant="ghost"
                        onClick={() => {
                          setShowAccountPopup(false);
                          window.location.href = '/dashboard';
                        }}
                        className="w-full justify-start"
                      >
                        <LayoutDashboard className="h-4 w-4 mr-2" />
                        Dashboard
                      </Button>
                      <Button 
                        variant="ghost"
                        onClick={() => {
                          setShowAccountPopup(false);
                          window.location.href = '/past-generations';
                        }}
                        className="w-full justify-start"
                      >
                        <History className="h-4 w-4 mr-2" />
                        Past Generations
                      </Button>
                      <Button 
                        variant="ghost"
                        onClick={() => {
                          setShowAccountPopup(false);
                          window.location.href = '/survey';
                        }}
                        className="w-full justify-start"
                      >
                        <Palette className="h-4 w-4 mr-2" />
                        Change Theme
                      </Button>
                      <Button 
                        variant="ghost"
                        onClick={() => {
                          setShowAccountPopup(false);
                          handleSignOut();
                        }}
                        className="w-full justify-start text-red-600 hover:text-red-700"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </SignedIn>
            <SignedOut>
              <Link to="/auth">
                <Button 
                  variant="ghost" 
                  className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span>Sign In</span>
                </Button>
              </Link>
            </SignedOut>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <SignedIn>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5 text-sm font-medium">
                    {user?.name || user?.email}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/about" className="flex items-center">
                      <UserCircle className="h-4 w-4 mr-2" />
                      About
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/" className="flex items-center">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Story
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/ebook-builder" className="flex items-center">
                      <BookText className="h-4 w-4 mr-2" />
                      Ebook
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard" className="flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      My Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/survey" className="flex items-center">
                      <Palette className="h-4 w-4 mr-2" />
                      Change Theme
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
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </Link>
            </SignedOut>
          </div>
        </div>
      </div>
    </nav>
  );
}; 