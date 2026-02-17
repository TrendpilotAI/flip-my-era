import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/core/integrations/supabase/client';
import { useClerkAuth } from '@/modules/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/modules/shared/components/ui/card';
import { Button } from '@/modules/shared/components/ui/button';
import { Copy, Check, Users, Gift, TrendingUp } from 'lucide-react';
import { useToast } from '@/modules/shared/components/ui/use-toast';

interface ReferralStats {
  totalReferrals: number;
  earnedCredits: number;
  pendingReferrals: number;
}

/**
 * Generate a deterministic referral code from user ID.
 * Format: FME-XXXXXX (6 chars from user ID hash)
 */
export const generateReferralCode = (userId: string): string => {
  // Use first 8 chars of the userId to create a short code
  const hash = userId.replace(/-/g, '').substring(0, 6).toUpperCase();
  return `FME-${hash}`;
};

export const useReferral = () => {
  const { user } = useClerkAuth();
  const [stats, setStats] = useState<ReferralStats>({ totalReferrals: 0, earnedCredits: 0, pendingReferrals: 0 });
  const [loading, setLoading] = useState(true);

  const referralCode = user ? generateReferralCode(user.id) : null;
  const referralLink = referralCode
    ? `${window.location.origin}/?ref=${referralCode}`
    : null;

  const fetchStats = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('referrals')
        .select('status, credited')
        .eq('referrer_id', user.id);

      if (error) throw error;

      const total = data?.length ?? 0;
      const credited = data?.filter(r => r.credited).length ?? 0;
      const pending = data?.filter(r => r.status === 'pending').length ?? 0;

      setStats({ totalReferrals: total, earnedCredits: credited, pendingReferrals: pending });
    } catch {
      // Table might not exist yet — that's ok
      setStats({ totalReferrals: 0, earnedCredits: 0, pendingReferrals: 0 });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { referralCode, referralLink, stats, loading, refreshStats: fetchStats };
};

/**
 * Process a referral code during signup.
 * Call this after a new user is created.
 */
export const processReferral = async (referralCode: string, newUserId: string): Promise<boolean> => {
  try {
    // Look up referrer by checking all users — the code is derived from user ID
    // Extract the hash from the code
    const hash = referralCode.replace('FME-', '');

    // Find the referrer whose ID starts with these chars
    const { data: referrer } = await supabase
      .from('profiles')
      .select('id')
      .ilike('id', `${hash.toLowerCase()}%`)
      .limit(1)
      .single();

    if (!referrer || referrer.id === newUserId) return false;

    // Create referral record
    const { error } = await supabase.from('referrals').insert({
      referrer_id: referrer.id,
      referred_id: newUserId,
      referral_code: referralCode,
      status: 'completed',
      credited: true,
    });

    if (error) throw error;

    // Credit both users (1 bonus credit each)
    // This would ideally be a Supabase Edge Function for atomicity
    await supabase.rpc('add_credits', { user_id: referrer.id, amount: 1 });
    await supabase.rpc('add_credits', { user_id: newUserId, amount: 1 });

    return true;
  } catch {
    console.error('Failed to process referral');
    return false;
  }
};

export const ReferralDashboard = () => {
  const { referralCode, referralLink, stats, loading } = useReferral();
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast({ title: 'Referral link copied!' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: 'Failed to copy', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 flex justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Refer Friends & Earn Credits
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Referral Link */}
        <div className="flex items-center gap-2">
          <code className="flex-1 bg-muted px-3 py-2 rounded text-sm truncate">
            {referralLink}
          </code>
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Share your link — you both get 1 bonus credit when they sign up!
        </p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          <div className="text-center p-3 bg-muted rounded-lg">
            <TrendingUp className="h-5 w-5 mx-auto mb-1 text-primary" />
            <div className="text-2xl font-bold">{stats.totalReferrals}</div>
            <div className="text-xs text-muted-foreground">Referrals</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <Gift className="h-5 w-5 mx-auto mb-1 text-green-500" />
            <div className="text-2xl font-bold">{stats.earnedCredits}</div>
            <div className="text-xs text-muted-foreground">Credits Earned</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <Users className="h-5 w-5 mx-auto mb-1 text-yellow-500" />
            <div className="text-2xl font-bold">{stats.pendingReferrals}</div>
            <div className="text-xs text-muted-foreground">Pending</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReferralDashboard;
