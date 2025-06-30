import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useClerkAuth } from '@/modules/auth/contexts/ClerkAuthContext';
import { Button } from '@/modules/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/modules/shared/components/ui/card';
import { Badge } from '@/modules/shared/components/ui/badge';
import { CheckCircle, Star, Users, Zap, BookOpen, Video, Download, MessageSquare } from "lucide-react";

interface PlanFeature {
  name: string;
  icon: React.ReactNode;
  included: {
    free: boolean;
    basic: boolean;
    premium: boolean;
  };
}

const features: PlanFeature[] = [
  {
    name: "Story Generation",
    icon: <BookOpen className="h-5 w-5" />,
    included: {
      free: true,
      basic: true,
      premium: true,
    },
  },
  {
    name: "Stories per month",
    icon: <BookOpen className="h-5 w-5" />,
    included: {
      free: false,
      basic: true,
      premium: true,
    },
  },
  {
    name: "Illustrations",
    icon: <Star className="h-5 w-5" />,
    included: {
      free: false,
      basic: true,
      premium: true,
    },
  },
  {
    name: "Video Generation",
    icon: <Video className="h-5 w-5" />,
    included: {
      free: false,
      basic: false,
      premium: true,
    },
  },
  {
    name: "PDF Downloads",
    icon: <Download className="h-5 w-5" />,
    included: {
      free: false,
      basic: true,
      premium: true,
    },
  },
  {
    name: "Priority Support",
    icon: <MessageSquare className="h-5 w-5" />,
    included: {
      free: false,
      basic: false,
      premium: true,
    },
  },
  {
    name: "Family Sharing",
    icon: <Users className="h-5 w-5" />,
    included: {
      free: false,
      basic: false,
      premium: true,
    },
  },
  {
    name: "Advanced Customization",
    icon: <Zap className="h-5 w-5" />,
    included: {
      free: false,
      basic: false,
      premium: true,
    },
  },
];

const UpgradePlan = () => {
  const navigate = useNavigate();
  const { user } = useClerkAuth();
  const currentPlan = user?.subscription_status || "free";

  const handleSelectPlan = (planId: string) => {
    navigate(`/checkout?plan=${planId}`);
  };

  return (
    <div className="container py-12">
      <div className="text-center max-w-3xl mx-auto mb-12">
        <h1 className="text-3xl font-bold mb-3">Upgrade Your Storytelling Experience</h1>
        <p className="text-gray-600 text-lg">
          Choose the plan that best fits your creative needs and unlock powerful features to bring your stories to life.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {/* Free Plan */}
        <Card className="relative border-gray-200">
          <CardHeader>
            <CardTitle>Free Plan</CardTitle>
            <CardDescription>Get started with basic features</CardDescription>
            <div className="mt-4">
              <span className="text-3xl font-bold">$0</span>
              <span className="text-gray-500 ml-1">/month</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2">
              {features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  {feature.included.free ? (
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                  ) : (
                    <div className="h-5 w-5 border border-gray-300 rounded-full mr-2 shrink-0 mt-0.5" />
                  )}
                  <div className="flex items-center">
                    <span className="mr-2">{feature.name}</span>
                    {feature.name === "Stories per month" && feature.included.free && (
                      <Badge variant="outline">3 stories</Badge>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button
              variant={currentPlan === "free" ? "secondary" : "outline"}
              className="w-full"
              disabled={currentPlan === "free"}
            >
              {currentPlan === "free" ? "Current Plan" : "Select Plan"}
            </Button>
          </CardFooter>
        </Card>

        {/* Basic Plan */}
        <Card className="relative border-primary">
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <Badge className="bg-primary text-white px-3 py-1">POPULAR</Badge>
          </div>
          <CardHeader>
            <CardTitle>Basic Plan</CardTitle>
            <CardDescription>Perfect for regular storytellers</CardDescription>
            <div className="mt-4">
              <span className="text-3xl font-bold">$9.99</span>
              <span className="text-gray-500 ml-1">/month</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2">
              {features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  {feature.included.basic ? (
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                  ) : (
                    <div className="h-5 w-5 border border-gray-300 rounded-full mr-2 shrink-0 mt-0.5" />
                  )}
                  <div className="flex items-center">
                    <span className="mr-2">{feature.name}</span>
                    {feature.name === "Stories per month" && feature.included.basic && (
                      <Badge variant="outline">10 stories</Badge>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              variant={currentPlan === "basic" ? "secondary" : "default"}
              disabled={currentPlan === "basic"}
              onClick={() => handleSelectPlan("basic")}
            >
              {currentPlan === "basic" ? "Current Plan" : "Select Plan"}
            </Button>
          </CardFooter>
        </Card>

        {/* Premium Plan */}
        <Card className="relative bg-gradient-to-b from-white to-purple-50 border-purple-200">
          <CardHeader>
            <CardTitle>Premium Plan</CardTitle>
            <CardDescription>For serious storytellers and families</CardDescription>
            <div className="mt-4">
              <span className="text-3xl font-bold">$19.99</span>
              <span className="text-gray-500 ml-1">/month</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2">
              {features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  {feature.included.premium ? (
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                  ) : (
                    <div className="h-5 w-5 border border-gray-300 rounded-full mr-2 shrink-0 mt-0.5" />
                  )}
                  <div className="flex items-center">
                    <span className="mr-2">{feature.name}</span>
                    {feature.name === "Stories per month" && feature.included.premium && (
                      <Badge variant="outline">Unlimited</Badge>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              disabled={currentPlan === "premium"}
              onClick={() => handleSelectPlan("premium")}
            >
              {currentPlan === "premium" ? "Current Plan" : "Select Plan"}
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="mt-12 text-center">
        <h3 className="text-xl font-semibold mb-4">Need a custom plan for your organization?</h3>
        <Button variant="outline" onClick={() => navigate("/contact")}>
          Contact Us
        </Button>
      </div>
    </div>
  );
};

export default UpgradePlan; 