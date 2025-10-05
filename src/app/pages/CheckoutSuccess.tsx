import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useClerkAuth } from '@/modules/auth/contexts';
import { updateSubscription } from "@/modules/story/utils/storyPersistence";
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

  useEffect(() => {
    const processPayment = async () => {
      try {
        // Get the plan from URL query params
        const params = new URLSearchParams(location.search);
        const plan = params.get("plan");
        
        // Map plan to subscription level
        let subscriptionLevel: "free" | "basic" | "premium" = "free";
        let planDisplayName = "Free Plan";
        
        if (plan === "basic") {
          subscriptionLevel = "basic";
          planDisplayName = "Basic Plan";
        } else if (plan === "premium" || plan === "family") {
          subscriptionLevel = "premium";
          planDisplayName = plan === "premium" ? "Premium Plan" : "Family Plan";
        }
        
        setPlanName(planDisplayName);
        
        // In a real implementation, you would verify the payment with SamCart
        // before updating the user's subscription status
        
        // Update user subscription in database
        if (user) {
          await updateSubscription(user.id, subscriptionLevel);
          await refreshUser(); // Refresh user data to get updated subscription
          
          toast({
            title: "Subscription Activated",
            description: `Your ${planDisplayName} has been successfully activated.`,
          });
        }
      } catch (error) {
        console.error("Error processing payment:", error);
        toast({
          title: "Error Activating Subscription",
          description: "There was a problem activating your subscription. Please contact support.",
          variant: "destructive",
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