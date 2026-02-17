import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/core/integrations/supabase/client';
import { Card, CardContent } from '@/modules/shared/components/ui/card';
import { BookOpen, ChevronRight } from 'lucide-react';
import { VerificationBadge } from './VerificationBadge';

interface FeaturedCreator {
  id: string;
  full_name: string;
  avatar_url: string | null;
  ebook_count: number;
  featured_cover: string | null;
}

export const FeaturedCreators = () => {
  const [creators, setCreators] = useState<FeaturedCreator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeaturedCreators();
  }, []);

  const loadFeaturedCreators = async () => {
    try {
      // Get users with most ebooks
      const { data: ebooks } = await supabase
        .from('ebooks')
        .select('user_id, cover_image_url');

      if (!ebooks?.length) { setLoading(false); return; }

      // Count ebooks per user
      const userCounts: Record<string, { count: number; cover: string | null }> = {};
      for (const e of ebooks) {
        if (!userCounts[e.user_id]) userCounts[e.user_id] = { count: 0, cover: null };
        userCounts[e.user_id].count++;
        if (e.cover_image_url && !userCounts[e.user_id].cover) {
          userCounts[e.user_id].cover = e.cover_image_url;
        }
      }

      // Top creators by ebook count
      const topIds = Object.entries(userCounts)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 8)
        .map(([id]) => id);

      if (!topIds.length) { setLoading(false); return; }

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url')
        .in('id', topIds);

      const result: FeaturedCreator[] = (profiles ?? []).map(p => ({
        id: p.id,
        full_name: p.full_name ?? p.username ?? 'Creator',
        avatar_url: p.avatar_url,
        ebook_count: userCounts[p.id]?.count ?? 0,
        featured_cover: userCounts[p.id]?.cover ?? null,
      })).sort((a, b) => b.ebook_count - a.ebook_count);

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
                {/* Featured ebook cover */}
                <div className="h-28 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 rounded-t-lg overflow-hidden">
                  {creator.featured_cover ? (
                    <img src={creator.featured_cover} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="w-8 h-8 text-muted-foreground/50" />
                    </div>
                  )}
                </div>
                <CardContent className="p-3 text-center">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 mx-auto -mt-9 border-2 border-background overflow-hidden">
                    {creator.avatar_url ? (
                      <img src={creator.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="w-full h-full flex items-center justify-center text-white font-bold">
                        {creator.full_name[0].toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-center gap-1 mt-2">
                    <p className="font-medium text-sm line-clamp-1">{creator.full_name}</p>
                    <VerificationBadge userId={creator.id} size="sm" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{creator.ebook_count} ebooks</p>
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
