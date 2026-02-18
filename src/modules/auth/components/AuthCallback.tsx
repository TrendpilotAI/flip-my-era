import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSupabaseAuth } from '@/core/integrations/supabase/auth';
import { Loader2, AlertCircle } from "lucide-react";

const AuthCallback = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useSupabaseAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Supabase handles the OAuth callback automatically via detectSessionInUrl
    // We just wait for the session to be established then redirect
    if (isLoading) return;

    const state = sessionStorage.getItem('auth_return_path');
    let returnPath = '/';
    if (state) {
      try {
        const parsed = JSON.parse(state);
        returnPath = parsed.returnTo || '/';
        sessionStorage.removeItem('auth_return_path');
      } catch {}
    }

    if (isAuthenticated) {
      navigate(returnPath, { replace: true });
    } else {
      // Give it a moment, then redirect to auth
      const timer = setTimeout(() => {
        if (!isAuthenticated) navigate('/auth', { replace: true });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
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
