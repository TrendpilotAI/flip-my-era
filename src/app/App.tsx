import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Layout, ProtectedRoute, AdminRoute } from "@/modules/shared";
import { Toaster } from "@/modules/shared/components/ui/toaster";
import { ClerkAuthProvider } from "@/modules/auth";
import React, { lazy, Suspense } from 'react';

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

function App() {
  return (
    <ClerkAuthProvider>
      <Router>
        <Layout>
          <Suspense fallback={<div>Loading...</div>}>
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
                  <UserDashboard />
                </ProtectedRoute>
              }
            />
            
            {/* Legacy routes - redirect to new dashboard */}
            <Route
              path="/stories"
              element={
                <ProtectedRoute>
                  <Stories />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings-dashboard"
              element={
                <ProtectedRoute>
                  <SettingsDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
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

            {/* New credits and plans routes */}
            <Route
              path="/credits"
              element={
                <ProtectedRoute>
                  <Credits />
                </ProtectedRoute>
              }
            />
            <Route
              path="/plans"
              element={
                <ProtectedRoute>
                  <UpgradePlan />
                </ProtectedRoute>
              }
            />
            <Route
              path="/test-credits"
              element={
                <ProtectedRoute>
                  <TestCredits />
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
  );
}
 
export default App;
