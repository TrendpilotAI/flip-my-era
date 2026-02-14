import { useEffect, lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { initSentry } from "@/core/integrations/sentry";
import { performanceMonitor } from "@/core/utils/performance";
import { posthogEvents } from "@/core/integrations/posthog";
import { Layout } from "@/modules/shared/components/Layout";
import { Toaster } from "@/modules/shared/components/ui/toaster";
import { ClerkAuthProvider } from "@/modules/auth/contexts/ClerkAuthContext";
import { ProtectedRoute } from "@/modules/shared/components/ProtectedRoute";
import { AdminRoute } from "@/modules/shared/components/AdminRoute";
import { ErrorBoundary } from "@/modules/shared/components/ErrorBoundary";

// Lazy-loaded route components
const Index = lazy(() => import("@/app/pages/Index"));
const NotFound = lazy(() => import("@/app/pages/NotFound"));
const Checkout = lazy(() => import("@/app/pages/Checkout"));
const CheckoutSuccess = lazy(() => import("@/app/pages/CheckoutSuccess"));
const UpgradePlan = lazy(() => import("@/app/pages/UpgradePlan"));
const AdminDashboard = lazy(() => import("@/app/pages/AdminDashboard"));
const AdminIntegrations = lazy(() => import("@/app/pages/AdminIntegrations"));
const AdminUsers = lazy(() => import("@/app/pages/AdminUsers"));
const AdminCredits = lazy(() => import("@/app/pages/AdminCredits"));
const Auth = lazy(() => import("@/modules/auth/components/Auth"));
const AuthCallback = lazy(() => import("@/modules/auth/components/AuthCallback"));
const ResetPassword = lazy(() => import("@/modules/auth/components/ResetPassword"));
const UserDashboard = lazy(() => import("@/modules/user/components/UserDashboard"));
const FAQ = lazy(() => import("@/app/pages/FAQ"));
const PlanSelector = lazy(() => import("@/app/pages/PlanSelector"));

// Component to track page views for PostHog
function PageViewTracker() {
  const location = useLocation();

  useEffect(() => {
    // Track page view in PostHog
    posthogEvents.pageViewed(location.pathname, {
      search: location.search,
      hash: location.hash,
    });
  }, [location]);

  return null;
}

function App() {
  // Initialize error tracking and performance monitoring
  // PostHog is initialized in main.tsx before React renders
  useEffect(() => {
    initSentry();
    performanceMonitor.init();
  }, []);

  return (
    <ErrorBoundary>
      <ClerkAuthProvider>
        <Router>
          <PageViewTracker />
          <Layout>
          <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
            <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/plans" element={<PlanSelector />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            
            {/* Protected routes - New unified dashboard */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <UserDashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* Legacy routes - redirect to new dashboard */}
            <Route 
              path="/stories" 
              element={
                <ProtectedRoute>
                  <UserDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/settings-dashboard" 
              element={
                <ProtectedRoute>
                  <UserDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute>
                  <UserDashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* Admin routes */}
            <Route 
              path="/admin" 
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              } 
            />
            <Route 
              path="/admin/integrations" 
              element={
                <AdminRoute>
                  <AdminIntegrations />
                </AdminRoute>
              } 
            />
            <Route 
              path="/admin/users" 
              element={
                <AdminRoute>
                  <AdminUsers />
                </AdminRoute>
              } 
            />
            <Route 
              path="/admin/credits" 
              element={
                <AdminRoute>
                  <AdminCredits />
                </AdminRoute>
              } 
            />
            
            {/* Checkout routes */}
            <Route 
              path="/checkout" 
              element={
                <ProtectedRoute>
                  <Checkout />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/checkout/success" 
              element={
                <ProtectedRoute>
                  <CheckoutSuccess />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/upgrade" 
              element={
                <ProtectedRoute>
                  <UpgradePlan />
                </ProtectedRoute>
              } 
            />
            
            {/* Premium features */}
            <Route 
              path="/premium-features" 
              element={
                <ProtectedRoute requiredSubscription="premium">
                  <div>Premium Features</div>
                </ProtectedRoute>
              } 
            />
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </Layout>
        <Toaster />
      </Router>
    </ClerkAuthProvider>
    </ErrorBoundary>
  );
}

export default App;
