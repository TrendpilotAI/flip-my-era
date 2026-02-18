import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { resetPassword, updatePassword } from '@/core/integrations/supabase/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shared/components/ui/card';
import { Button } from '@/modules/shared/components/ui/button';
import { Input } from '@/modules/shared/components/ui/input';
import { Label } from '@/modules/shared/components/ui/label';
import { useToast } from '@/modules/shared/hooks/use-toast';
import { Lock, Loader2 } from "lucide-react";

const ResetPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // If we have a type=recovery in the URL, show the new password form
  const isRecovery = searchParams.get('type') === 'recovery';

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { error } = await resetPassword(email);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Check your email", description: "We sent you a password reset link." });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { error } = await updatePassword(newPassword);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Password updated", description: "You can now sign in with your new password." });
        navigate('/auth');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-md mx-auto py-16">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Lock className="h-6 w-6" />
            {isRecovery ? "Set New Password" : "Reset Password"}
          </CardTitle>
          <CardDescription>
            {isRecovery ? "Enter your new password below." : "Enter your email and we'll send you a reset link."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isRecovery ? (
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input id="new-password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6} />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...</> : "Update Password"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleRequestReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email</Label>
                <Input id="reset-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</> : "Send Reset Link"}
              </Button>
              <div className="text-center">
                <Button variant="link" onClick={() => navigate('/auth')}>Back to sign in</Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
