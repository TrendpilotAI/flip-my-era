import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/core/integrations/supabase/client';
import { Card, CardContent } from '@/modules/shared/components/ui/card';
import { BookOpen, Eye, Share2, Calendar, ExternalLink, DollarSign } from 'lucide-react';
import { TipJar } from './TipJar';
import { CreatorBadges } from './CreatorBadges';
import { type CreatorStats, getEarnedBadges, BADGE_CONFIG } from './types';

interface CreatorData {
  id: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  social_links: Record<string, string>;
}

interface EbookItem {
  id: string;
  title: string;
  cover_image_url: string | null;
  created_at: string;
  view_count: number;
  share_count: number;
}

export const CreatorProfile = () => {
  const { id } = useParams<{ id: string }>();
  const [creator, setCreator] = useState<CreatorData | null>(null);
  const [ebooks, setEbooks] = useState<EbookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<CreatorStats>({
    totalEbooks: 0, totalViews: 0, totalShares: 0, totalEarnings: 0, accountAgeDays: 0,
  });

  useEffect(() => {
    if (id) loadCreator(id);
  }, [id]);

  const loadCreator = async (userId: string) => {
    try {
      setLoading(true);

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profile) {
        setCreator({
          id: profile.id,
          full_name: profile.full_name ?? profile.username ?? 'Anonymous Creator',
          avatar_url: profile.avatar_url,
          bio: profile.bio ?? null,
          created_at: profile.created_at,
          social_links: profile.social_links ?? {},
        });
      }

      const { data: ebookData } = await supabase
        .from('ebooks')
        .select('id, title, cover_image_url, created_at, view_count, share_count')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      const books: EbookItem[] = (ebookData ?? []).map(b => ({
        ...b,
        view_count: b.view_count ?? 0,
        share_count: b.share_count ?? 0,
      }));
      setEbooks(books);

      const accountAgeDays = profile
        ? Math.floor((Date.now() - new Date(profile.created_at).getTime()) / (86400000))
        : 0;

      setStats({
        totalEbooks: books.length,
        totalViews: books.reduce((s, b) => s + b.view_count, 0),
        totalShares: books.reduce((s, b) => s + b.share_count, 0),
        totalEarnings: 0, // Would come from tips/payments table
        accountAgeDays,
      });
    } catch (err) {
      console.error('Failed to load creator:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-12 flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="container py-12 text-center">
        <h2 className="text-2xl font-bold mb-2">Creator not found</h2>
        <p className="text-muted-foreground">This profile doesn't exist or has been removed.</p>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl py-8 space-y-8">
      {/* Profile Header */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center overflow-hidden flex-shrink-0">
          {creator.avatar_url ? (
            <img src={creator.avatar_url} alt={creator.full_name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-3xl font-bold text-white">
              {creator.full_name[0].toUpperCase()}
            </span>
          )}
        </div>
        <div className="text-center sm:text-left flex-1">
          <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap">
            <h1 className="text-3xl font-bold">{creator.full_name}</h1>
            <CreatorBadges stats={stats} />
          </div>
          {creator.bio && <p className="text-muted-foreground mt-2 max-w-lg">{creator.bio}</p>}
          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground justify-center sm:justify-start">
            <Calendar className="w-4 h-4" />
            <span>Joined {new Date(creator.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
          </div>
          {Object.keys(creator.social_links).length > 0 && (
            <div className="flex gap-3 mt-3 justify-center sm:justify-start">
              {Object.entries(creator.social_links).map(([platform, url]) => (
                <a key={platform} href={url} target="_blank" rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline flex items-center gap-1">
                  <ExternalLink className="w-3 h-3" /> {platform}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Ebooks', value: stats.totalEbooks, icon: BookOpen },
          { label: 'Views', value: stats.totalViews, icon: Eye },
          { label: 'Shares', value: stats.totalShares, icon: Share2 },
          { label: 'Earnings', value: `$${stats.totalEarnings.toFixed(2)}`, icon: DollarSign },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-3 p-4">
              <Icon className="w-5 h-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* TipJar */}
      <TipJar creatorId={creator.id} creatorName={creator.full_name} />

      {/* Portfolio Grid */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Published Ebooks</h2>
        {ebooks.length === 0 ? (
          <p className="text-muted-foreground">No ebooks published yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {ebooks.map((ebook) => (
              <Link key={ebook.id} to={`/ebook/${ebook.id}/preview`}>
                <Card className="hover:shadow-lg transition-shadow overflow-hidden">
                  <div className="aspect-[3/4] bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900">
                    {ebook.cover_image_url ? (
                      <img src={ebook.cover_image_url} alt={ebook.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-3">
                    <p className="font-medium text-sm line-clamp-2">{ebook.title}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span>{ebook.view_count} views</span>
                      <span>·</span>
                      <span>{ebook.share_count} shares</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CreatorProfile;
