import { useState, useEffect } from "react";
import { SEO } from '@/modules/shared/components/SEO';
import { useNavigate, useLocation } from "react-router-dom";
import { useClerkAuth } from '@/modules/auth/contexts';
import { invokeAuthenticatedFunction } from '@/integrations/supabase/client';
import { Button } from '@/modules/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/modules/shared/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/modules/shared/components/ui/radio-group';
import { Label } from '@/modules/shared/components/ui/label';
import { Input } from '@/modules/shared/components/ui/input';
import { useToast } from '@/modules/shared/hooks/use-toast';
import { Loader2, CheckCircle, Shield, CreditCard } from "lucide-react";
import { STRIPE_PRODUCTS } from '@/config/stripe-products';
import type { CheckoutFunctionResponse } from '@/core/integrations/supabase/functionResponses';

 

interface PlanOption {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  productType: 'credits' | 'subscription';
  billingLabel: string;
}

const monthlyPlanOptions: PlanOption[] = [
  {
    id: "speakNow",
    name: STRIPE_PRODUCTS.subscriptions.speakNow.name || "Speak Now",
    price: STRIPE_PRODUCTS.subscriptions.speakNow.price,
    description: STRIPE_PRODUCTS.subscriptions.speakNow.description || "Find your voice",
    features: STRIPE_PRODUCTS.subscriptions.speakNow.features || [],
    productType: 'subscription',
    billingLabel: '/month',
  },
  {
    id: "midnights",
    name: STRIPE_PRODUCTS.subscriptions.midnights.name || "Midnights",
    price: STRIPE_PRODUCTS.subscriptions.midnights.price,
    description: STRIPE_PRODUCTS.subscriptions.midnights.description || "You're the main character",
    features: STRIPE_PRODUCTS.subscriptions.midnights.features || [],
    productType: 'subscription',
    billingLabel: '/month',
  },
  {
    id: "erasTour",
    name: STRIPE_PRODUCTS.subscriptions.erasTour.name || "The Eras Tour",
    price: STRIPE_PRODUCTS.subscriptions.erasTour.price,
    description: STRIPE_PRODUCTS.subscriptions.erasTour.description || "Our highest monthly credit allowance",
    features: STRIPE_PRODUCTS.subscriptions.erasTour.features || [],
    productType: 'subscription',
    billingLabel: '/month',
  }
];

const annualPlanOptions: PlanOption[] = [
  {
    id: 'speakNowAnnual',
    name: STRIPE_PRODUCTS.subscriptions.speakNowAnnual.name || 'Speak Now (Annual)',
    price: 95.88,
    description: STRIPE_PRODUCTS.subscriptions.speakNowAnnual.description || 'Annual Speak Now membership',
    features: STRIPE_PRODUCTS.subscriptions.speakNowAnnual.features || [],
    productType: 'subscription',
    billingLabel: '/year',
  },
  {
    id: 'midnightsAnnual',
    name: STRIPE_PRODUCTS.subscriptions.midnightsAnnual.name || 'Midnights (Annual)',
    price: 191.88,
    description: STRIPE_PRODUCTS.subscriptions.midnightsAnnual.description || 'Annual Midnights membership',
    features: STRIPE_PRODUCTS.subscriptions.midnightsAnnual.features || [],
    productType: 'subscription',
    billingLabel: '/year',
  },
  {
    id: 'erasTourAnnual',
    name: STRIPE_PRODUCTS.subscriptions.erasTourAnnual.name || 'The Eras Tour (Annual)',
    price: 479.88,
    description: STRIPE_PRODUCTS.subscriptions.erasTourAnnual.description || 'Annual Eras Tour membership',
    features: STRIPE_PRODUCTS.subscriptions.erasTourAnnual.features || [],
    productType: 'subscription',
    billingLabel: '/year',
  },
];

const creditPackOptions: PlanOption[] = Object.entries(STRIPE_PRODUCTS.credits)
  .filter(([id]) => ['single', 'album', 'tour'].includes(id))
  .map(([id, pack]) => ({
    id,
    name: pack.name || id,
    price: pack.price,
    description: pack.description || `${pack.credits} credits`,
    features: [`${pack.credits} credits`, 'Credits never expire'],
    productType: 'credits' as const,
    billingLabel: ' one-time',
  }));

const allPlanOptions = [...monthlyPlanOptions, ...annualPlanOptions, ...creditPackOptions];

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, getToken } = useClerkAuth();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<string>("speakNow");
  const [couponCode, setCouponCode] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  
  // Get the selected plan from the URL query params if available
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const requestedProduct = params.get("pack") || params.get("plan");
    if (requestedProduct && allPlanOptions.some(plan => plan.id === requestedProduct)) {
      setSelectedPlan(requestedProduct);
    }
  }, [location.search]);

  const selectedPlanOption = allPlanOptions.find(plan => plan.id === selectedPlan) || monthlyPlanOptions[0];
  const planOptions = selectedPlanOption.productType === 'credits'
    ? creditPackOptions
    : selectedPlan.endsWith('Annual')
      ? annualPlanOptions
      : monthlyPlanOptions;

  const handleProceedToCheckout = async () => {
    setIsProcessing(true);
    
    try {
      // Validate user data before proceeding
      if (!user?.email) {
        throw new Error("User email is required for checkout");
      }

      toast({
        title: "Redirecting to secure checkout",
        description: "You'll be redirected to Stripe to complete your purchase securely.",
      });

      // Call Stripe checkout function
      const token = await getToken();
      if (!token) throw new Error("Please sign in again before checkout");

      const { data, error } = await invokeAuthenticatedFunction<CheckoutFunctionResponse>('create-checkout', {
        headers: { Authorization: `Bearer ${token}` },
        body: { plan: selectedPlan, productType: selectedPlanOption.productType }
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
      <SEO title="Checkout" description="Choose your FlipMyEra plan and start creating personalized storybooks." url="/checkout" />
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold mb-2">Choose Your Plan</h1>
        <p className="text-gray-600">
          {selectedPlanOption.productType === 'credits'
            ? 'Choose a one-time credit pack. Purchased credits never expire.'
            : 'Select the membership that works best for your storytelling needs.'}
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
                    <div className="text-2xl font-bold">${plan.price.toFixed(2)}{plan.billingLabel}</div>
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
