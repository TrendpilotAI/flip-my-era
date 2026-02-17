import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Layout, ProtectedRoute, AdminRoute } from "@/modules/shared";
import { Toaster } from "@/modules/shared/components/ui/toaster";
import { ClerkAuthProvider } from "@/modules/auth";
import React, { lazy, Suspense } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { performanceMonitor } from "@/core/utils/performance";
import { ErrorBoundary } from "@/modules/shared/components/ErrorBoundary";
import { DashboardSkeleton, CheckoutSkeleton } from "@/modules/shared/components/Skeleton";

// Public components (eagerly loaded)
import Index from "@/app/pages/Index";
import Auth from "@/modules/auth/components/Auth";
import AuthCallback from "@/modules/auth/components/AuthCallback";
import ResetPassword from "@/modules/auth/components/ResetPassword";
import NotFound from "@/app/pages/NotFound";
import ImageReview from "@/app/pages/ImageReview";

// Lazy-loaded components
const Settings = lazy(() => import("@/modules/user/components/Settings"));
const Stories = lazy(() => import("@/modules/story/components/Stories"));
const SettingsDashboard = lazy(() => import("@/modules/user/components/SettingsDashboard"));
const UserDashboard = lazy(() => import("@/modules/user/components/UserDashboard"));
const Checkout = lazy(() => import("@/app/pages/Checkout"));
const CheckoutSuccess = lazy(() => import("@/app/pages/CheckoutSuccess"));
const UpgradePlan = lazy(() => import("@/app/pages/UpgradePlan"));
const Credits = lazy(() => import("@/app/pages/Credits"));
const TestCredits = lazy(() => import("@/app/pages/TestCredits"));
const AdminDashboard = lazy(() => import("@/app/pages/AdminDashboard"));
const AdminIntegrations = lazy(() => import("@/app/pages/AdminIntegrations"));
const AdminUsers = lazy(() => import("@/app/pages/AdminUsers"));
const AdminCredits = lazy(() => import("@/app/pages/AdminCredits"));

/** Minimal fallback for generic lazy routes */
const PageLoader = () => (
  <div className="container py-8 flex items-center justify-center min-h-[60vh]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
  </div>
);

function App() {
  // Initialize error tracking and performance monitoring
  useEffect(() => {
    performanceMonitor.init();
  }, []);

  return (
    <ErrorBoundary>
    <HelmetProvider>
    <ClerkAuthProvider>
      <Router>
        <Layout>
            <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/image-review" element={<ImageReview />} />
            
            {/* Protected routes - New unified dashboard */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <ErrorBoundary>
                    <Suspense fallback={<DashboardSkeleton />}>
                      <UserDashboard />
                    </Suspense>
                  </ErrorBoundary>
                </ProtectedRoute>
              }
            />
            
            {/* Legacy routes - redirect to new dashboard */}
            <Route
              path="/stories"
              element={
                <ProtectedRoute>
                  <ErrorBoundary>
                    <Suspense fallback={<DashboardSkeleton />}>
                      <Stories />
                    </Suspense>
                  </ErrorBoundary>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings-dashboard"
              element={
                <ProtectedRoute>
                  <ErrorBoundary>
                    <Suspense fallback={<PageLoader />}>
                      <SettingsDashboard />
                    </Suspense>
                  </ErrorBoundary>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <ErrorBoundary>
                    <Suspense fallback={<PageLoader />}>
                      <Settings />
                    </Suspense>
                  </ErrorBoundary>
                </ProtectedRoute>
              }
            />
            
            {/* Admin routes */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <ErrorBoundary>
                    <Suspense fallback={<DashboardSkeleton />}>
                      <AdminDashboard />
                    </Suspense>
                  </ErrorBoundary>
                </AdminRoute>
              }
            />
            <Route
              path="/admin/integrations"
              element={
                <AdminRoute>
                  <ErrorBoundary>
                    <Suspense fallback={<PageLoader />}>
                      <AdminIntegrations />
                    </Suspense>
                  </ErrorBoundary>
                </AdminRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <AdminRoute>
                  <ErrorBoundary>
                    <Suspense fallback={<DashboardSkeleton />}>
                      <AdminUsers />
                    </Suspense>
                  </ErrorBoundary>
                </AdminRoute>
              }
            />
            <Route
              path="/admin/credits"
              element={
                <AdminRoute>
                  <ErrorBoundary>
                    <Suspense fallback={<PageLoader />}>
                      <AdminCredits />
                    </Suspense>
                  </ErrorBoundary>
                </AdminRoute>
              }
            />
            
            {/* Checkout routes */}
            <Route
              path="/checkout"
              element={
                <ProtectedRoute>
                  <ErrorBoundary>
                    <Suspense fallback={<CheckoutSkeleton />}>
                      <Checkout />
                    </Suspense>
                  </ErrorBoundary>
                </ProtectedRoute>
              }
            />
            <Route
              path="/checkout/success"
              element={
                <ProtectedRoute>
                  <ErrorBoundary>
                    <Suspense fallback={<PageLoader />}>
                      <CheckoutSuccess />
                    </Suspense>
                  </ErrorBoundary>
                </ProtectedRoute>
              }
            />
            <Route
              path="/upgrade"
              element={
                <ProtectedRoute>
                  <ErrorBoundary>
                    <Suspense fallback={<CheckoutSkeleton />}>
                      <UpgradePlan />
                    </Suspense>
                  </ErrorBoundary>
                </ProtectedRoute>
              }
            />

            {/* New credits and plans routes */}
            <Route
              path="/credits"
              element={
                <ProtectedRoute>
                  <ErrorBoundary>
                    <Suspense fallback={<PageLoader />}>
                      <Credits />
                    </Suspense>
                  </ErrorBoundary>
                </ProtectedRoute>
              }
            />
            <Route
              path="/plans"
              element={
                <ProtectedRoute>
                  <ErrorBoundary>
                    <Suspense fallback={<CheckoutSkeleton />}>
                      <UpgradePlan />
                    </Suspense>
                  </ErrorBoundary>
                </ProtectedRoute>
              }
            />
            <Route
              path="/test-credits"
              element={
                <ProtectedRoute>
                  <ErrorBoundary>
                    <Suspense fallback={<PageLoader />}>
                      <TestCredits />
                    </Suspense>
                  </ErrorBoundary>
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
        </Layout>
        <Toaster />
      </Router>
    </ClerkAuthProvider>
    </HelmetProvider>
    </ErrorBoundary>
  );
}
 
export default App;
