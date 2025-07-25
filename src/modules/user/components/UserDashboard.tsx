import React, { useState, useEffect, useRef } from 'react';
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
  ArrowLeft,
  LayoutDashboard,
  History,
  BookOpen
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
  const [showAccountPopup, setShowAccountPopup] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  // Get current tab from URL parameters
  const urlParams = new URLSearchParams(location.search);
  const currentTab: DashboardTab = (urlParams.get('tab') as DashboardTab) || 'main';

  // Handle clicking outside popup to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setShowAccountPopup(false);
      }
    };

    if (showAccountPopup) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAccountPopup]);

  const fetchCreditBalance = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      // Use getToken from context (not user.getToken which doesn't exist on AuthUser interface)
      const token = await getToken({ template: 'supabase' });
      
      // Use the correct Supabase Edge Function URL
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/credits`, {
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
            </div>
            
            <div className="flex items-center gap-4">
              <div className="relative" ref={popupRef}>
                <Button 
                  variant="ghost"
                  onClick={() => setShowAccountPopup(!showAccountPopup)}
                  className="text-white hover:bg-white/20"
                >
                  <User className="h-5 w-5" />
                  <span className="ml-2">Account</span>
                </Button>
                
                {/* Account Popup - Left Aligned */}
                {showAccountPopup && (
                  <div className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50 min-w-[200px]">
                    <div className="space-y-2">
                      <Button 
                        variant="ghost"
                        onClick={() => {
                          setShowAccountPopup(false);
                          navigate('/dashboard');
                        }}
                        className="w-full justify-start"
                      >
                        <LayoutDashboard className="h-4 w-4 mr-2" />
                        Dashboard
                      </Button>
                      <Button 
                        variant="ghost"
                        onClick={() => {
                          setShowAccountPopup(false);
                          navigate('/past-generations');
                        }}
                        className="w-full justify-start"
                      >
                        <History className="h-4 w-4 mr-2" />
                        Past Generations
                      </Button>
                      <Button 
                        variant="ghost"
                        onClick={() => {
                          setShowAccountPopup(false);
                          handleSignOut();
                        }}
                        className="w-full justify-start text-red-600 hover:text-red-700"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </Button>
                    </div>
                  </div>
                )}
              </div>
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
                    Credits Available
                  </label>
                  <div className="mt-1">
                    {getSubscriptionBadge()}
                  </div>
                </div>
              </div>
            </div>

            {/* Credit Purchase Section */}
            <div className="pt-6 border-t border-gray-200">
              <div className="text-center space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Need More Credits?</h3>
                <Button 
                  onClick={() => setShowPurchaseModal(true)}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 px-8 py-3"
                >
                  <Coins className="h-4 w-4 mr-2" />
                  Purchase Credits
                </Button>
              </div>
            </div>
            
            {/* E-Book Generation Section */}
            <div className="pt-6 border-t border-gray-200 mt-6">
              <div className="text-center space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Create E-Memory Book</h3>
                <p className="text-gray-600">Generate a multi-chapter illustrated book with our advanced memory system</p>
                <Button 
                  onClick={() => navigate('/ebook-builder')}
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600 px-8 py-3"
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Create E-Book (Spend Credits)
                </Button>
                <p className="text-xs text-gray-500">
                  No need to generate a story first - create your E-Book directly!
                </p>
              </div>
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