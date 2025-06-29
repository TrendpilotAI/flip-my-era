import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useClerkAuth } from "@/contexts/ClerkAuthContext";
import { Loader2 } from "lucide-react";
import { AlertCircle } from "lucide-react";

interface LocationState {
  returnTo?: string;
  storyId?: string;
}

const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading } = useClerkAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log("Clerk auth callback initiated");
        
        // Wait for Clerk to process the authentication
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check if we have a return path in session storage
        const state = sessionStorage.getItem('auth_return_path');
        let returnPath = '/';
        
        if (state) {
          try {
            const parsedState = JSON.parse(state) as LocationState;
            returnPath = parsedState.returnTo || '/';
            sessionStorage.removeItem('auth_return_path');
          } catch (e) {
            console.error("Error parsing return path:", e);
          }
        }
        
        // If authenticated, redirect to the return path
        if (isAuthenticated) {
          console.log("User authenticated, redirecting to:", returnPath);
          navigate(returnPath, { replace: true });
        } else {
          // If not authenticated after a reasonable time, redirect to auth page
          setTimeout(() => {
            if (!isAuthenticated) {
              console.log("Authentication failed, redirecting to auth page");
              navigate('/auth', { replace: true });
            }
          }, 3000);
        }
      } catch (error) {
        console.error("Auth callback error:", error);
        setError("Authentication failed. Please try again.");
        setTimeout(() => {
          navigate('/auth', { replace: true });
        }, 3000);
      }
    };

    handleAuthCallback();
  }, [navigate, isAuthenticated, isLoading]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <AlertCircle className="h-12 w-12 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Authentication Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">Redirecting to sign-in page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Completing Sign In</h2>
        <p className="text-gray-600">Please wait while we complete your authentication...</p>
      </div>
    </div>
  );
};

export default AuthCallback; 