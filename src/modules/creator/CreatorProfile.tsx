import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/core/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/modules/shared/components/ui/card';
import { Badge } from '@/modules/shared/components/ui/badge';
import { BookOpen, Eye, Share2, Calendar, ExternalLink } from 'lucide-react';
import { VerificationBadge } from './VerificationBadge';

interface CreatorData {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  social_links?: Record<string, string>;
}

interface EbookItem {
  id: string;
  title: string;
  cover_image_url: string | null;
  created_at: string;
  view_count?: number;
  share_count?: number;
}

export const CreatorProfile = () => {
  const { id } = useParams<{ id: string }>();
  const [creator, setCreator] = useState<CreatorData | null>(null);
  const [ebooks, setEbooks] = useState<EbookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalEbooks: 0, totalViews: 0, totalShares: 0 });

  useEffect(() => {
    if (id) loadCreator(id);
  }, [id]);

  const loadCreator = async (userId: string) => {
    try {
      setLoading(true);

      // Load profile
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

      // Load published ebooks
      const { data: ebookData } = await supabase
        .from('ebooks')
        .select('id, title, cover_image_url, created_at, view_count, share_count')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      const books = ebookData ?? [];
      setEbooks(books);
      setStats({
        totalEbooks: books.length,
        totalViews: books.reduce((sum, b) => sum + (b.view_count ?? 0), 0),
        totalShares: books.reduce((sum, b) => sum + (b.share_count ?? 0), 0),
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
            <img src={creator.avatar_url} alt={creator.full_name ?? ''} className="w-full h-full object-cover" />
          ) : (
            <span className="text-3xl font-bold text-white">
              {(creator.full_name ?? '?')[0].toUpperCase()}
            </span>
          )}
        </div>
        <div className="text-center sm:text-left flex-1">
          <div className="flex items-center gap-2 justify-center sm:justify-start">
            <h1 className="text-3xl font-bold">{creator.full_name}</h1>
            <VerificationBadge userId={creator.id} size="lg" />
          </div>
          {creator.bio && (
            <p className="text-muted-foreground mt-2 max-w-lg">{creator.bio}</p>
          )}
          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground justify-center sm:justify-start">
            <Calendar className="w-4 h-4" />
            <span>Joined {new Date(creator.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
          </div>
          {/* Social links */}
          {creator.social_links && Object.keys(creator.social_links).length > 0 && (
            <div className="flex gap-3 mt-3 justify-center sm:justify-start">
              {Object.entries(creator.social_links).map(([platform, url]) => (
                <a key={platform} href={url as string} target="_blank" rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline flex items-center gap-1">
                  <ExternalLink className="w-3 h-3" /> {platform}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Ebooks', value: stats.totalEbooks, icon: BookOpen },
          { label: 'Views', value: stats.totalViews, icon: Eye },
          { label: 'Shares', value: stats.totalShares, icon: Share2 },
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
                      <span>{ebook.view_count ?? 0} views</span>
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
