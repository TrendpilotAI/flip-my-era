import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useClerkAuth } from '@/modules/auth/contexts';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/modules/shared/components/ui/card";
import { Button } from "@/modules/shared/components/ui/button";
import { useToast } from '@/modules/shared/hooks/use-toast';
import { CheckCircle, ArrowRight } from "lucide-react";

const CheckoutSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, refreshUser } = useClerkAuth();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(true);
  const [planName, setPlanName] = useState("");

  // Helper function to get display name for legacy plans
  const getLegacyPlanDisplayName = (plan: string): string => {
    if (plan === "basic" || plan === "starter") {
      return "Basic Plan";
    }
    if (plan === "premium" || plan === "deluxe") {
      return "Premium Plan";
    }
    if (plan === "vip") {
      return "VIP Plan";
    }
    return "Plan";
  };

  useEffect(() => {
    const processPayment = async () => {
      try {
        const params = new URLSearchParams(location.search);
        const sessionId = params.get("session_id");
        const type = params.get("type");
        const amount = params.get("amount");
        const plan = params.get("plan");

        // Helper to refresh user data if needed
        const refreshUserData = async () => {
          if (user) {
            await refreshUser();
          }
        };

        // Handle Stripe session-based payments
        if (sessionId) {
          await refreshUserData();
          
          if (type === 'credits') {
            setPlanName(`${amount} Credits`);
            toast({
              title: "Credits Added!",
              description: `${amount} credits have been added to your account.`,
            });
            return;
          }
          
          // Subscription with session
          setPlanName(plan || 'Subscription');
          toast({
            title: "Subscription Activated!",
            description: `Your ${plan} subscription is now active.`,
          });
          return;
        }

        // Handle direct Stripe redirects (no session ID)
        if (type === 'credits' && amount) {
          setPlanName(`${amount} Credits`);
          await refreshUserData();
          toast({
            title: "Purchase Complete!",
            description: `Your credits will be added to your account shortly.`,
          });
          return;
        }

        if (type === 'subscription' && plan) {
          setPlanName(plan);
          await refreshUserData();
          toast({
            title: "Subscription Active!",
            description: `Your ${plan} subscription is being activated.`,
          });
          return;
        }

        // Legacy plan parameter handling (Stripe redirects)
        const legacyPlan = params.get("plan");
        if (legacyPlan) {
          const planDisplayName = getLegacyPlanDisplayName(legacyPlan);
          setPlanName(planDisplayName);
          await refreshUserData();
          toast({
            title: "Purchase Processing",
            description: `Your ${planDisplayName} purchase is being processed and will be activated shortly.`,
          });
          return;
        }
      } catch (error) {
        console.error("Error processing payment:", error);
        toast({
          title: "Processing",
          description: "Your payment is being processed. Please wait a moment.",
        });
      } finally {
        setIsProcessing(false);
      }
    };
    
    processPayment();
  }, [location.search, user, refreshUser, toast]);

  return (
    <div className="container max-w-md mx-auto py-16">
      <Card className="text-center">
        <CardHeader>
          <div className="mx-auto bg-green-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Payment Successful!</CardTitle>
          <CardDescription>
            Thank you for your purchase. Your subscription is now active.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-700">Subscription Details</h3>
            <p className="text-xl font-bold mt-1">{planName}</p>
            <p className="text-sm text-gray-500 mt-1">
              Your subscription is now active and ready to use
            </p>
          </div>
          
          <div className="space-y-2 text-left">
            <h3 className="font-medium">What's next?</h3>
            <ul className="space-y-2">
              <li className="flex items-start">
                <ArrowRight className="h-5 w-5 text-primary mr-2 shrink-0 mt-0.5" />
                <span>Explore all the features included in your plan</span>
              </li>
              <li className="flex items-start">
                <ArrowRight className="h-5 w-5 text-primary mr-2 shrink-0 mt-0.5" />
                <span>Create your first story with our enhanced tools</span>
              </li>
              <li className="flex items-start">
                <ArrowRight className="h-5 w-5 text-primary mr-2 shrink-0 mt-0.5" />
                <span>Check out our tutorials to get started quickly</span>
              </li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button 
            className="w-full" 
            onClick={() => navigate("/stories")}
          >
            Start Creating Stories
          </Button>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => navigate("/settings")}
          >
            Manage Subscription
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default CheckoutSuccess; 