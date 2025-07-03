import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useClerkAuth } from '@/modules/auth/contexts/ClerkAuthContext';
import { useToast } from '@/modules/shared/hooks/use-toast';
import { supabase } from '@/core/integrations/supabase/client';
import { Button } from '@/modules/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shared/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/shared/components/ui/tabs';
import { Badge } from '@/modules/shared/components/ui/badge';
import { 
  Loader2, 
  BookOpen, 
  User, 
  CreditCard, 
  Plus, 
  Calendar, 
  UserCircle,
  Sparkles,
  Settings
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { UserBooks } from '@/modules/ebook/components/UserBooks';

interface Story {
  id: string;
  title: string;
  name: string;
  birth_date: string | null;
  initial_story: string;
  created_at: string;
}

const UserDashboard = () => {
  const { user } = useClerkAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (user?.id) {
      loadStories();
    }
  }, [user?.id]);

  // Handle URL parameters for direct tab access
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam && ['overview', 'stories', 'account', 'billing'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [location.search]);

  const loadStories = async () => {
    try {
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(6); // Show only recent stories

      if (error) throw error;
      setStories(data || []);
    } catch (error: unknown) {
      toast({
        title: "Error loading stories",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getSubscriptionBadge = () => {
    const status = user?.subscription_status || 'free';
    const variants = {
      free: 'secondary',
      basic: 'default',
      premium: 'default'
    } as const;
    
    const colors = {
      free: 'bg-gray-100 text-gray-800',
      basic: 'bg-blue-100 text-blue-800',
      premium: 'bg-purple-100 text-purple-800'
    };

    return (
      <Badge className={colors[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)} Plan
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Welcome back, {user?.name?.split(' ')[0] || 'Storyteller'}! ✨
              </h1>
              <p className="text-gray-600">
                Your alternate timeline stories and account settings
              </p>
            </div>
            <div className="flex items-center gap-3">
              {getSubscriptionBadge()}
              <Button
                onClick={() => navigate('/')}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New Story
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="stories">My Stories</TabsTrigger>
            <TabsTrigger value="books">My Books</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Quick Stats */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Stories</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stories.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Your alternate timeline stories
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Current Plan</CardTitle>
                  <Sparkles className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold capitalize">
                    {user?.subscription_status || 'Free'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {user?.subscription_status === 'premium' ? 'Unlimited stories & features' : 
                     user?.subscription_status === 'basic' ? '10 stories per month' : 
                     '3 free stories per month'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Member Since</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Time-traveling with us
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Stories */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Stories</CardTitle>
                <CardDescription>
                  Your latest alternate timeline adventures
                </CardDescription>
              </CardHeader>
              <CardContent>
                {stories.length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No stories yet</h3>
                    <p className="text-gray-500 mb-4">Start creating your first alternate timeline story!</p>
                    <Button
                      onClick={() => navigate('/')}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                    >
                      Create Your First Story
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {stories.slice(0, 3).map((story) => (
                      <div
                        key={story.id}
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => navigate(`/story/${story.id}`)}
                      >
                        <h4 className="font-semibold text-gray-900 mb-2 line-clamp-1">
                          {story.title || "Untitled Story"}
                        </h4>
                        <div className="flex items-center text-sm text-gray-500 mb-2">
                          <UserCircle className="h-4 w-4 mr-1" />
                          <span>{story.name}</span>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {story.initial_story.substring(0, 100)}...
                        </p>
                        <div className="text-xs text-gray-500 mt-2">
                          {new Date(story.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {stories.length > 3 && (
                  <div className="mt-4 text-center">
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab("stories")}
                    >
                      View All Stories
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Stories Tab */}
          <TabsContent value="stories" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">All Stories</h2>
              <Button
                onClick={() => navigate('/')}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New Story
              </Button>
            </div>

            {stories.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-medium text-gray-900 mb-2">No stories yet</h3>
                  <p className="text-gray-500 mb-4">Start creating your alternate life stories!</p>
                  <Button
                    onClick={() => navigate('/')}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                  >
                    Create Your First Story
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stories.map((story) => (
                  <Card
                    key={story.id}
                    className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => navigate(`/story/${story.id}`)}
                  >
                    <CardContent className="p-6">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-1">
                        {story.title || "Untitled Story"}
                      </h3>
                      <div className="flex items-center text-sm text-gray-500 mb-4">
                        <UserCircle className="h-4 w-4 mr-1" />
                        <span>{story.name}</span>
                        {story.birth_date && (
                          <>
                            <Calendar className="h-4 w-4 ml-3 mr-1" />
                            <span>{new Date(story.birth_date).toLocaleDateString()}</span>
                          </>
                        )}
                      </div>
                      <div className="prose prose-sm line-clamp-3 mb-4 text-gray-600">
                        <ReactMarkdown>{story.initial_story}</ReactMarkdown>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">
                          {new Date(story.created_at).toLocaleDateString()}
                        </span>
                        <Button variant="outline" size="sm">
                          Read More
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Books Tab */}
          <TabsContent value="books" className="space-y-6">
            <UserBooks 
              onBookSelect={(book) => {
                // TODO: Implement book reader/viewer
                console.log('Selected book:', book);
              }}
            />
          </TabsContent>

          {/* Account Tab */}
          <TabsContent value="account" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Profile Information
                </CardTitle>
                <CardDescription>
                  Your account details and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Name</label>
                    <p className="text-gray-900">{user?.name || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    <p className="text-gray-900">{user?.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Member Since</label>
                    <p className="text-gray-900">
                      {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Current Plan</label>
                    <div className="flex items-center gap-2">
                      {getSubscriptionBadge()}
                    </div>
                  </div>
                </div>
                <div className="pt-4">
                  <p className="text-sm text-gray-600">
                    Profile editing features coming soon. For now, contact support if you need to update your information.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Billing & Subscription
                </CardTitle>
                <CardDescription>
                  Manage your subscription and billing information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="w-full h-[600px] rounded-lg overflow-hidden border border-gray-200">
                  {loading ? (
                    <div className="flex justify-center items-center h-[600px]">
                      <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                      <span className="ml-2">Loading billing portal...</span>
                    </div>
                  ) : (
                    <iframe
                      src="https://flipmyera.samcart.com/customer_hub/login"
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      title="SamCart Customer Portal"
                      className="w-full h-full"
                      allow="payment"
                      onLoad={() => setLoading(false)}
                      onError={() => setError('Failed to load billing portal')}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default UserDashboard; 