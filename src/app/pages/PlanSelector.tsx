import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useClerkAuth } from '@/modules/auth/contexts/ClerkAuthContext';
import { Button } from '@/modules/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/modules/shared/components/ui/card';
import { Badge } from '@/modules/shared/components/ui/badge';
import { CheckCircle, Star, Users, Zap, BookOpen, Video, Download, MessageSquare, Crown, Sparkles, Heart, Music } from "lucide-react";

interface PlanFeature {
  name: string;
  icon: React.ReactNode;
  included: {
    free: boolean;
    starter: boolean;
    deluxe: boolean;
    vip: boolean;
  };
}

const features: PlanFeature[] = [
  {
    name: "Credits per month",
    icon: <Sparkles className="h-5 w-5" />,
    included: {
      free: true,
      starter: true,
      deluxe: true,
      vip: true,
    },
  },
  {
    name: "Story Generation",
    icon: <BookOpen className="h-5 w-5" />,
    included: {
      free: true,
      starter: true,
      deluxe: true,
      vip: true,
    },
  },
  {
    name: "Basic Illustrations",
    icon: <Star className="h-5 w-5" />,
    included: {
      free: true,
      starter: true,
      deluxe: true,
      vip: true,
    },
  },
  {
    name: "PDF Exports",
    icon: <Download className="h-5 w-5" />,
    included: {
      free: true,
      starter: true,
      deluxe: true,
      vip: true,
    },
  },
  {
    name: "Community Access",
    icon: <Users className="h-5 w-5" />,
    included: {
      free: true,
      starter: true,
      deluxe: true,
      vip: true,
    },
  },
  {
    name: "Taylor Swift Templates",
    icon: <Heart className="h-5 w-5" />,
    included: {
      free: false,
      starter: true,
      deluxe: true,
      vip: true,
    },
  },
  {
    name: "High-Quality Illustrations",
    icon: <Star className="h-5 w-5" />,
    included: {
      free: false,
      starter: true,
      deluxe: true,
      vip: true,
    },
  },
  {
    name: "Character Portraits",
    icon: <Users className="h-5 w-5" />,
    included: {
      free: false,
      starter: true,
      deluxe: true,
      vip: true,
    },
  },
  {
    name: "Priority Support",
    icon: <MessageSquare className="h-5 w-5" />,
    included: {
      free: false,
      starter: true,
      deluxe: true,
      vip: true,
    },
  },
  {
    name: "Cinematic Spreads",
    icon: <Video className="h-5 w-5" />,
    included: {
      free: false,
      starter: false,
      deluxe: true,
      vip: true,
    },
  },
  {
    name: "TikTok-Ready Animations",
    icon: <Video className="h-5 w-5" />,
    included: {
      free: false,
      starter: false,
      deluxe: true,
      vip: true,
    },
  },
  {
    name: "Priority GPU Processing",
    icon: <Zap className="h-5 w-5" />,
    included: {
      free: false,
      starter: false,
      deluxe: true,
      vip: true,
    },
  },
  {
    name: "Commercial Licensing",
    icon: <Crown className="h-5 w-5" />,
    included: {
      free: false,
      starter: false,
      deluxe: true,
      vip: true,
    },
  },
  {
    name: "AI Audio Narration",
    icon: <Music className="h-5 w-5" />,
    included: {
      free: false,
      starter: false,
      deluxe: false,
      vip: true,
    },
  },
  {
    name: "Analytics Dashboard",
    icon: <Star className="h-5 w-5" />,
    included: {
      free: false,
      starter: false,
      deluxe: false,
      vip: true,
    },
  },
  {
    name: "Commercial Distribution Tools",
    icon: <Crown className="h-5 w-5" />,
    included: {
      free: false,
      starter: false,
      deluxe: false,
      vip: true,
    },
  },
];

const PlanSelector = () => {
  const navigate = useNavigate();
  const { user } = useClerkAuth();

  const handleSelectPlan = (planId: string) => {
    if (planId === 'free') {
      navigate('/');
    } else {
      navigate(`/checkout?plan=${planId}`);
    }
  };

  return (
    <div className="container py-12">
      <div className="text-center max-w-4xl mx-auto mb-12">
        <h1 className="text-4xl font-bold mb-4">Choose Your Creative Journey</h1>
        <p className="text-gray-600 text-lg mb-8">
          From casual storytelling to professional publishing - find the perfect plan for your creativity
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {/* Free Forever Plan */}
          <Card className="relative border-gray-200">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-xl">Free Forever</CardTitle>
              <CardDescription className="text-sm">Story Starter</CardDescription>
              <div className="mt-4">
                <span className="text-3xl font-bold">$0</span>
                <span className="text-gray-500 text-sm ml-1">/month</span>
              </div>
              <Badge variant="secondary" className="mt-2">10 credits/month</Badge>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-3">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    {feature.included.free ? (
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                    ) : (
                      <div className="h-5 w-5 border border-gray-300 rounded-full mr-2 shrink-0 mt-0.5" />
                    )}
                    <span className="text-sm">{feature.name}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                variant={user?.subscription_status === "free" ? "secondary" : "outline"}
                className="w-full"
                disabled={user?.subscription_status === "free"}
                onClick={() => handleSelectPlan("free")}
              >
                {user?.subscription_status === "free" ? "Current Plan" : "Get Started"}
              </Button>
            </CardFooter>
          </Card>

          {/* Swiftie Starter Plan */}
          <Card className="relative border-primary/20">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-xl">Swiftie Starter</CardTitle>
              <CardDescription className="text-sm">Theme Explorer</CardDescription>
              <div className="mt-4">
                <span className="text-3xl font-bold">$12.99</span>
                <span className="text-gray-500 text-sm ml-1">/month</span>
              </div>
              <Badge variant="default" className="mt-2">30 credits/month</Badge>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-3">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    {feature.included.starter ? (
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                    ) : (
                      <div className="h-5 w-5 border border-gray-300 rounded-full mr-2 shrink-0 mt-0.5" />
                    )}
                    <span className="text-sm">{feature.name}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                variant={user?.subscription_status === "basic" ? "secondary" : "default"}
                disabled={user?.subscription_status === "basic"}
                onClick={() => handleSelectPlan("starter")}
              >
                {user?.subscription_status === "basic" ? "Current Plan" : "Choose Starter"}
              </Button>
            </CardFooter>
          </Card>

          {/* Swiftie Deluxe Plan */}
          <Card className="relative bg-gradient-to-b from-white to-purple-50 border-purple-200">
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <Badge className="bg-purple-500 text-white px-3 py-1">POPULAR</Badge>
            </div>
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-xl">Swiftie Deluxe</CardTitle>
              <CardDescription className="text-sm">Content Creator</CardDescription>
              <div className="mt-4">
                <span className="text-3xl font-bold">$25</span>
                <span className="text-gray-500 text-sm ml-1">/month</span>
              </div>
              <Badge variant="default" className="mt-2 bg-purple-100 text-purple-800">75 credits/month</Badge>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-3">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    {feature.included.deluxe ? (
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                    ) : (
                      <div className="h-5 w-5 border border-gray-300 rounded-full mr-2 shrink-0 mt-0.5" />
                    )}
                    <span className="text-sm">{feature.name}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                disabled={user?.subscription_status === "premium"}
                onClick={() => handleSelectPlan("deluxe")}
              >
                {user?.subscription_status === "premium" ? "Current Plan" : "Choose Deluxe"}
              </Button>
            </CardFooter>
          </Card>

          {/* Opus VIP Plan */}
          <Card className="relative bg-gradient-to-b from-white to-amber-50 border-amber-200">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-xl">Opus VIP</CardTitle>
              <CardDescription className="text-sm">Publishing Studio</CardDescription>
              <div className="mt-4">
                <span className="text-3xl font-bold">$49.99</span>
                <span className="text-gray-500 text-sm ml-1">/month</span>
              </div>
              <Badge variant="default" className="mt-2 bg-amber-100 text-amber-800">150 credits/month</Badge>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-3">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    {feature.included.vip ? (
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                    ) : (
                      <div className="h-5 w-5 border border-gray-300 rounded-full mr-2 shrink-0 mt-0.5" />
                    )}
                    <span className="text-sm">{feature.name}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                disabled={user?.subscription_status === "premium"}
                onClick={() => handleSelectPlan("vip")}
              >
                {user?.subscription_status === "premium" ? "Current Plan" : "Choose VIP"}
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Credit Top-Up Section */}
        <div className="mt-16 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-4">Need Extra Credits?</h2>
          <p className="text-gray-600 mb-8">Top up your account with one-time credit purchases</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="text-center">
              <CardHeader>
                <CardTitle className="text-lg">$25</CardTitle>
                <CardDescription>25 credits</CardDescription>
                <Badge variant="outline" className="mt-2">$1.00 per credit</Badge>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">Perfect for a story project</p>
              </CardContent>
              <CardFooter>
                <Button className="w-full" variant="outline">
                  Buy Credits
                </Button>
              </CardFooter>
            </Card>

            <Card className="text-center border-primary">
              <CardHeader>
                <CardTitle className="text-lg">$50</CardTitle>
                <CardDescription>55 credits</CardDescription>
                <Badge variant="default" className="mt-2 bg-green-100 text-green-800">10% bonus!</Badge>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">Best value for creators</p>
              </CardContent>
              <CardFooter>
                <Button className="w-full">
                  Buy Credits
                </Button>
              </CardFooter>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <CardTitle className="text-lg">$100</CardTitle>
                <CardDescription>120 credits</CardDescription>
                <Badge variant="default" className="mt-2 bg-purple-100 text-purple-800">20% bonus!</Badge>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">Maximum value pack</p>
              </CardContent>
              <CardFooter>
                <Button className="w-full" variant="outline">
                  Buy Credits
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500 mb-4">
            All plans include 30-day money-back guarantee • Credits never expire • Cancel anytime
          </p>
          <Button variant="link" onClick={() => navigate('/faq')}>
            View Pricing FAQ
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PlanSelector;
