import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Layout, ProtectedRoute, AdminRoute } from "@/modules/shared";
import { Toaster } from "@/modules/shared/components/ui/toaster";
import { ClerkAuthProvider } from "@/modules/auth";
import { ThemeProvider } from "@/modules/shared/contexts/ThemeContext";
import Index from "@/app/pages/Index";
import About from "@/pages/About";
import Settings from "@/modules/user/components/Settings";
import NotFound from "@/app/pages/NotFound";
import Stories from "@/modules/story/components/Stories";
import Auth from "@/modules/auth/components/Auth";
import SettingsDashboard from "@/modules/user/components/SettingsDashboard";
import UserDashboard from "@/modules/user/components/UserDashboard";
import Checkout from "@/app/pages/Checkout";
import CheckoutSuccess from "@/app/pages/CheckoutSuccess";
import UpgradePlan from "@/app/pages/UpgradePlan";
import AuthCallback from "@/modules/auth/components/AuthCallback";
import ResetPassword from "@/modules/auth/components/ResetPassword";
import AdminDashboard from "@/app/pages/AdminDashboard";
import AdminIntegrations from "@/app/pages/AdminIntegrations";
import AdminUsers from "@/app/pages/AdminUsers";
import AdminCredits from "@/app/pages/AdminCredits";
import { MemorySystemDemo } from "@/app/pages/MemorySystemDemo";
import EbookBuilder from "@/pages/EbookBuilder";
import EbookViewer from "@/pages/EbookViewer";
import PastGenerations from "@/modules/user/components/PastGenerations";
import Survey from "@/pages/Survey";

function App() {
  return (
    <ThemeProvider>
      <ClerkAuthProvider>
        <Router>
        <Layout>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/about" element={<About />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/survey" element={<Survey />} />
            <Route path="/ebook-builder" element={<EbookBuilder />} />
            
            {/* Memory System Demo - Public for testing */}
            <Route path="/memory-demo" element={<MemorySystemDemo />} />
            
            {/* Protected routes - New unified dashboard */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <UserDashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* Past Generations */}
            <Route 
              path="/past-generations" 
              element={
                <ProtectedRoute>
                  <PastGenerations />
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
    </ClerkAuthProvider>
    </ThemeProvider>
  );
}

export default App;
