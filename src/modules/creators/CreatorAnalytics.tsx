import { useState, useEffect } from 'react';
import { useClerkAuth } from '@/modules/auth/contexts';
import { supabase } from '@/core/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/modules/shared/components/ui/card';
import { Eye, Share2, DollarSign, TrendingUp, BookOpen } from 'lucide-react';
import { CreatorBadges } from './CreatorBadges';
import { type CreatorStats } from './types';

interface EbookStats {
  id: string;
  title: string;
  view_count: number;
  share_count: number;
  created_at: string;
}

interface DailyViews {
  date: string;
  views: number;
}

export const CreatorAnalytics = () => {
  const { user } = useClerkAuth();
  const [ebooks, setEbooks] = useState<EbookStats[]>([]);
  const [dailyViews, setDailyViews] = useState<DailyViews[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<CreatorStats>({
    totalEbooks: 0, totalViews: 0, totalShares: 0, totalEarnings: 0, accountAgeDays: 0,
  });

  useEffect(() => {
    if (user?.id) loadAnalytics();
  }, [user?.id]);

  const loadAnalytics = async () => {
    try {
      const { data } = await supabase
        .from('ebooks')
        .select('id, title, view_count, share_count, created_at')
        .eq('user_id', user!.id)
        .order('view_count', { ascending: false });

      const books = (data ?? []).map(b => ({
        ...b,
        view_count: b.view_count ?? 0,
        share_count: b.share_count ?? 0,
      }));
      setEbooks(books);

      const totalViews = books.reduce((s, b) => s + b.view_count, 0);
      const totalShares = books.reduce((s, b) => s + b.share_count, 0);

      // Load tip earnings
      let totalEarnings = totalShares * 0.01; // base referral estimate
      try {
        const { data: tips } = await supabase
          .from('tips')
          .select('amount')
          .eq('to_creator_id', user!.id);
        if (tips) {
          totalEarnings += tips.reduce((s, t) => s + (t.amount ?? 0), 0);
        }
      } catch { /* tips table may not exist */ }

      // Account age
      let accountAgeDays = 0;
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('created_at')
          .eq('id', user!.id)
          .single();
        if (profile) {
          accountAgeDays = Math.floor((Date.now() - new Date(profile.created_at).getTime()) / 86400000);
        }
      } catch { /* ignore */ }

      setStats({
        totalEbooks: books.length,
        totalViews,
        totalShares,
        totalEarnings,
        accountAgeDays,
      });

      // Daily views for last 14 days
      const days: DailyViews[] = [];
      for (let i = 13; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayViews = books
          .filter(b => b.created_at.split('T')[0] === dateStr)
          .reduce((s, b) => s + b.view_count, 0);
        days.push({ date: dateStr, views: dayViews });
      }
      setDailyViews(days);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const maxViews = Math.max(...dailyViews.map(d => d.views), 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h2 className="text-2xl font-bold">Creator Analytics</h2>
        <CreatorBadges stats={stats} showAll />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Views', value: stats.totalViews.toLocaleString(), icon: Eye, color: 'text-blue-500' },
          { label: 'Total Shares', value: stats.totalShares.toLocaleString(), icon: Share2, color: 'text-green-500' },
          { label: 'Earnings', value: `$${stats.totalEarnings.toFixed(2)}`, icon: DollarSign, color: 'text-amber-500' },
          { label: 'Ebooks', value: stats.totalEbooks.toString(), icon: BookOpen, color: 'text-purple-500' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-4 p-5">
              <Icon className={`w-8 h-8 ${color}`} />
              <div>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-sm text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Views Over Time Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" /> Views Over Time (Last 14 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-1 h-40">
            {dailyViews.map((d) => (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs text-muted-foreground">{d.views > 0 ? d.views : ''}</span>
                <div
                  className="w-full bg-primary/80 rounded-t transition-all"
                  style={{ height: `${Math.max((d.views / maxViews) * 100, 2)}%` }}
                />
                <span className="text-[10px] text-muted-foreground rotate-[-45deg] origin-top-left whitespace-nowrap">
                  {new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Performing Ebooks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" /> Top Performing Ebooks
          </CardTitle>
        </CardHeader>
        <CardContent>
          {ebooks.length === 0 ? (
            <p className="text-muted-foreground">No ebooks yet. Create your first one!</p>
          ) : (
            <div className="space-y-3">
              {ebooks.slice(0, 10).map((ebook, i) => (
                <div key={ebook.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-muted-foreground w-6">#{i + 1}</span>
                    <span className="font-medium line-clamp-1">{ebook.title}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {ebook.view_count}</span>
                    <span className="flex items-center gap-1"><Share2 className="w-3 h-3" /> {ebook.share_count}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CreatorAnalytics;
