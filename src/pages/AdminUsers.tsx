import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import AdminNav from "@/components/AdminNav";
import { 
  ArrowLeft, 
  Users, 
  Search, 
  Filter,
  MoreHorizontal,
  Mail,
  Calendar,
  Crown,
  UserCheck,
  UserX,
  Eye
} from "lucide-react";

interface User {
  id: string;
  email: string;
  name: string;
  subscription_status: 'free' | 'basic' | 'premium';
  created_at: string;
  last_login: string;
  stories_count: number;
  is_active: boolean;
}

const AdminUsers = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [users, setUsers] = useState<User[]>([
    {
      id: '1',
      email: 'john@example.com',
      name: 'John Doe',
      subscription_status: 'premium',
      created_at: '2024-01-15T10:30:00Z',
      last_login: '2024-01-20T14:45:00Z',
      stories_count: 25,
      is_active: true
    },
    {
      id: '2',
      email: 'jane@example.com',
      name: 'Jane Smith',
      subscription_status: 'basic',
      created_at: '2024-01-10T09:15:00Z',
      last_login: '2024-01-19T16:20:00Z',
      stories_count: 12,
      is_active: true
    },
    {
      id: '3',
      email: 'bob@example.com',
      name: 'Bob Johnson',
      subscription_status: 'free',
      created_at: '2024-01-05T11:00:00Z',
      last_login: '2024-01-18T13:30:00Z',
      stories_count: 3,
      is_active: false
    },
    {
      id: '4',
      email: 'alice@example.com',
      name: 'Alice Brown',
      subscription_status: 'premium',
      created_at: '2024-01-12T08:45:00Z',
      last_login: '2024-01-20T10:15:00Z',
      stories_count: 42,
      is_active: true
    }
  ]);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || user.subscription_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const updateUserStatus = async (userId: string, status: 'free' | 'basic' | 'premium') => {
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setUsers(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, subscription_status: status }
          : user
      ));
      
      toast({
        title: "User Updated",
        description: "User subscription status has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update user status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleUserActive = async (userId: string) => {
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setUsers(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, is_active: !user.is_active }
          : user
      ));
      
      toast({
        title: "User Status Updated",
        description: "User active status has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update user status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'premium':
        return <Badge variant="default" className="bg-purple-500">Premium</Badge>;
      case 'basic':
        return <Badge variant="default" className="bg-blue-500">Basic</Badge>;
      case 'free':
        return <Badge variant="secondary">Free</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getActiveBadge = (isActive: boolean) => {
    return isActive 
      ? <Badge variant="default" className="bg-green-500">Active</Badge>
      : <Badge variant="destructive">Inactive</Badge>;
  };

  const stats = {
    total: users.length,
    premium: users.filter(u => u.subscription_status === 'premium').length,
    basic: users.filter(u => u.subscription_status === 'basic').length,
    free: users.filter(u => u.subscription_status === 'free').length,
    active: users.filter(u => u.is_active).length
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
            <Users className="h-8 w-8 text-green-500" />
            <h1 className="text-3xl font-bold">User Management</h1>
          </div>
          <p className="text-gray-600 mt-2">
            Manage user accounts, subscriptions, and access
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">Total Users</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-purple-600">{stats.premium}</div>
              <p className="text-xs text-muted-foreground">Premium</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{stats.basic}</div>
              <p className="text-xs text-muted-foreground">Basic</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-gray-600">{stats.free}</div>
              <p className="text-xs text-muted-foreground">Free</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
              <p className="text-xs text-muted-foreground">Active</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search users by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="free">Free</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Users ({filteredUsers.length})</CardTitle>
            <CardDescription>
              Manage user accounts and subscription status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">User</th>
                    <th className="text-left p-3 font-medium">Subscription</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Stories</th>
                    <th className="text-left p-3 font-medium">Joined</th>
                    <th className="text-left p-3 font-medium">Last Login</th>
                    <th className="text-left p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {user.email}
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        {getStatusBadge(user.subscription_status)}
                      </td>
                      <td className="p-3">
                        {getActiveBadge(user.is_active)}
                      </td>
                      <td className="p-3">
                        <span className="font-medium">{user.stories_count}</span>
                      </td>
                      <td className="p-3">
                        <div className="text-sm">
                          {new Date(user.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm">
                          {new Date(user.last_login).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <Select
                            value={user.subscription_status}
                            onValueChange={(value: 'free' | 'basic' | 'premium') => 
                              updateUserStatus(user.id, value)
                            }
                            disabled={isLoading}
                          >
                            <SelectTrigger className="w-[100px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="free">Free</SelectItem>
                              <SelectItem value="basic">Basic</SelectItem>
                              <SelectItem value="premium">Premium</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleUserActive(user.id)}
                            disabled={isLoading}
                          >
                            {user.is_active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {filteredUsers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No users found matching your criteria.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminUsers; 