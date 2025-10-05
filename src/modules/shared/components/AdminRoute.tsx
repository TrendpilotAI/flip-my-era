import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useClerkAuth } from '@/modules/auth/contexts';
import { Loader2 } from "lucide-react";

interface AdminRouteProps {
  children: ReactNode;
}

export const AdminRoute = ({ children }: AdminRouteProps) => {
  const { user, isLoading, isAuthenticated } = useClerkAuth();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Redirect to auth if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // Check if user is admin (you can customize this logic)
  const isAdmin = user?.email === "admin@flipmyera.com" || 
                  user?.email === "danny.ijdo@gmail.com" ||
                  user?.email?.includes("trendpilot");

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}; 