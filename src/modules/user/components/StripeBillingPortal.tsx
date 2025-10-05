import { useState } from 'react';
import { Button } from '@/modules/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shared/components/ui/card';
import { useToast } from '@/modules/shared/hooks/use-toast';
import { useClerkAuth } from '@/modules/auth/contexts';
import { CreditCard, Settings, ExternalLink, Loader2 } from 'lucide-react';
import { stripeClient } from '@/core/integrations/stripe/client';

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
  const { user } = useClerkAuth();

  const handleOpenBillingPortal = async () => {
    if (!user) {
      toast({
        title: "Not Authenticated",
        description: "Please sign in to access the billing portal.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      await stripeClient.redirectToBillingPortal({
        returnUrl: window.location.href,
      });
    } catch (error) {
      console.error('Error opening billing portal:', error);
      toast({
        title: "Billing Portal Error",
        description: error instanceof Error ? error.message : "Unable to open billing portal. Please try again.",
        variant: "destructive",
      });
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
              <p className="text-sm text-muted-foreground">
                Update payment methods, view invoices, and manage your subscription
              </p>
            </div>
            <Button
              onClick={handleOpenBillingPortal}
              disabled={loading}
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

          <div className="text-xs text-muted-foreground space-y-1">
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
