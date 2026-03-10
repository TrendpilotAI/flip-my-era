import { useEffect, lazy, Suspense, type ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout, ProtectedRoute, AdminRoute } from '@/modules/shared';
import { Toaster } from '@/modules/shared/components/ui/toaster';
import { BetterAuthProvider as SupabaseAuthProvider } from '@/core/integrations/better-auth/AuthProvider';
import { HelmetProvider } from 'react-helmet-async';
import { performanceMonitor } from '@/core/utils/performance';
import { ErrorBoundary, RouteErrorFallback } from '@/modules/shared/components/ErrorBoundary';
import { DashboardSkeleton, CheckoutSkeleton } from '@/modules/shared/components/Skeleton';
import { CreditExhaustionModal } from '@/modules/credits';
import { FeatureGate } from '@/modules/shared/components/FeatureGate';

import Index from '@/app/pages/Index';
import Gallery from '@/app/pages/Gallery';
import Auth from '@/modules/auth/components/Auth';
import AuthCallback from '@/modules/auth/components/AuthCallback';
import ResetPassword from '@/modules/auth/components/ResetPassword';
import NotFound from '@/app/pages/NotFound';
import ImageReview from '@/app/pages/ImageReview';

const ShareablePreview = lazy(() => import('@/modules/sharing/ShareablePreview'));
const Settings = lazy(() => import('@/modules/user/components/Settings'));
const Stories = lazy(() => import('@/modules/story/components/Stories'));
const SettingsDashboard = lazy(() => import('@/modules/user/components/SettingsDashboard'));
const UserDashboard = lazy(() => import('@/modules/user/components/UserDashboard'));
const Checkout = lazy(() => import('@/app/pages/Checkout'));
const CheckoutSuccess = lazy(() => import('@/app/pages/CheckoutSuccess'));
const UpgradePlan = lazy(() => import('@/app/pages/UpgradePlan'));
const Credits = lazy(() => import('@/app/pages/Credits'));
const TestCredits = lazy(() => import('@/app/pages/TestCredits'));
const AdminDashboard = lazy(() => import('@/app/pages/AdminDashboard'));
const AdminIntegrations = lazy(() => import('@/app/pages/AdminIntegrations'));
const AdminUsers = lazy(() => import('@/app/pages/AdminUsers'));
const AdminCredits = lazy(() => import('@/app/pages/AdminCredits'));
const OnboardingWizard = lazy(() => import('@/modules/onboarding/OnboardingWizard'));
const AdminConversion = lazy(() => import('@/app/pages/AdminConversion'));
const AdminRevenue = lazy(() => import('@/app/pages/AdminRevenue'));
const AdminAnalyticsDashboard = lazy(() => import('@/app/pages/AdminAnalyticsDashboard'));
const TermsOfService = lazy(() => import('@/app/pages/TermsOfService'));
const PrivacyPolicy = lazy(() => import('@/app/pages/PrivacyPolicy'));
const CreatorProfile = lazy(() => import('@/modules/creators/CreatorProfile'));
const CreatorAnalytics = lazy(() => import('@/modules/creators/CreatorAnalytics'));
const MarketplacePage = lazy(() => import('@/modules/marketplace/Marketplace'));
const GiftCardPage = lazy(() => import('@/modules/gifting/GiftCard'));
const AffiliateSystem = lazy(() => import('@/modules/affiliates/AffiliateSystem'));
const RevenueDashboard = lazy(() => import('@/modules/admin/RevenueDashboard'));
const CoverArtGenerator = lazy(() => import('@/modules/images/CoverArtGenerator'));
const StyleTransfer = lazy(() => import('@/modules/images/StyleTransfer'));
const ChapterIllustrations = lazy(() => import('@/modules/images/ChapterIllustrations'));
const ImageEditor = lazy(() => import('@/modules/images/ImageEditor'));
const AssetLibrary = lazy(() => import('@/modules/images/AssetLibrary'));

const PricingPage = lazy(() => import('@/modules/shared/components/PricingPage'));

const ErasTourEbook = lazy(() => import('@/app/pages/seo/ErasTourEbook'));
const CustomTaylorSwiftGifts = lazy(() => import('@/app/pages/seo/CustomTaylorSwiftGifts'));
const SwiftieBirthdayPresents = lazy(() => import('@/app/pages/seo/SwiftieBirthdayPresents'));
const TaylorSwiftFanArtBook = lazy(() => import('@/app/pages/seo/TaylorSwiftFanArtBook'));
const ErasTourMemoriesBook = lazy(() => import('@/app/pages/seo/ErasTourMemoriesBook'));
const PersonalizedErasTourPhotoBook = lazy(() => import('@/app/pages/seo/PersonalizedErasTourPhotoBook'));
const TaylorSwiftConcertKeepsake = lazy(() => import('@/app/pages/seo/TaylorSwiftConcertKeepsake'));
const SwiftieGraduationGift = lazy(() => import('@/app/pages/seo/SwiftieGraduationGift'));
const FriendshipBraceletBook = lazy(() => import('@/app/pages/seo/FriendshipBraceletBook'));
const ErasTourScrapbook = lazy(() => import('@/app/pages/seo/ErasTourScrapbook'));

const PageLoader = () => (
  <div className="container py-8 flex items-center justify-center min-h-[60vh]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
  </div>
);

const routeBoundary = (element: ReactNode, fallback: ReactNode = <RouteErrorFallback />) => (
  <ErrorBoundary fallback={fallback}>{element}</ErrorBoundary>
);

const lazyRoute = (element: ReactNode, suspenseFallback: ReactNode = <PageLoader />) =>
  routeBoundary(<Suspense fallback={suspenseFallback}>{element}</Suspense>);

function App() {
  useEffect(() => {
    performanceMonitor.init();
  }, []);

  return (
    <ErrorBoundary>
      <HelmetProvider>
        <SupabaseAuthProvider>
          <Router>
            <Layout>
              <Routes>
                <Route path="/" element={routeBoundary(<Index />)} />
                <Route path="/auth" element={routeBoundary(<Auth />)} />
                <Route path="/auth/callback" element={routeBoundary(<AuthCallback />)} />
                <Route path="/reset-password" element={routeBoundary(<ResetPassword />)} />
                <Route path="/image-review" element={routeBoundary(<ImageReview />)} />
                <Route path="/gallery" element={routeBoundary(<Gallery />)} />
                <Route path="/ebook/:id/preview" element={lazyRoute(<ShareablePreview />)} />

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
                          <AdminAnalyticsDashboard />
                        </Suspense>
                      </ErrorBoundary>
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/conversion"
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

                <Route
                  path="/onboarding"
                  element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <Suspense fallback={<PageLoader />}>
                          <OnboardingWizard
                            onComplete={(data) => {
                              console.log('Onboarding complete:', data);
                              window.location.href = '/dashboard';
                            }}
                          />
                        </Suspense>
                      </ErrorBoundary>
                    </ProtectedRoute>
                  }
                />

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
                    <FeatureGate flag="test_credits" fallback="notfound">
                      <ProtectedRoute>
                        <ErrorBoundary>
                          <Suspense fallback={<PageLoader />}>
                            <TestCredits />
                          </Suspense>
                        </ErrorBoundary>
                      </ProtectedRoute>
                    </FeatureGate>
                  }
                />

                <Route
                  path="/premium-features"
                  element={
                    <FeatureGate flag="premium_features" fallback="notfound">
                      <ProtectedRoute requiredSubscription="premium">
                        {routeBoundary(<div>Premium Features</div>)}
                      </ProtectedRoute>
                    </FeatureGate>
                  }
                />
                <Route
                  path="/marketplace"
                  element={
                    <FeatureGate flag="marketplace" fallback="notfound">
                      {lazyRoute(<MarketplacePage />)}
                    </FeatureGate>
                  }
                />
                <Route
                  path="/creator/:id"
                  element={
                    <FeatureGate flag="creator_profiles" fallback="notfound">
                      {lazyRoute(<CreatorProfile />)}
                    </FeatureGate>
                  }
                />
                <Route
                  path="/creator/analytics"
                  element={
                    <FeatureGate flag="creator_profiles" fallback="notfound">
                      <ProtectedRoute>{lazyRoute(<CreatorAnalytics />)}</ProtectedRoute>
                    </FeatureGate>
                  }
                />

                <Route path="/pricing" element={lazyRoute(<PricingPage />)} />
                <Route path="/terms" element={lazyRoute(<TermsOfService />)} />
                <Route path="/privacy" element={lazyRoute(<PrivacyPolicy />)} />

                <Route
                  path="/images/cover-generator"
                  element={
                    <FeatureGate flag="cover_art_generator" fallback="notfound">
                      <ProtectedRoute>{lazyRoute(<CoverArtGenerator />)}</ProtectedRoute>
                    </FeatureGate>
                  }
                />
                <Route
                  path="/images/style-transfer"
                  element={
                    <FeatureGate flag="style_transfer" fallback="notfound">
                      <ProtectedRoute>{lazyRoute(<StyleTransfer />)}</ProtectedRoute>
                    </FeatureGate>
                  }
                />
                <Route
                  path="/images/illustrations"
                  element={
                    <FeatureGate flag="chapter_illustrations" fallback="notfound">
                      <ProtectedRoute>{lazyRoute(<ChapterIllustrations />)}</ProtectedRoute>
                    </FeatureGate>
                  }
                />
                <Route
                  path="/images/editor"
                  element={
                    <FeatureGate flag="image_editor" fallback="notfound">
                      <ProtectedRoute>{lazyRoute(<ImageEditor />)}</ProtectedRoute>
                    </FeatureGate>
                  }
                />
                <Route
                  path="/images/assets"
                  element={
                    <FeatureGate flag="asset_library" fallback="notfound">
                      {lazyRoute(<AssetLibrary />)}
                    </FeatureGate>
                  }
                />

                <Route
                  path="/gift-cards"
                  element={
                    <FeatureGate flag="gift_cards" fallback="notfound">
                      <ProtectedRoute>
                        <ErrorBoundary>
                          <Suspense fallback={<PageLoader />}>
                            <GiftCardPage />
                          </Suspense>
                        </ErrorBoundary>
                      </ProtectedRoute>
                    </FeatureGate>
                  }
                />
                <Route
                  path="/affiliates"
                  element={
                    <FeatureGate flag="affiliates" fallback="notfound">
                      <ProtectedRoute>
                        <ErrorBoundary>
                          <Suspense fallback={<PageLoader />}>
                            <AffiliateSystem />
                          </Suspense>
                        </ErrorBoundary>
                      </ProtectedRoute>
                    </FeatureGate>
                  }
                />
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

                <Route path="/taylor-swift-eras-tour-ebook" element={lazyRoute(<ErasTourEbook />)} />
                <Route path="/custom-taylor-swift-gifts" element={lazyRoute(<CustomTaylorSwiftGifts />)} />
                <Route path="/swiftie-birthday-present-ideas" element={lazyRoute(<SwiftieBirthdayPresents />)} />
                <Route path="/taylor-swift-fan-art-book" element={lazyRoute(<TaylorSwiftFanArtBook />)} />
                <Route path="/eras-tour-memories-book" element={lazyRoute(<ErasTourMemoriesBook />)} />
                <Route path="/personalized-eras-tour-photo-book" element={lazyRoute(<PersonalizedErasTourPhotoBook />)} />
                <Route path="/taylor-swift-concert-keepsake-gift" element={lazyRoute(<TaylorSwiftConcertKeepsake />)} />
                <Route path="/swiftie-graduation-gift-ideas" element={lazyRoute(<SwiftieGraduationGift />)} />
                <Route path="/taylor-swift-friendship-bracelet-book" element={lazyRoute(<FriendshipBraceletBook />)} />
                <Route path="/eras-tour-scrapbook-digital" element={lazyRoute(<ErasTourScrapbook />)} />

                <Route path="*" element={routeBoundary(<NotFound />)} />
              </Routes>
            </Layout>
            <Toaster />
            <CreditExhaustionModal />
          </Router>
        </SupabaseAuthProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;
