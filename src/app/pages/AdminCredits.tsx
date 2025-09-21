import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shared/components/ui/card';
import { Button } from '@/modules/shared/components/ui/button';
import { Input } from '@/modules/shared/components/ui/input';
import { Badge } from '@/modules/shared/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shared/components/ui/select';
import { Textarea } from '@/modules/shared/components/ui/textarea';
import { Label } from '@/modules/shared/components/ui/label';
import { useToast } from '@/modules/shared/hooks/use-toast';
import { useClerkAuth } from '@/modules/auth/contexts/ClerkAuthContext';
import { supabase } from '@/core/integrations/supabase/client';
import AdminNav from '@/modules/shared/components/AdminNav';
import { 
  ArrowLeft, 
  Coins, 
  Search, 
  Plus,
  User,
  Mail,
  Calendar,
  Crown,
  RefreshCw,
  CheckCircle,
  AlertCircle
} from "lucide-react";

interface User {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
  credit_balance: number;
  subscription_type: string | null;
  total_earned: number;
  total_spent: number;
}

interface CreditTransaction {
  id: string;
  amount: number;
  description: string;
  created_at: string;
  metadata: {
    admin_email?: string;
    reason?: string;
    admin_note?: string;
  };
}

const AdminCredits = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getToken } = useClerkAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userTransactions, setUserTransactions] = useState<CreditTransaction[]>([]);
  const [creditsToAdd, setCreditsToAdd] = useState(1);
  const [reason, setReason] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [isAddingCredits, setIsAddingCredits] = useState(false);

  // Fetch all users with their credit information
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const token = await getToken();
      
      // Get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name, created_at')
        .order('created_at', { ascending: false });

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        toast({
          title: "Error",
          description: "Failed to fetch users",
          variant: "destructive",
        });
        return;
      }

      // Get credit information for all users
      const { data: credits, error: creditsError } = await supabase
        .from('user_credits')
        .select('user_id, balance, subscription_type, total_earned, total_spent');

      if (creditsError) {
        console.error('Error fetching credits:', creditsError);
        toast({
          title: "Error",
          description: "Failed to fetch credit information",
          variant: "destructive",
        });
        return;
      }

      // Combine profile and credit data
      const usersWithCredits = profiles.map(profile => {
        const creditData = credits.find(c => c.user_id === profile.id);
        return {
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name || 'Unknown',
          created_at: profile.created_at,
          credit_balance: creditData?.balance || 0,
          subscription_type: creditData?.subscription_type || null,
          total_earned: creditData?.total_earned || 0,
          total_spent: creditData?.total_spent || 0,
        };
      });

      setUsers(usersWithCredits as User[]);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch user's credit transactions
  const fetchUserTransactions = async (userId: string) => {
    try {
      const { data: transactions, error } = await supabase
        .from('credit_transactions')
        .select('id, amount, description, created_at, metadata')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching transactions:', error);
        return;
      }

      setUserTransactions((transactions || []) as CreditTransaction[]);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  // Add credits to user
  const addCreditsToUser = async () => {
    if (!selectedUser || !reason.trim()) {
      toast({
        title: "Validation Error",
        description: "Please select a user and provide a reason",
        variant: "destructive",
      });
      return;
    }

    if (creditsToAdd <= 0) {
      toast({
        title: "Validation Error",
        description: "Credits to add must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    setIsAddingCredits(true);
    try {
      const token = await getToken();
      
      const { data, error } = await supabase.functions.invoke('admin-credits', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id: selectedUser.id,
          credits_to_add: creditsToAdd,
          reason: reason.trim(),
          admin_note: adminNote.trim() || undefined
        })
      });

      if (error) {
        console.error('Error adding credits:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to add credits",
          variant: "destructive",
        });
        return;
      }

      if (data?.success) {
        toast({
          title: "Success",
          description: `Added ${creditsToAdd} credits to ${selectedUser.email}. New balance: ${data.data.new_balance}`,
        });

        // Reset form
        setCreditsToAdd(1);
        setReason('');
        setAdminNote('');

        // Refresh user data
        await fetchUsers();
        if (selectedUser) {
          await fetchUserTransactions(selectedUser.id);
        }
      } else {
        toast({
          title: "Error",
          description: data?.error || "Failed to add credits",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error adding credits:', error);
      toast({
        title: "Error",
        description: "Failed to add credits",
        variant: "destructive",
      });
    } finally {
      setIsAddingCredits(false);
    }
  };

  // Get user credit information
  const getUserCreditInfo = async (userId: string) => {
    try {
      const token = await getToken();
      
      const { data, error } = await supabase.functions.invoke('admin-credits', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: {
          user_id: userId
        }
      });

      if (error) {
        console.error('Error fetching user credit info:', error);
        return null;
      }

      return data?.data?.user_info || null;
    } catch (error) {
      console.error('Error fetching user credit info:', error);
      return null;
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      fetchUserTransactions(selectedUser.id);
    }
  }, [selectedUser]);

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSubscriptionBadge = (subscriptionType: string | null) => {
    if (!subscriptionType) return null;

    switch (subscriptionType) {
      case 'monthly_unlimited':
        return <Badge variant="secondary" className="bg-purple-500">Monthly Unlimited</Badge>;
      case 'annual_unlimited':
        return <Badge variant="default" className="bg-purple-600">Annual Unlimited</Badge>;
      default:
        return <Badge variant="outline">{subscriptionType}</Badge>;
    }
  };

  const stats = {
    total: users.length,
    withCredits: users.filter(u => u.credit_balance > 0).length,
    unlimited: users.filter(u => u.subscription_type?.includes('unlimited')).length,
    totalCredits: users.reduce((sum, u) => sum + u.credit_balance, 0)
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />
      <div className="container max-w-7xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/admin')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex items-center gap-3">
            <Coins className="h-8 w-8 text-yellow-500" />
            <h1 className="text-3xl font-bold">Credit Management</h1>
          </div>
          <p className="text-gray-600 mt-2">
            Manage user credits and add credits for free ebook generation
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">Total Users</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{stats.withCredits}</div>
              <p className="text-xs text-muted-foreground">With Credits</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-purple-600">{stats.unlimited}</div>
              <p className="text-xs text-muted-foreground">Unlimited Plans</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{stats.totalCredits}</div>
              <p className="text-xs text-muted-foreground">Total Credits</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Users List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Users</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fetchUsers}
                  disabled={isLoading}
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
              </CardTitle>
              <CardDescription>
                Select a user to manage their credits
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Users List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedUser?.id === user.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedUser(user)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium">{user.full_name}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg">
                          {user.subscription_type?.includes('unlimited') ? '∞' : user.credit_balance}
                        </div>
                        <div className="text-xs text-muted-foreground">credits</div>
                      </div>
                    </div>
                    {getSubscriptionBadge(user.subscription_type)}
                  </div>
                ))}
              </div>

              {filteredUsers.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  {isLoading ? 'Loading users...' : 'No users found'}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Credit Management */}
          <div className="space-y-6">
            {/* Selected User Info */}
            {selectedUser && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    User Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Name</Label>
                    <p className="text-lg font-semibold">{selectedUser.full_name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Email</Label>
                    <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Member Since</Label>
                    <p className="text-sm text-muted-foreground">
                      {new Date(selectedUser.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Current Balance</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold">
                        {selectedUser.subscription_type?.includes('unlimited') ? '∞' : selectedUser.credit_balance}
                      </span>
                      <span className="text-sm text-muted-foreground">credits</span>
                      {getSubscriptionBadge(selectedUser.subscription_type)}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Total Earned</Label>
                      <p className="text-lg font-semibold text-green-600">{selectedUser.total_earned}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Total Spent</Label>
                      <p className="text-lg font-semibold text-red-600">{selectedUser.total_spent}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Add Credits Form */}
            {selectedUser && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Add Credits
                  </CardTitle>
                  <CardDescription>
                    Add credits for free ebook generation
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="credits">Credits to Add</Label>
                    <Input
                      id="credits"
                      type="number"
                      min="1"
                      value={creditsToAdd}
                      onChange={(e) => setCreditsToAdd(parseInt(e.target.value) || 1)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="reason">Reason *</Label>
                    <Select value={reason} onValueChange={setReason}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select a reason" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Customer Support">Customer Support</SelectItem>
                        <SelectItem value="Promotional Credit">Promotional Credit</SelectItem>
                        <SelectItem value="Compensation">Compensation</SelectItem>
                        <SelectItem value="Testing">Testing</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="note">Admin Note (Optional)</Label>
                    <Textarea
                      id="note"
                      placeholder="Additional notes about this credit addition..."
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                  <Button
                    onClick={addCreditsToUser}
                    disabled={isAddingCredits || !reason.trim()}
                    className="w-full"
                  >
                    {isAddingCredits ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Adding Credits...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Add {creditsToAdd} Credits
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Recent Transactions */}
            {selectedUser && userTransactions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Recent Transactions</CardTitle>
                  <CardDescription>
                    Latest credit transactions for this user
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {userTransactions.map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="text-sm font-medium">{transaction.description}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(transaction.created_at).toLocaleString()}
                          </div>
                          {transaction.metadata?.admin_note && (
                            <div className="text-xs text-blue-600 mt-1">
                              Note: {transaction.metadata.admin_note}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className={`font-semibold ${
                            transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                          </div>
                          <div className="text-xs text-muted-foreground">credits</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCredits; 