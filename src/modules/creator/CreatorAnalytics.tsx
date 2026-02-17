import { useState, useEffect } from 'react';
import { useClerkAuth } from '@/modules/auth/contexts';
import { supabase } from '@/core/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/modules/shared/components/ui/card';
import { Eye, Share2, DollarSign, TrendingUp, BookOpen } from 'lucide-react';

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
  const [totals, setTotals] = useState({ views: 0, shares: 0, earnings: 0 });

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

      const books = data ?? [];
      setEbooks(books);

      const totalViews = books.reduce((s, b) => s + (b.view_count ?? 0), 0);
      const totalShares = books.reduce((s, b) => s + (b.share_count ?? 0), 0);
      // Estimated earnings: $0.01 per referral share (placeholder)
      setTotals({ views: totalViews, shares: totalShares, earnings: totalShares * 0.01 });

      // Build daily views for last 14 days from ebook creation dates
      const days: DailyViews[] = [];
      for (let i = 13; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        // Approximate: distribute views evenly across days since creation
        const dayViews = books.filter(b => {
          const created = b.created_at.split('T')[0];
          return created === dateStr;
        }).reduce((s, b) => s + (b.view_count ?? 0), 0);
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
      <h2 className="text-2xl font-bold">Creator Analytics</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Views', value: totals.views.toLocaleString(), icon: Eye, color: 'text-blue-500' },
          { label: 'Total Shares', value: totals.shares.toLocaleString(), icon: Share2, color: 'text-green-500' },
          { label: 'Est. Earnings', value: `$${totals.earnings.toFixed(2)}`, icon: DollarSign, color: 'text-amber-500' },
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
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {ebook.view_count ?? 0}</span>
                    <span className="flex items-center gap-1"><Share2 className="w-3 h-3" /> {ebook.share_count ?? 0}</span>
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
