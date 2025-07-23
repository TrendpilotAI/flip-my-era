import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useClerkAuth } from '@/modules/auth/contexts/ClerkAuthContext';
import { useToast } from '@/modules/shared/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shared/components/ui/card';
import { Button } from '@/modules/shared/components/ui/button';
import { Badge } from '@/modules/shared/components/ui/badge';
import { StripeCreditPurchaseModal } from './StripeCreditPurchaseModal';
import SettingsDashboard from './SettingsDashboard';
import { 
  User, 
  Mail, 
  Calendar, 
  Coins, 
  Settings, 
  LogOut,
  CreditCard,
  Loader2,
  UserCircle,
  ArrowLeft
} from 'lucide-react';

interface CreditData {
  balance: {
    balance: number;
    subscription_type: string | null;
    last_updated: string;
  };
}

type DashboardTab = 'main' | 'account' | 'billing';

const UserDashboard = () => {
  const { user, signOut, getToken } = useClerkAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [creditData, setCreditData] = useState<CreditData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  // Get current tab from URL parameters
  const urlParams = new URLSearchParams(location.search);
  const currentTab: DashboardTab = (urlParams.get('tab') as DashboardTab) || 'main';

  const fetchCreditBalance = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      // Use getToken from context (not user.getToken which doesn't exist on AuthUser interface)
      const token = await getToken({ template: 'supabase' });
      
      const response = await fetch('/api/functions/credits', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data?.success && data?.data) {
          setCreditData(data.data);
        } else {
          // In development, use mock data if no real data
          if (import.meta.env.DEV) {
            console.log("Using mock credit data for development");
            const mockData = {
              balance: {
                balance: 0,
                subscription_type: null,
                last_updated: new Date().toISOString()
              }
            };
            setCreditData(mockData);
            return;
          }
          
          toast({
            title: "Error loading credits",
            description: data?.error || 'Failed to load credit balance',
            variant: "destructive",
          });
        }
      } else {
        // In development, use mock data if Edge Functions are not available
        if (import.meta.env.DEV && response.status === 503) {
          console.log("Using mock credit data for development");
          const mockData = {
            balance: {
              balance: 0,
              subscription_type: null,
              last_updated: new Date().toISOString()
            }
          };
          setCreditData(mockData);
          return;
        }
        
        const errorData = await response.json().catch(() => ({}));
        toast({
          title: "Error loading credits",
          description: errorData?.error || 'Failed to load credit balance',
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Credit balance fetch error:', error);
      toast({
        title: "Error loading credits",
        description: "Failed to connect to credit service",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCreditBalance();
  }, [user?.id]);

  const handlePurchaseSuccess = () => {
    // Refresh balance after successful purchase
    fetchCreditBalance();
    setShowPurchaseModal(false);
  }

  const handleSignOut = async () => {
    try {
      const { error } = await signOut();
      if (error) throw error;
      
      toast({
        title: "Successfully Signed Out",
        description: "You have been securely logged out of your account. Come back soon!",
      });
    } catch (error) {
      console.error("Sign out error:", error);
      toast({
        title: "Sign Out Failed",
        description: "We couldn't sign you out properly. Please try again or refresh the page.",
        variant: "destructive",
      });
    }
  };

  const getSubscriptionBadge = () => {
    const credits = creditData?.balance.balance || 0;
    const variants = {
      free: 'secondary',
      basic: 'default',
      premium: 'default'
    } as const;
    
    const colors = {
      free: 'bg-gray-100 text-gray-800',
      basic: 'bg-blue-100 text-blue-800',
      premium: 'bg-purple-100 text-purple-800'
    };

    // Determine plan based on credits
    let plan = 'free';
    if (credits >= 10) plan = 'premium';
    else if (credits >= 3) plan = 'basic';

    return (
      <Badge className={colors[plan]}>
        {credits} Credits Available
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  // Render settings dashboard for account and billing tabs
  if (currentTab === 'account' || currentTab === 'billing') {
    return <SettingsDashboard />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Your Dashboard</h1>
              <p className="text-white/90">
                Welcome back, {user?.name || 'Time Traveler'}! Manage your stories and explore your alternate timelines.
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-white">
                <UserCircle className="h-5 w-5" />
                <span className="font-medium">{user?.name || 'User'}</span>
              </div>
              {getSubscriptionBadge()}
            </div>
          </div>
        </div>

        {/* Main Content - Profile Information */}
        <Card className="bg-white/95 backdrop-blur-lg border border-white/20 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Profile Information
            </CardTitle>
            <CardDescription>
              Your account details and preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Name
                  </label>
                  <p className="text-lg font-semibold text-gray-900 mt-1">{user?.name || 'Not provided'}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </label>
                  <p className="text-lg font-semibold text-gray-900 mt-1">{user?.email}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Member Since
                  </label>
                  <p className="text-lg font-semibold text-gray-900 mt-1">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Coins className="h-4 w-4" />
                    Current Plan
                  </label>
                  <div className="mt-1">
                    {getSubscriptionBadge()}
                  </div>
                </div>
              </div>
            </div>

            {/* Account Actions */}
            <div className="pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button 
                  variant="outline"
                  onClick={() => navigate('/dashboard?tab=account')}
                  className="flex items-center justify-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Account Settings
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => navigate('/dashboard?tab=billing')}
                  className="flex items-center justify-center gap-2"
                >
                  <CreditCard className="h-4 w-4" />
                  Billing & Subscriptions
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={handleSignOut}
                  className="flex items-center justify-center gap-2 text-red-600 hover:text-red-700"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            </div>

            {/* Credit Purchase Section */}
            <div className="pt-6 border-t border-gray-200">
              <div className="text-center space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Need More Credits?</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Purchase credits to unlock unlimited story generation and ebook creation features.
                </p>
                <Button 
                  onClick={() => setShowPurchaseModal(true)}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 px-8 py-3"
                >
                  <Coins className="h-4 w-4 mr-2" />
                  Purchase Credits
                </Button>
              </div>
            </div>

            <div className="pt-4">
              <p className="text-sm text-gray-600 text-center">
                Profile editing features coming soon. For now, contact support if you need to update your information.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Credit Purchase Modal */}
        <StripeCreditPurchaseModal
          isOpen={showPurchaseModal}
          onClose={() => setShowPurchaseModal(false)}
          onSuccess={handlePurchaseSuccess}
          currentBalance={creditData?.balance.balance || 0}
        />
      </div>
    </div>
  );
};

export default UserDashboard; 