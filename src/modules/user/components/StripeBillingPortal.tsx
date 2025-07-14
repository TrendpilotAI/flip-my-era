import React, { useState } from 'react';
import { Button } from '@/modules/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shared/components/ui/card';
import { useToast } from '@/modules/shared/hooks/use-toast';
import { useAuth } from '@clerk/clerk-react';
import { CreditCard, Settings, ExternalLink, Loader2 } from 'lucide-react';

interface StripeBillingPortalProps {
  customerId?: string;
  className?: string;
}

export const StripeBillingPortal: React.FC<StripeBillingPortalProps> = ({
  customerId,
  className = '',
}) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleOpenBillingPortal = async () => {
    if (!customerId) {
      toast({
        title: "No Billing Account",
        description: "You don't have an active billing account. Please purchase a subscription first.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch('/api/stripe/create-billing-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId,
          returnUrl: window.location.href,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create billing portal session');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Error opening billing portal:', error);
      toast({
        title: "Billing Portal Error",
        description: "Unable to open billing portal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <CreditCard className="h-5 w-5 mr-2" />
          Billing & Subscription
        </CardTitle>
        <CardDescription>
          Manage your subscription, payment methods, and billing information
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Subscription Management</p>
              <p className="text-sm text-gray-600">
                Update payment methods, view invoices, and manage your subscription
              </p>
            </div>
            <Button
              onClick={handleOpenBillingPortal}
              disabled={loading || !customerId}
              variant="outline"
              className="flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <Settings className="h-4 w-4" />
                  <span>Manage Billing</span>
                  <ExternalLink className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>

          {!customerId && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>No active subscription found.</strong> Purchase a subscription to access billing management.
              </p>
            </div>
          )}

          <div className="text-xs text-gray-500 space-y-1">
            <p>• View and download invoices</p>
            <p>• Update payment methods</p>
            <p>• Cancel or modify subscription</p>
            <p>• Access billing history</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 