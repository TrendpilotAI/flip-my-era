import { useNavigate } from "react-router-dom";
import { useClerkAuth } from '@/modules/auth/contexts/ClerkAuthContext';
import { Button } from '@/modules/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/modules/shared/components/ui/card';
import { Badge } from '@/modules/shared/components/ui/badge';
import { CheckCircle } from "lucide-react";

const UpgradePlan = () => {
  const navigate = useNavigate();
  const { user } = useClerkAuth();
  const currentCredits = user?.credits || 0;

  const handleSelectPlan = (planId: string) => {
    navigate(`/checkout?plan=${planId}`);
  };

  return (
    <div className="container py-12">
      <div className="text-center max-w-3xl mx-auto mb-12">
        <h1 className="text-3xl font-bold mb-3">Purchase Credits for Your Stories</h1>
        <p className="text-gray-600 text-lg">
          Choose the credit package that best fits your creative needs. Each credit allows you to generate one ebook.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {/* Single Credit */}
        <Card className="relative border-gray-200">
          <CardHeader>
            <CardTitle>Single Credit</CardTitle>
            <CardDescription>Perfect for trying out ebook generation</CardDescription>
            <div className="mt-4">
              <span className="text-3xl font-bold">$2.99</span>
              <span className="text-gray-500 ml-1">per credit</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2">
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                <span>1 ebook generation</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                <span>High-quality PDF download</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                <span>Professional formatting</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                <span>Instant delivery</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              onClick={() => handleSelectPlan("single")}
            >
              Purchase 1 Credit
            </Button>
          </CardFooter>
        </Card>

        {/* Basic Bundle */}
        <Card className="relative border-primary">
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <Badge className="bg-primary text-white px-3 py-1">BEST VALUE</Badge>
          </div>
          <CardHeader>
            <CardTitle>Basic Bundle</CardTitle>
            <CardDescription>Great for regular storytellers</CardDescription>
            <div className="mt-4">
              <span className="text-3xl font-bold">$7.99</span>
              <span className="text-gray-500 ml-1">for 3 credits</span>
            </div>
            <div className="text-sm text-green-600 font-medium">
              Save $1.98 (33% off)
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2">
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                <span>3 ebook generations</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                <span>High-quality PDF downloads</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                <span>Professional formatting</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                <span>Instant delivery</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              onClick={() => handleSelectPlan("basic")}
            >
              Purchase 3 Credits
            </Button>
          </CardFooter>
        </Card>

        {/* Premium Bundle */}
        <Card className="relative bg-gradient-to-b from-white to-purple-50 border-purple-200">
          <CardHeader>
            <CardTitle>Premium Bundle</CardTitle>
            <CardDescription>For serious storytellers</CardDescription>
            <div className="mt-4">
              <span className="text-3xl font-bold">$12.99</span>
              <span className="text-gray-500 ml-1">for 5 credits</span>
            </div>
            <div className="text-sm text-green-600 font-medium">
              Save $3.96 (38% off)
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2">
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                <span>5 ebook generations</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                <span>High-quality PDF downloads</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                <span>Professional formatting</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                <span>Instant delivery</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              onClick={() => handleSelectPlan("premium")}
            >
              Purchase 5 Credits
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="mt-12 text-center">
        <h3 className="text-xl font-semibold mb-4">Current Credit Balance: {currentCredits} credits</h3>
        <p className="text-gray-600 mb-4">Each credit allows you to generate one high-quality ebook from your story.</p>
        <Button variant="outline" onClick={() => navigate("/settings")}>
          View Credit Balance
        </Button>
      </div>
    </div>
  );
};

export default UpgradePlan; 