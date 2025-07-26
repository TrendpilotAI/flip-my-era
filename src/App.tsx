import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Layout } from "@/modules/shared/components/Layout";
import { Toaster } from "@/modules/shared/components/ui/toaster";
import { ClerkAuthProvider } from "@/modules/auth/contexts/ClerkAuthContext";
import { ProtectedRoute } from "@/modules/shared/components/ProtectedRoute";
import { AdminRoute } from "@/modules/shared/components/AdminRoute";
import { ThemeProvider } from "@/modules/shared/contexts/ThemeContext";
import Index from "@/pages/Index";
import About from "@/pages/About";
import Ebook from "@/pages/Ebook";
import EbookBuilder from "@/pages/EbookBuilder";
import EbookViewer from "@/pages/EbookViewer";
import StoryViewer from "@/pages/StoryViewer";
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
import { ImageLoadingTest } from "@/modules/ebook/components/ImageLoadingTest";
import TestEbookPreview from "@/pages/TestEbookPreview";
import Survey from "@/pages/Survey";

function App() {
  return (
    <ClerkAuthProvider>
      <ThemeProvider>
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
            <Route path="/survey" element={<Survey />} />
            <Route path="/test-images" element={<ImageLoadingTest />} />
            <Route path="/test-ebook-preview" element={<TestEbookPreview />} />
            
            {/* Protected routes - New unified dashboard */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <UserDashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* Ebook Viewer */}
            <Route 
              path="/ebook/:id" 
              element={
                <ProtectedRoute>
                  <EbookViewer />
                </ProtectedRoute>
              } 
            />
            
            {/* Story Viewer */}
            <Route 
              path="/story/:id" 
              element={
                <ProtectedRoute>
                  <StoryViewer />
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
            
            {/* Stripe Checkout routes */}
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
            
            {/* 404 Not Found - Must be last */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
        </Layout>
      </Router>
    </ThemeProvider>
    </ClerkAuthProvider>
  );
}

export default App;
