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
import Gallery from "@/app/pages/Gallery";
import Auth from "@/modules/auth/components/Auth";
import AuthCallback from "@/modules/auth/components/AuthCallback";
import ResetPassword from "@/modules/auth/components/ResetPassword";
import NotFound from "@/app/pages/NotFound";
import ImageReview from "@/app/pages/ImageReview";

// Lazy-loaded components
const ShareablePreview = lazy(() => import("@/modules/sharing/ShareablePreview"));
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
const OnboardingWizard = lazy(() => import("@/modules/onboarding/OnboardingWizard"));
const AdminConversion = lazy(() => import("@/app/pages/AdminConversion"));
const AdminRevenue = lazy(() => import("@/app/pages/AdminRevenue"));
const TermsOfService = lazy(() => import("@/app/pages/TermsOfService"));
const PrivacyPolicy = lazy(() => import("@/app/pages/PrivacyPolicy"));
const CreatorProfile = lazy(() => import("@/modules/creators/CreatorProfile"));
const CreatorAnalytics = lazy(() => import("@/modules/creators/CreatorAnalytics"));
const MarketplacePage = lazy(() => import("@/modules/marketplace/Marketplace"));
const GiftCardPage = lazy(() => import("@/modules/gifting/GiftCard"));
const AffiliateSystem = lazy(() => import("@/modules/affiliates/AffiliateSystem"));
const RevenueDashboard = lazy(() => import("@/modules/admin/RevenueDashboard"));
const CoverArtGenerator = lazy(() => import("@/modules/images/CoverArtGenerator"));
const StyleTransfer = lazy(() => import("@/modules/images/StyleTransfer"));
const ChapterIllustrations = lazy(() => import("@/modules/images/ChapterIllustrations"));
const ImageEditor = lazy(() => import("@/modules/images/ImageEditor"));
const AssetLibrary = lazy(() => import("@/modules/images/AssetLibrary"));

// SEO Content Pages
const ErasTourEbook = lazy(() => import("@/app/pages/seo/ErasTourEbook"));
const CustomTaylorSwiftGifts = lazy(() => import("@/app/pages/seo/CustomTaylorSwiftGifts"));
const SwiftieBirthdayPresents = lazy(() => import("@/app/pages/seo/SwiftieBirthdayPresents"));
const TaylorSwiftFanArtBook = lazy(() => import("@/app/pages/seo/TaylorSwiftFanArtBook"));
const ErasTourMemoriesBook = lazy(() => import("@/app/pages/seo/ErasTourMemoriesBook"));
const PersonalizedErasTourPhotoBook = lazy(() => import("@/app/pages/seo/PersonalizedErasTourPhotoBook"));
const TaylorSwiftConcertKeepsake = lazy(() => import("@/app/pages/seo/TaylorSwiftConcertKeepsake"));
const SwiftieGraduationGift = lazy(() => import("@/app/pages/seo/SwiftieGraduationGift"));
const FriendshipBraceletBook = lazy(() => import("@/app/pages/seo/FriendshipBraceletBook"));
const ErasTourScrapbook = lazy(() => import("@/app/pages/seo/ErasTourScrapbook"));

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
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/ebook/:id/preview" element={
              <Suspense fallback={<PageLoader />}>
                <ShareablePreview />
              </Suspense>
            } />
            
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
            
            <Route
              path="/admin/revenue"
              element={
                <AdminRoute>
                  <ErrorBoundary>
                    <Suspense fallback={<DashboardSkeleton />}>
                      <AdminRevenue />
                    </Suspense>
                  </ErrorBoundary>
                </AdminRoute>
              }
            />
            <Route
              path="/admin/analytics"
              element={
                <AdminRoute>
                  <ErrorBoundary>
                    <Suspense fallback={<DashboardSkeleton />}>
                      <AdminConversion />
                    </Suspense>
                  </ErrorBoundary>
                </AdminRoute>
              }
            />
            
            {/* Onboarding wizard for first-time users */}
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <ErrorBoundary>
                    <Suspense fallback={<PageLoader />}>
                      <OnboardingWizard onComplete={(data) => { console.log('Onboarding complete:', data); window.location.href = '/dashboard'; }} />
                    </Suspense>
                  </ErrorBoundary>
                </ProtectedRoute>
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
            
            {/* Marketplace */}
            <Route
              path="/marketplace"
              element={
                <Suspense fallback={<PageLoader />}>
                  <MarketplacePage />
                </Suspense>
              }
            />
            
            {/* Creator profile (public) */}
            <Route path="/creator/:id" element={
              <Suspense fallback={<PageLoader />}>
                <CreatorProfile />
              </Suspense>
            } />
            
            {/* Creator analytics (protected) */}
            <Route path="/creator/analytics" element={
              <ProtectedRoute>
                <Suspense fallback={<PageLoader />}>
                  <CreatorAnalytics />
                </Suspense>
              </ProtectedRoute>
            } />

            {/* Legal pages */}
            <Route path="/terms" element={
              <Suspense fallback={<PageLoader />}>
                <TermsOfService />
              </Suspense>
            } />
            <Route path="/privacy" element={
              <Suspense fallback={<PageLoader />}>
                <PrivacyPolicy />
              </Suspense>
            } />
            
            {/* AI Image Enhancement routes */}
            <Route path="/images/cover-generator" element={
              <ProtectedRoute><Suspense fallback={<PageLoader />}><CoverArtGenerator /></Suspense></ProtectedRoute>
            } />
            <Route path="/images/style-transfer" element={
              <ProtectedRoute><Suspense fallback={<PageLoader />}><StyleTransfer /></Suspense></ProtectedRoute>
            } />
            <Route path="/images/illustrations" element={
              <ProtectedRoute><Suspense fallback={<PageLoader />}><ChapterIllustrations /></Suspense></ProtectedRoute>
            } />
            <Route path="/images/editor" element={
              <ProtectedRoute><Suspense fallback={<PageLoader />}><ImageEditor /></Suspense></ProtectedRoute>
            } />
            <Route path="/images/assets" element={
              <Suspense fallback={<PageLoader />}><AssetLibrary /></Suspense>
            } />
            
            {/* Gift Cards */}
            <Route
              path="/gift-cards"
              element={
                <ProtectedRoute>
                  <ErrorBoundary>
                    <Suspense fallback={<PageLoader />}>
                      <GiftCardPage />
                    </Suspense>
                  </ErrorBoundary>
                </ProtectedRoute>
              }
            />
            
            {/* Affiliate Program */}
            <Route
              path="/affiliates"
              element={
                <ProtectedRoute>
                  <ErrorBoundary>
                    <Suspense fallback={<PageLoader />}>
                      <AffiliateSystem />
                    </Suspense>
                  </ErrorBoundary>
                </ProtectedRoute>
              }
            />
            
            {/* Admin Revenue Dashboard */}
            <Route
              path="/admin/revenue-dashboard"
              element={
                <AdminRoute>
                  <ErrorBoundary>
                    <Suspense fallback={<DashboardSkeleton />}>
                      <RevenueDashboard />
                    </Suspense>
                  </ErrorBoundary>
                </AdminRoute>
              }
            />
            
            {/* SEO Content Pages */}
            <Route path="/taylor-swift-eras-tour-ebook" element={<Suspense fallback={<PageLoader />}><ErasTourEbook /></Suspense>} />
            <Route path="/custom-taylor-swift-gifts" element={<Suspense fallback={<PageLoader />}><CustomTaylorSwiftGifts /></Suspense>} />
            <Route path="/swiftie-birthday-present-ideas" element={<Suspense fallback={<PageLoader />}><SwiftieBirthdayPresents /></Suspense>} />
            <Route path="/taylor-swift-fan-art-book" element={<Suspense fallback={<PageLoader />}><TaylorSwiftFanArtBook /></Suspense>} />
            <Route path="/eras-tour-memories-book" element={<Suspense fallback={<PageLoader />}><ErasTourMemoriesBook /></Suspense>} />
            <Route path="/personalized-eras-tour-photo-book" element={<Suspense fallback={<PageLoader />}><PersonalizedErasTourPhotoBook /></Suspense>} />
            <Route path="/taylor-swift-concert-keepsake-gift" element={<Suspense fallback={<PageLoader />}><TaylorSwiftConcertKeepsake /></Suspense>} />
            <Route path="/swiftie-graduation-gift-ideas" element={<Suspense fallback={<PageLoader />}><SwiftieGraduationGift /></Suspense>} />
            <Route path="/taylor-swift-friendship-bracelet-book" element={<Suspense fallback={<PageLoader />}><FriendshipBraceletBook /></Suspense>} />
            <Route path="/eras-tour-scrapbook-digital" element={<Suspense fallback={<PageLoader />}><ErasTourScrapbook /></Suspense>} />

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
