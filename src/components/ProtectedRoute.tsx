import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredSubscription?: "free" | "basic" | "premium";
}

export const ProtectedRoute = ({ 
  children, 
  requiredSubscription 
}: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading, user } = useAuth();
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

  // Check subscription level if required
  if (requiredSubscription && user) {
    const userSubscription = user.subscription_status || "free";
    
    // Define subscription levels for comparison
    const levels = {
      free: 0,
      basic: 1,
      premium: 2
    };
    
    // Redirect to upgrade page if subscription level is not sufficient
    if (levels[userSubscription] < levels[requiredSubscription]) {
      return <Navigate to="/upgrade" state={{ from: location }} replace />;
    }
  }

  // If authenticated and subscription level is sufficient, render children
  return <>{children}</>;
}; 