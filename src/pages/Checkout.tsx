import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { samcartClient } from "@/integrations/samcart/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, Shield, CreditCard } from "lucide-react";

interface PlanOption {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  samcartProductId: string;
}

const planOptions: PlanOption[] = [
  {
    id: "basic",
    name: "Basic Plan",
    price: 9.99,
    description: "Perfect for beginners",
    features: [
      "10 stories per month",
      "Basic illustrations",
      "PDF downloads",
      "Email support"
    ],
    samcartProductId: "starter-service"
  },
  {
    id: "premium",
    name: "Premium Plan",
    price: 19.99,
    description: "Our most popular plan",
    features: [
      "Unlimited stories",
      "High-quality illustrations",
      "PDF and ePub downloads",
      "Video generation",
      "Priority support"
    ],
    samcartProductId: "e-memory-book"
  },
  {
    id: "family",
    name: "Family Plan",
    price: 29.99,
    description: "Share with your family",
    features: [
      "Everything in Premium",
      "Up to 5 family members",
      "Shared story library",
      "Family collaboration tools",
      "24/7 support"
    ],
    samcartProductId: "e-memory-book"
  }
];

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
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

  const handleProceedToCheckout = () => {
    setIsProcessing(true);
    
    try {
      const selectedPlanOption = planOptions.find(plan => plan.id === selectedPlan);
      
      if (!selectedPlanOption) {
        throw new Error("Invalid plan selected");
      }
      
      // Prepare checkout options for SamCart
      const checkoutOptions = {
        productId: selectedPlanOption.samcartProductId,
        customerEmail: user?.email,
        customerName: user?.name,
        couponCode: couponCode || undefined,
        redirectUrl: `${window.location.origin}/checkout/success?plan=${selectedPlan}`,
        cancelUrl: `${window.location.origin}/checkout?plan=${selectedPlan}`,
        metadata: {
          userId: user?.id,
          planId: selectedPlan,
          source: "website"
        }
      };
      
      // In a real implementation, this would redirect to SamCart
      // For demo purposes, we'll simulate the process
      setTimeout(() => {
        toast({
          title: "Redirecting to secure checkout",
          description: "You'll be redirected to complete your purchase securely.",
        });
        
        // In production, use this to redirect to SamCart:
        // samcartClient.redirectToCheckout(checkoutOptions);
        
        // For demo, we'll navigate to a success page
        navigate("/checkout/success?plan=" + selectedPlan);
      }, 1500);
    } catch (error) {
      console.error("Checkout error:", error);
      toast({
        title: "Checkout Error",
        description: "There was a problem initiating checkout. Please try again.",
        variant: "destructive",
      });
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