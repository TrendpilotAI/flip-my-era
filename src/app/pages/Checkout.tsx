import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useClerkAuth } from '@/modules/auth/contexts';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/modules/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/modules/shared/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/modules/shared/components/ui/radio-group';
import { Label } from '@/modules/shared/components/ui/label';
import { Input } from '@/modules/shared/components/ui/input';
import { useToast } from '@/modules/shared/hooks/use-toast';
import { Loader2, CheckCircle, Shield, CreditCard } from "lucide-react";

 

interface PlanOption {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  stripeProductId: string;
  stripePriceId: string;  
}

const planOptions: PlanOption[] = [
  {
    id: "starter",
    name: "Swiftie Starter",
    price: 12.99,
    description: "Perfect for Taylor Swift fans",
    features: [
      "30 credits per month",
      "Taylor Swift era templates",
      "High-quality illustrations",
      "Character portraits",
      "Priority support"
    ],
    stripeProductId: "prod_T6BhtW05ZjAkHC",
    stripePriceId: "price_1S9zK15U03MNTw3qAO5JnplW"
  },
  {
    id: "deluxe",
    name: "Swiftie Deluxe",
    price: 25.00,
    description: "For content creators",
    features: [
      "75 credits per month",
      "Everything in Starter",
      "Cinematic spreads",
      "TikTok-ready animations",
      "Priority GPU processing",
      "Commercial licensing",
      "30% off extra credits"
    ],
    stripeProductId: "prod_T6BhX2nQGqxdmm",
    stripePriceId: "price_1S9zK25U03MNTw3qdDnUn7hk"
  },
  {
    id: "vip",
    name: "Opus VIP",
    price: 49.99,
    description: "For professional creators",
    features: [
      "150 credits per month",
      "Everything in Deluxe",
      "AI audio narration",
      "Analytics dashboard",
      "Commercial distribution tools",
      "Sell on Kindle, Gumroad, etc.",
      "Custom creator features"
    ],
    stripeProductId: "prod_T6Bhc1NIFJgcuW",
    stripePriceId: "price_1S9zK25U03MNTw3qoCHo9KzE"
  }
];

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useClerkAuth();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<string>("premium");
  const [couponCode, setCouponCode] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  
  // Get the selected plan from the URL query params if available
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const planFromUrl = params.get("plan");
    if (planFromUrl && planOptions.some(plan => plan.id === planFromUrl)) {
      setSelectedPlan(planFromUrl);
    }
  }, [location.search]);

  const handleProceedToCheckout = async () => {
    setIsProcessing(true);
    
    try {
      const selectedPlanOption = planOptions.find(plan => plan.id === selectedPlan);
      
      if (!selectedPlanOption) {
        throw new Error("Invalid plan selected");
      }

      // Validate user data before proceeding
      if (!user?.email) {
        throw new Error("User email is required for checkout");
      }

      toast({
        title: "Redirecting to secure checkout",
        description: "You'll be redirected to Stripe to complete your purchase securely.",
      });

      // Call Stripe checkout function
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { plan: selectedPlan }
      });

      if (error) {
        throw new Error(error.message || 'Failed to create checkout session');
      }

      if (data?.url) {
        // Open Stripe checkout in new tab
        window.open(data.url, '_blank');
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error("Checkout error occurred:", error);
      
      // Show user-friendly error message
      const errorMessage = error instanceof Error 
        ? error.message.includes('email')
          ? "Please ensure you're logged in with a valid email address."
          : error.message
        : "There was a problem initiating checkout. Please try again.";
      
      toast({
        title: "Checkout Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container max-w-4xl mx-auto py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold mb-2">Choose Your Plan</h1>
        <p className="text-gray-600">
          Select the plan that works best for you and your storytelling needs
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <RadioGroup
            value={selectedPlan}
            onValueChange={setSelectedPlan}
            className="space-y-4"
          >
            {planOptions.map((plan) => (
              <Card
                key={plan.id}
                className={`cursor-pointer transition-all ${
                  selectedPlan === plan.id
                    ? "border-primary ring-2 ring-primary/20"
                    : "hover:border-gray-300"
                }`}
                onClick={() => setSelectedPlan(plan.id)}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value={plan.id} id={plan.id} />
                      <Label htmlFor={plan.id} className="text-xl font-semibold">
                        {plan.name}
                      </Label>
                    </div>
                    <div className="text-2xl font-bold">${plan.price}/mo</div>
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </RadioGroup>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Have a coupon?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-2">
                <Input
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                />
                <Button variant="outline" disabled={!couponCode}>
                  Apply
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedPlan && (
                <>
                  <div className="flex justify-between">
                    <span className="font-medium">
                      {planOptions.find((p) => p.id === selectedPlan)?.name}
                    </span>
                    <span>
                      ${planOptions.find((p) => p.id === selectedPlan)?.price}/month
                    </span>
                  </div>
                  <div className="border-t pt-4 flex justify-between font-bold">
                    <span>Total</span>
                    <span>
                      ${planOptions.find((p) => p.id === selectedPlan)?.price}/month
                    </span>
                  </div>
                </>
              )}

              <div className="pt-4 space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <Shield className="h-4 w-4 mr-2" />
                  <span>Secure payment processing</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <CreditCard className="h-4 w-4 mr-2" />
                  <span>Major credit cards accepted</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                size="lg"
                onClick={handleProceedToCheckout}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Proceed to Checkout"
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Checkout; 