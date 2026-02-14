import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useClerkAuth } from '@/modules/auth/contexts';
import { Button } from '@/modules/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shared/components/ui/card';
import { useToast } from '@/modules/shared/hooks/use-toast';
import { Loader2 } from "lucide-react";
import { SignIn, SignUp } from "@clerk/clerk-react";

interface LocationState {
  returnTo?: string;
  storyId?: string;
}

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useClerkAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("login");

  // Get return path from location state if available
  const state = location.state as LocationState;
  const returnPath = state?.returnTo || "/";

  useEffect(() => {
    // If user is already authenticated, redirect them
    if (isAuthenticated) {
      navigate(returnPath);
    }
  }, [isAuthenticated, navigate, returnPath]);

  return (
    <div className="container flex items-center justify-center min-h-[80vh] py-8">
      <div className="w-full max-w-md">
        {/* FlipMyEra Branding */}
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
            
            {activeTab === "login" ? (
              <SignIn 
                appearance={{
                  elements: {
                    formButtonPrimary: "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700",
                    card: "shadow-none",
                    headerTitle: "hidden",
                    headerSubtitle: "hidden",
                  }
                }}
                fallbackRedirectUrl={returnPath}
                signInFallbackRedirectUrl={returnPath}
              />
            ) : (
              <SignUp 
                appearance={{
                  elements: {
                    formButtonPrimary: "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700",
                    card: "shadow-none",
                    headerTitle: "hidden",
                    headerSubtitle: "hidden",
                  }
                }}
                fallbackRedirectUrl={returnPath}
                signUpFallbackRedirectUrl={returnPath}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
