import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/core/integrations/supabase/client';
import { Card, CardContent } from '@/modules/shared/components/ui/card';
import { Button } from '@/modules/shared/components/ui/button';
import { ShareButtons } from './ShareButtons';
import { Music, BookOpen } from 'lucide-react';

interface EbookPreview {
  id: string;
  title: string;
  era: string;
  cover_image_url?: string;
  creator_name?: string;
  description?: string;
}

export const ShareablePreview = () => {
  const { id } = useParams<{ id: string }>();
  const [ebook, setEbook] = useState<EbookPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEbook = async () => {
      if (!id) {
        setError('No ebook ID provided');
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('ebooks')
          .select('id, title, era, cover_image_url, creator_name, description')
          .eq('id', id)
          .single();

        if (fetchError) throw fetchError;
        setEbook(data);
      } catch {
        setError('Ebook not found');
      } finally {
        setLoading(false);
      }
    };

    fetchEbook();
  }, [id]);

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/ebook/${id}/preview`
    : '';

  if (loading) {
    return (
      <div className="container py-16 flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (error || !ebook) {
    return (
      <div className="container py-16 text-center">
        <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Ebook Not Found</h1>
        <p className="text-muted-foreground mb-4">{error || 'This ebook may have been removed.'}</p>
        <Button onClick={() => window.location.href = '/'}>Go Home</Button>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{ebook.title} — FlipMyEra</title>
        <meta property="og:title" content={`${ebook.title} — FlipMyEra`} />
        <meta property="og:description" content={`A ${ebook.era} era ebook${ebook.creator_name ? ` by ${ebook.creator_name}` : ''} on FlipMyEra 🎵`} />
        {ebook.cover_image_url && <meta property="og:image" content={ebook.cover_image_url} />}
        <meta property="og:url" content={shareUrl} />
        <meta property="og:type" content="article" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${ebook.title} — FlipMyEra`} />
        <meta name="twitter:description" content={`A ${ebook.era} era ebook on FlipMyEra 🎵`} />
        {ebook.cover_image_url && <meta name="twitter:image" content={ebook.cover_image_url} />}
      </Helmet>

      <div className="container max-w-2xl py-12">
        <Card className="overflow-hidden">
          {ebook.cover_image_url && (
            <div className="aspect-[3/4] max-h-96 overflow-hidden">
              <img
                src={ebook.cover_image_url}
                alt={ebook.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Music className="h-4 w-4" />
              <span>{ebook.era} Era</span>
            </div>
            <h1 className="text-3xl font-bold">{ebook.title}</h1>
            {ebook.creator_name && (
              <p className="text-muted-foreground">By {ebook.creator_name}</p>
            )}
            {ebook.description && (
              <p className="text-muted-foreground">{ebook.description}</p>
            )}
            <div className="pt-4 border-t space-y-4">
              <Button className="w-full" onClick={() => window.location.href = '/auth'}>
                Sign up to create your own ebook! 🎵
              </Button>
              <ShareButtons url={shareUrl} title={ebook.title} era={ebook.era} />
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default ShareablePreview;
