import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface LocationState {
  returnTo?: string;
  storyId?: string;
}

const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshUser, isNewUser, setIsNewUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isFirstLogin, setIsFirstLogin] = useState(false);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log("Auth callback initiated");
        
        // Check for query parameters (used by Supabase PKCE flow)
        const queryParams = new URLSearchParams(window.location.search);
        const code = queryParams.get("code");
        
        if (code) {
          console.log("Code parameter found in URL");
          // The Supabase client will automatically exchange the code for tokens
          // We just need to wait for the session to be established
          
          // Wait a moment for Supabase to process the authentication
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // Check for hash parameters (used by some OAuth flows)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");

        if (accessToken && refreshToken) {
          console.log("Access and refresh tokens found in URL hash");
          // Set the session manually if tokens are in the URL
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            throw error;
          }
        }

        // Get the current session to verify authentication worked
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          console.log("No session found after authentication attempt");
          // Try to get the session one more time after a short delay
          await new Promise(resolve => setTimeout(resolve, 2000));
          const { data: { session: retrySession } } = await supabase.auth.getSession();
          
          if (!retrySession) {
            throw new Error("Failed to establish a session");
          }
        }

        // Check if this is the first time the user has logged in
        const { data: userMetadata } = await supabase
          .from('profiles')
          .select('created_at, last_sign_in')
          .eq('id', session?.user.id)
          .single();

        // If created_at and last_sign_in are very close or last_sign_in is null, 
        // this is likely the first login
        const isFirstTimeLogin = !userMetadata?.last_sign_in || 
          (new Date(userMetadata.created_at).getTime() - new Date(userMetadata.last_sign_in).getTime() < 60000);

        if (isFirstTimeLogin) {
          setIsFirstLogin(true);
          setIsNewUser(true);
          
          // Update the last_sign_in time
          await supabase
            .from('profiles')
            .update({ last_sign_in: new Date().toISOString() })
            .eq('id', session.user.id);
        }

        // Refresh the user data
        await refreshUser();
        
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
        
        // Determine if we're in development or production
        const isDevelopment = import.meta.env.DEV;
        
        // If we're in development and the URL is the production URL, redirect to local
        const currentHost = window.location.host;
        const isProductionHost = currentHost.includes('flipmyera.com');
        
        if (isDevelopment && isProductionHost) {
          console.log("Detected production host in development mode, redirecting to local");
          const localUrl = `${window.location.protocol}//${window.location.hostname}:${window.location.port}${returnPath}`;
          window.location.href = localUrl;
          return;
        }
        
        // Redirect based on whether this is the first login
        console.log("Authentication successful, redirecting");
        if (isFirstLogin || isNewUser) {
          navigate("/upgrade");
        } else {
          navigate(returnPath);
        }
      } catch (err) {
        console.error("Error during auth callback:", err);
        setError("Authentication failed. Please try again.");
      }
    };

    handleAuthCallback();
  }, [navigate, refreshUser, setIsNewUser, isNewUser]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-red-500 mb-4">{error}</div>
        <button
          onClick={() => navigate("/auth")}
          className="px-4 py-2 bg-primary text-white rounded-md"
        >
          Back to Login
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <p className="text-lg">Completing authentication...</p>
    </div>
  );
};

export default AuthCallback; 