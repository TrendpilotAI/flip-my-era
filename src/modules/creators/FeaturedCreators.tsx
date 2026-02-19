import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/core/integrations/supabase/client';
import { Card, CardContent } from '@/modules/shared/components/ui/card';
import { BookOpen, ChevronRight, Eye } from 'lucide-react';
import { CreatorBadges } from './CreatorBadges';
import { type CreatorStats } from './types';

interface FeaturedCreator {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  ebookCount: number;
  totalViews: number;
  featuredCover: string | null;
  stats: CreatorStats;
}

export const FeaturedCreators = () => {
  const [creators, setCreators] = useState<FeaturedCreator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeaturedCreators();
  }, []);

  const loadFeaturedCreators = async () => {
    try {
      const { data: ebooks } = await supabase
        .from('ebooks')
        .select('user_id, cover_image_url, view_count, share_count');

      if (!ebooks?.length) { setLoading(false); return; }

      const userAgg: Record<string, { count: number; cover: string | null; views: number; shares: number }> = {};
      for (const e of ebooks) {
        if (!userAgg[e.user_id]) userAgg[e.user_id] = { count: 0, cover: null, views: 0, shares: 0 };
        userAgg[e.user_id].count++;
        userAgg[e.user_id].views += e.view_count ?? 0;
        userAgg[e.user_id].shares += e.share_count ?? 0;
        if (e.cover_image_url && !userAgg[e.user_id].cover) {
          userAgg[e.user_id].cover = e.cover_image_url;
        }
      }

      const topIds = Object.entries(userAgg)
        .sort((a, b) => b[1].views - a[1].views)
        .slice(0, 8)
        .map(([id]) => id);

      if (!topIds.length) { setLoading(false); return; }

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url, created_at')
        .in('id', topIds);

      const result: FeaturedCreator[] = (profiles ?? []).map(p => {
        const agg = userAgg[p.id] ?? { count: 0, views: 0, shares: 0, cover: null };
        const accountAgeDays = Math.floor((Date.now() - new Date(p.created_at).getTime()) / 86400000);
        return {
          id: p.id,
          fullName: p.full_name ?? p.username ?? 'Creator',
          avatarUrl: p.avatar_url,
          ebookCount: agg.count,
          totalViews: agg.views,
          featuredCover: agg.cover,
          stats: {
            totalEbooks: agg.count,
            totalViews: agg.views,
            totalShares: agg.shares,
            totalEarnings: 0,
            accountAgeDays,
          },
        };
      }).sort((a, b) => b.totalViews - a.totalViews);

      setCreators(result);
    } catch (err) {
      console.error('Failed to load featured creators:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || creators.length === 0) return null;

  return (
    <section className="py-8">
      <div className="container">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          ✨ Featured Creators
        </h2>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-primary/20">
          {creators.map((creator) => (
            <Link key={creator.id} to={`/creator/${creator.id}`} className="flex-shrink-0 w-48">
              <Card className="hover:shadow-lg transition-shadow h-full">
                <div className="h-28 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 rounded-t-lg overflow-hidden">
                  {creator.featuredCover ? (
                    <img src={creator.featuredCover} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="w-8 h-8 text-muted-foreground/50" />
                    </div>
                  )}
                </div>
                <CardContent className="p-3 text-center">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 mx-auto -mt-9 border-2 border-background overflow-hidden">
                    {creator.avatarUrl ? (
                      <img src={creator.avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="w-full h-full flex items-center justify-center text-white font-bold">
                        {creator.fullName[0].toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-center gap-1 mt-2">
                    <p className="font-medium text-sm line-clamp-1">{creator.fullName}</p>
                    <CreatorBadges stats={creator.stats} />
                  </div>
                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-1">
                    <span>{creator.ebookCount} ebooks</span>
                    <span>·</span>
                    <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" />{creator.totalViews}</span>
                  </div>
                  <span className="text-xs text-primary flex items-center justify-center gap-1 mt-2">
                    View Profile <ChevronRight className="w-3 h-3" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedCreators;
