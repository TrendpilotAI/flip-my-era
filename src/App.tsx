import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Layout } from "@/modules/shared/components/Layout";
import { Toaster } from "@/modules/shared/components/ui/toaster";
import { ClerkAuthProvider } from "@/modules/auth/contexts/ClerkAuthContext";
import { ProtectedRoute } from "@/modules/shared/components/ProtectedRoute";
import { AdminRoute } from "@/modules/shared/components/AdminRoute";
import Index from "@/pages/Index";
import About from "@/pages/About";
import Ebook from "@/pages/Ebook";
import EbookBuilder from "@/pages/EbookBuilder";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/NotFound";
import Stories from "@/pages/Stories";
import Auth from "@/pages/Auth";
import SettingsDashboard from "@/pages/SettingsDashboard";
import UserDashboard from "@/pages/UserDashboard";
import Checkout from "@/pages/Checkout";
import CheckoutSuccess from "@/pages/CheckoutSuccess";
import UpgradePlan from "@/pages/UpgradePlan";
import AuthCallback from "@/pages/AuthCallback";
import ResetPassword from "@/pages/ResetPassword";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminIntegrations from "@/pages/AdminIntegrations";
import AdminUsers from "@/pages/AdminUsers";
import AdminCredits from "@/pages/AdminCredits";

function App() {
  return (
    <ClerkAuthProvider>
      <Router>
        <Layout>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/about" element={<About />} />
            <Route path="/ebook" element={<Ebook />} />
            <Route path="/ebook-builder" element={<EbookBuilder />} />
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
        </Layout>
        <Toaster />
      </Router>
    </ClerkAuthProvider>
  );
}

export default App;
