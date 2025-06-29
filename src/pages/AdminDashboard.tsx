import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useClerkAuth } from "@/contexts/ClerkAuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AdminNav from "@/components/AdminNav";
import { 
  Settings, 
  Key, 
  BarChart3, 
  Users, 
  FileText, 
  Shield,
  ArrowRight,
  Crown
} from "lucide-react";

const AdminDashboard = () => {
  const { user } = useClerkAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const adminFeatures = [
    {
      title: "API Integrations",
      description: "Manage Groq and OpenAI API keys and settings",
      icon: Key,
      path: "/admin/integrations",
      color: "bg-blue-500",
      badge: "Active"
    },
    {
      title: "User Management",
      description: "View and manage user accounts and subscriptions",
      icon: Users,
      path: "/admin/users",
      color: "bg-green-500",
      badge: "Active"
    },
    {
      title: "Analytics",
      description: "View usage statistics and performance metrics",
      icon: BarChart3,
      path: "/admin/analytics",
      color: "bg-purple-500",
      badge: "Coming Soon"
    },
    {
      title: "Content Management",
      description: "Manage stories, templates, and content",
      icon: FileText,
      path: "/admin/content",
      color: "bg-orange-500",
      badge: "Coming Soon"
    },
    {
      title: "System Settings",
      description: "Configure application settings and preferences",
      icon: Settings,
      path: "/admin/settings",
      color: "bg-gray-500",
      badge: "Coming Soon"
    },
    {
      title: "Security",
      description: "Monitor security logs and access controls",
      icon: Shield,
      path: "/admin/security",
      color: "bg-red-500",
      badge: "Coming Soon"
    }
  ];

  const handleFeatureClick = (path: string) => {
    setIsLoading(true);
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />
      <div className="container max-w-7xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Crown className="h-8 w-8 text-yellow-500" />
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <Badge variant="secondary" className="ml-2">
              Admin
            </Badge>
          </div>
          <p className="text-gray-600">
            Welcome back, {user?.name || user?.email}. Manage your application from here.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,234</div>
              <p className="text-xs text-muted-foreground">
                +12% from last month
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stories Generated</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5,678</div>
              <p className="text-xs text-muted-foreground">
                +8% from last month
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">API Calls</CardTitle>
              <Key className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12,345</div>
              <p className="text-xs text-muted-foreground">
                +15% from last month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Admin Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminFeatures.map((feature, index) => {
            const IconComponent = feature.icon;
            const isActive = feature.badge === "Active";
            
            return (
              <Card 
                key={index} 
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  isActive ? 'hover:border-primary' : 'opacity-60'
                }`}
                onClick={() => isActive && handleFeatureClick(feature.path)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className={`p-2 rounded-lg ${feature.color}`}>
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    <Badge variant={isActive ? "default" : "secondary"}>
                      {feature.badge}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {isActive ? "Click to access" : "Coming soon"}
                    </span>
                    {isActive && (
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Recent Activity */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest admin actions and system events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">API key updated for Groq integration</span>
                  <span className="text-xs text-muted-foreground ml-auto">2 min ago</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm">New user registered: john@example.com</span>
                  <span className="text-xs text-muted-foreground ml-auto">15 min ago</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm">High API usage detected</span>
                  <span className="text-xs text-muted-foreground ml-auto">1 hour ago</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 