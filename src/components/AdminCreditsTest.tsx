import { useState } from "react";
import { Button } from '@/modules/shared/components/ui/button';
import { Input } from '@/modules/shared/components/ui/input';
import { Label } from '@/modules/shared/components/ui/label';
import { useToast } from '@/modules/shared/hooks/use-toast';
import { useClerkAuth } from '@/modules/auth/contexts/ClerkAuthContext';
import { supabase } from '@/core/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/modules/shared/components/ui/card';

const AdminCreditsTest = () => {
  const { toast } = useToast();
  const { getToken } = useClerkAuth();
  const [userId, setUserId] = useState('');
  const [creditsToAdd, setCreditsToAdd] = useState(1);
  const [reason, setReason] = useState('Testing');
  const [isLoading, setIsLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<{
    id: string;
    email: string;
    credits: number;
    subscription_status: string;
  } | null>(null);

  const getUserInfo = async () => {
    if (!userId.trim()) {
      toast({
        title: "Error",
        description: "Please enter a user ID",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const token = await getToken();
      
      const { data, error } = await supabase.functions.invoke('admin-credits', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: {
          user_id: userId.trim()
        }
      });

      if (error) {
        console.error('Error fetching user info:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to fetch user info",
          variant: "destructive",
        });
        return;
      }

      if (data?.success) {
        setUserInfo(data.data.user_info);
        toast({
          title: "Success",
          description: `Found user: ${data.data.user_info.name} (${data.data.user_info.email})`,
        });
      } else {
        toast({
          title: "Error",
          description: data?.error || "Failed to fetch user info",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
      toast({
        title: "Error",
        description: "Failed to fetch user info",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addCredits = async () => {
    if (!userId.trim() || !reason.trim()) {
      toast({
        title: "Error",
        description: "Please enter user ID and reason",
        variant: "destructive",
      });
      return;
    }

    if (creditsToAdd <= 0) {
      toast({
        title: "Error",
        description: "Credits to add must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const token = await getToken();
      
      const { data, error } = await supabase.functions.invoke('admin-credits', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id: userId.trim(),
          credits_to_add: creditsToAdd,
          reason: reason.trim(),
          admin_note: 'Test credit addition'
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
          description: `Added ${creditsToAdd} credits. New balance: ${data.data.new_balance}`,
        });
        
        // Refresh user info
        await getUserInfo();
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
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Admin Credits Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="userId">User ID</Label>
            <Input
              id="userId"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Enter user ID to test"
            />
          </div>
          
          <div>
            <Label htmlFor="credits">Credits to Add</Label>
            <Input
              id="credits"
              type="number"
              min="1"
              value={creditsToAdd}
              onChange={(e) => setCreditsToAdd(parseInt(e.target.value) || 1)}
            />
          </div>
          
          <div>
            <Label htmlFor="reason">Reason</Label>
            <Input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason for adding credits"
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={getUserInfo}
              disabled={isLoading}
              variant="outline"
            >
              Get User Info
            </Button>
            <Button
              onClick={addCredits}
              disabled={isLoading}
            >
              Add Credits
            </Button>
          </div>
        </CardContent>
      </Card>

      {userInfo && (
        <Card>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div><strong>Name:</strong> {userInfo.name}</div>
              <div><strong>Email:</strong> {userInfo.email}</div>
              <div><strong>Current Balance:</strong> {userInfo.current_balance} credits</div>
              <div><strong>Total Earned:</strong> {userInfo.total_earned} credits</div>
              <div><strong>Total Spent:</strong> {userInfo.total_spent} credits</div>
              <div><strong>Subscription:</strong> {userInfo.subscription_type || 'None'}</div>
              <div><strong>Member Since:</strong> {new Date(userInfo.created_at).toLocaleDateString()}</div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminCreditsTest; 