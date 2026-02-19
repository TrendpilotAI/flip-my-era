import { useEffect, useState } from "react";
// UserProfile was from Clerk — removed during Supabase Auth migration
import { supabase } from '@/core/integrations/supabase/client';
import { useToast } from '@/modules/shared/hooks/use-toast';
import { Button } from '@/modules/shared/components/ui/button';
import { Input } from '@/modules/shared/components/ui/input';
import { Textarea } from '@/modules/shared/components/ui/textarea';
import { Loader2, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from '@/modules/shared/components/ui/avatar';
import { useClerkAuth } from '@/modules/auth/contexts';

type Profile = {
  id: string;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  stories_count: number;
  total_likes: number;
};

const Profile = () => {
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading } = useClerkAuth();

  useEffect(() => {
    if (!isLoading) {
      fetchProfile();
    }
  }, [isLoading, isAuthenticated, user]);

  const fetchProfile = async () => {
    try {
      if (!isAuthenticated || !user) {
        navigate('/auth');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfile(data as Profile);
    } catch (error: unknown) {
      toast({
        title: "Error fetching profile",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setUpdating(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: profile.username,
          bio: profile.bio,
        })
        .eq('id', profile.id);

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error: unknown) {
      toast({
        title: "Error updating profile",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Profile not found</h2>
          <Button onClick={() => navigate('/auth')}>Sign in</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
      <div className="max-w-3xl mx-auto bg-white/95 backdrop-blur-lg rounded-xl shadow-xl p-8">
        <div className="text-center mb-8">
          <Avatar className="h-24 w-24 mx-auto mb-4">
            <AvatarImage src={profile.avatar_url ?? undefined} />
            <AvatarFallback className="bg-purple-500 text-white text-xl">
              <User className="h-12 w-12" />
            </AvatarFallback>
          </Avatar>
          <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto mb-6">
            <div className="bg-purple-100 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-600">{profile.stories_count}</div>
              <div className="text-sm text-purple-800">Stories</div>
            </div>
            <div className="bg-pink-100 rounded-lg p-4">
              <div className="text-2xl font-bold text-pink-600">{profile.total_likes}</div>
              <div className="text-sm text-pink-800">Likes</div>
            </div>
          </div>
        </div>

        {/* Embedded Clerk User Profile (uses current session; no re-auth) */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Account</h3>
          <div className="border rounded-xl p-2">
            <UserProfile routing="hash"/>
          </div>
          <div className="mt-4">
            <Button
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500"
              onClick={async () => {
                try {
                  const { data, error } = await supabase.functions.invoke('stripe-portal', { method: 'POST' });
                  if (error) throw error as unknown;
                  if (data && typeof (data as { url?: unknown }).url === 'string') {
                    window.location.href = (data as { url: string }).url;
                  }
                } catch (err) {
                  toast({
                    title: 'Unable to open billing portal',
                    description: 'Please try again in a moment.',
                    variant: 'destructive',
                  });
                }
              }}
            >
              Manage Billing
            </Button>
          </div>
        </div>

        <form onSubmit={updateProfile} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Username
            </label>
            <Input
              id="username"
              type="text"
              value={profile.username ?? ''}
              onChange={(e) => setProfile({ ...profile, username: e.target.value })}
              className="mt-1"
            />
          </div>

          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
              Bio
            </label>
            <Textarea
              id="bio"
              value={profile.bio ?? ''}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              className="mt-1"
              rows={4}
            />
          </div>

          <Button
            type="submit"
            disabled={updating}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500"
          >
            {updating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              'Update Profile'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
