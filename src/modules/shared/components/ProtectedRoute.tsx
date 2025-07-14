import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useClerkAuth } from '@/modules/auth/contexts/ClerkAuthContext';
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredCredits?: number;
}

export const ProtectedRoute = ({ 
  children, 
  requiredCredits 
}: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading, user } = useClerkAuth();
  const location = useLocation();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Loading...</span>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Check credit balance if required
  if (requiredCredits && user) {
    const userCredits = user.credits || 0;
    
    // Redirect to purchase page if user doesn't have enough credits
    if (userCredits < requiredCredits) {
      return <Navigate to="/upgrade" state={{ from: location }} replace />;
    }
  }

  // If authenticated and has sufficient credits, render children
  return <>{children}</>;
}; 