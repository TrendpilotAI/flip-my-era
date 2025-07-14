import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useClerkAuth } from '@/modules/auth/contexts/ClerkAuthContext';
import { addCreditsToUser } from "@/modules/story/utils/storyPersistence";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/modules/shared/components/ui/card";
import { Button } from "@/modules/shared/components/ui/button";
import { useToast } from '@/modules/shared/hooks/use-toast';
import { CheckCircle, ArrowRight } from "lucide-react";

const CheckoutSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, refreshUser, getToken } = useClerkAuth();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(true);
  const [planName, setPlanName] = useState("");
  const [creditsAdded, setCreditsAdded] = useState(0);
  const hasProcessedPayment = useRef(false);

  useEffect(() => {
    const processPayment = async () => {
      // Prevent multiple executions
      if (hasProcessedPayment.current) {
        return;
      }

      try {
        hasProcessedPayment.current = true;
        
        // Get the plan from URL query params
        const params = new URLSearchParams(location.search);
        const plan = params.get("plan");
        
        // Map plan to credit amount (for credit-based purchases)
        let creditAmount = 0;
        let planDisplayName = "Free Plan";
        
        if (plan === "basic") {
          creditAmount = 3; // 3 credits for basic plan
          planDisplayName = "Basic Plan - 3 Credits";
        } else if (plan === "premium") {
          creditAmount = 5; // 5 credits for premium plan
          planDisplayName = "Premium Plan - 5 Credits";
        } else if (plan === "family") {
          creditAmount = 10; // 10 credits for family plan
          planDisplayName = "Family Plan - 10 Credits";
        } else {
          // Default single credit purchase
          creditAmount = 1;
          planDisplayName = "Single Credit Purchase";
        }
        
        setPlanName(planDisplayName);
        
        // In a real implementation, you would verify the payment with Stripe
        // before adding credits to the user's account
        
        // Add credits to user account
        if (user) {
          // Get Clerk session token for authenticated Supabase operations
          const sessionToken = await getToken({ template: 'supabase' });
          
          const result = await addCreditsToUser(user.id, creditAmount, plan || "credit_purchase", sessionToken);
          
          if (result.error) {
            throw result.error;
          }
          
          setCreditsAdded(creditAmount);
          await refreshUser(); // Refresh user data to get updated credits
          
          toast({
            title: "Credits Added Successfully",
            description: `${creditAmount} credits have been added to your account.`,
          });
        }
      } catch (error) {
        console.error("Error processing payment:", error);
        toast({
          title: "Error Adding Credits",
          description: "There was a problem adding credits to your account. Please contact support.",
          variant: "destructive",
        });
      } finally {
        setIsProcessing(false);
      }
    };

    processPayment();
  }, []); // Empty dependency array to run only once

  return (
    <div className="container max-w-md mx-auto py-16">
      <Card className="text-center">
        <CardHeader>
          <div className="mx-auto bg-green-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Payment Successful!</CardTitle>
          <CardDescription>
            Thank you for your purchase. Your credits have been added to your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-700">Purchase Details</h3>
            <p className="text-xl font-bold mt-1">{planName}</p>
            <p className="text-sm text-gray-500 mt-1">
              {creditsAdded > 0 ? `${creditsAdded} credits added to your account` : "Credits added to your account"}
            </p>
          </div>
          
          <div className="space-y-2 text-left">
            <h3 className="font-medium">What's next?</h3>
            <ul className="space-y-2">
              <li className="flex items-start">
                <ArrowRight className="h-5 w-5 text-primary mr-2 shrink-0 mt-0.5" />
                <span>Create your first story with your new credits</span>
              </li>
              <li className="flex items-start">
                <ArrowRight className="h-5 w-5 text-primary mr-2 shrink-0 mt-0.5" />
                <span>Generate an ebook from your story</span>
              </li>
              <li className="flex items-start">
                <ArrowRight className="h-5 w-5 text-primary mr-2 shrink-0 mt-0.5" />
                <span>Check your credit balance in your dashboard</span>
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
            View Credit Balance
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default CheckoutSuccess; 