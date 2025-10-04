// Credit Balance Widget Component
// Displays user's current credit balance and subscription status
// Phase 1A: Enhanced E-Book Generation System

import React, { useState, useEffect } from 'react';
import { Coins, Crown, RefreshCw } from 'lucide-react';
import { Button } from '@/modules/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/modules/shared/components/ui/card';
import { Badge } from '@/modules/shared/components/ui/badge';
import { supabase } from '@/core/integrations/supabase/client';
import { useAuth } from '@clerk/clerk-react';
import { CreditPurchaseModal } from './CreditPurchaseModal';

interface CreditBalance {
  balance: number;
  subscription_type: string | null;
  last_updated: string;
}

interface CreditTransaction {
  id: string;
  type: 'purchase' | 'usage' | 'refund';
  amount: number;
  description: string;
  transaction_date: string;
  samcart_order_id?: string;
}

interface CreditData {
  balance: CreditBalance;
  recent_transactions?: CreditTransaction[];
}

export const CreditBalance: React.FC<{
  onBalanceChange?: (balance: number) => void;
  className?: string;
}> = ({ onBalanceChange, className = '' }) => {
  const { isSignedIn, getToken } = useAuth();
  const [creditData, setCreditData] = useState<CreditData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  const fetchCreditBalance = async () => {
    if (!isSignedIn) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      console.log('🔍 CreditBalance: Starting credit balance fetch...');
      console.log('🔍 CreditBalance: isSignedIn:', isSignedIn);

      // Try to get token with supabase template, fallback to default if not available
      let token = await getToken({ template: 'supabase' });
      
      if (!token) {
        console.log('🔍 CreditBalance: No token with supabase template, trying default...');
        token = await getToken();
      }
      
      console.log('🔍 CreditBalance: Token received:', token ? 'YES (length: ' + token.length + ')' : 'NO');
      console.log('🔍 CreditBalance: Token preview:', token ? token.substring(0, 20) + '...' : 'null');
      
      // Try to decode the token to check its structure
      if (token) {
        try {
          const parts = token.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1]));
            console.log('🔍 CreditBalance: Token payload:', {
              sub: payload.sub,
              aud: payload.aud,
              iss: payload.iss,
              exp: payload.exp,
              iat: payload.iat,
            });
          }
        } catch (e) {
          console.error('🔍 CreditBalance: Could not decode token:', e);
        }
      }

      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      console.log('🔍 CreditBalance: Headers to send:', headers ? 'Authorization header present' : 'No authorization header');

      console.log('🔍 CreditBalance: Invoking credits function with token...');

      // Use the regular supabase client and pass the token in headers
      const { data, error } = await supabase.functions.invoke('credits', {
        method: 'GET',
        headers: token ? {
          Authorization: `Bearer ${token}`,
        } : {},
      });

      if (error) {
        console.error('❌ CreditBalance: Error fetching credit balance:', error);
        const errorObj = error as { message?: string; status?: number; code?: string; details?: unknown };
        console.error('❌ CreditBalance: Error details:', {
          message: errorObj.message,
          status: errorObj.status,
          code: errorObj.code,
          details: errorObj.details,
        });
        setError('Failed to load credit balance');
        return;
      }

      if (data?.success && data?.data) {
        setCreditData(data.data);
        if (onBalanceChange) {
          onBalanceChange(data.data.balance.balance);
        }
      } else {
        setError(data?.error || 'Unknown error occurred');
      }
    } catch (err) {
      console.error('Credit balance fetch error:', err);
      setError('Failed to connect to credit service');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCreditBalance();
  }, [isSignedIn]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRefresh = () => {
    setLoading(true);
    fetchCreditBalance();
  };

  const handlePurchaseSuccess = () => {
    // Refresh balance after successful purchase
    fetchCreditBalance();
    setShowPurchaseModal(false);
  };

  const getSubscriptionBadge = (subscriptionType: string | null) => {
    if (!subscriptionType) return null;

    switch (subscriptionType) {
      case 'monthly_unlimited':
        return (
          <Badge variant="secondary" className="ml-2">
            <Crown className="w-3 h-3 mr-1" />
            Monthly Unlimited
          </Badge>
        );
      case 'annual_unlimited':
        return (
          <Badge variant="default" className="ml-2">
            <Crown className="w-3 h-3 mr-1" />
            Annual Unlimited
          </Badge>
        );
      default:
        return null;
    }
  };

  if (!isSignedIn) {
    return null;
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span className="text-sm text-muted-foreground">Loading credits...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-red-600">{error}</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleRefresh}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasUnlimitedSubscription = creditData?.balance.subscription_type === 'monthly_unlimited' || 
                                   creditData?.balance.subscription_type === 'annual_unlimited';

  return (
    <>
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center justify-between">
            <div className="flex items-center">
              <Coins className="w-4 h-4 mr-2" />
              Credits
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleRefresh}
              className="h-6 w-6 p-0"
            >
              <RefreshCw className="w-3 h-3" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {hasUnlimitedSubscription ? (
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">∞</div>
                <p className="text-xs text-muted-foreground">Unlimited Generations</p>
                {getSubscriptionBadge(creditData?.balance.subscription_type)}
              </div>
            ) : (
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {creditData?.balance.balance || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {creditData?.balance.balance === 1 ? 'Credit Available' : 'Credits Available'}
                </p>
              </div>
            )}

            {!hasUnlimitedSubscription && (
              <Button 
                onClick={() => setShowPurchaseModal(true)}
                className="w-full"
                size="sm"
              >
                Buy Credits
              </Button>
            )}

            {creditData?.balance.subscription_type && getSubscriptionBadge(creditData.balance.subscription_type)}
          </div>
        </CardContent>
      </Card>

      <CreditPurchaseModal
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        onSuccess={handlePurchaseSuccess}
        currentBalance={creditData?.balance.balance || 0}
      />
    </>
  );
};

export default CreditBalance;