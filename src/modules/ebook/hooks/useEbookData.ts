import { useState, useEffect } from 'react';
import { useClerkAuth } from '@/modules/auth/contexts/ClerkAuthContext';
import { createSupabaseClientWithClerkToken } from '@/core/integrations/supabase/client';

export interface EbookData {
  id: string;
  title: string;
  subtitle?: string;
  author_name?: string;
  description?: string;
  cover_image_url?: string;
  chapters: Array<{
    id: string;
    title: string;
    content: string;
    imageUrl?: string;
  }>;
  images?: Array<{
    imageUrl?: string;
    url?: string; // Fallback for legacy or manual images
    prompt?: string;
    chapterNumber?: number;
    chapterTitle?: string;
    revisedPrompt?: string;
    generatedAt?: string;
    chapter_id?: string; // For manual images
    type: 'cover' | 'chapter_illustration' | 'chapter';
  }>;
  created_at: string;
  updated_at: string;
  status: string;
  word_count?: number;
  chapter_count?: number;
}

export interface UseEbookDataResult {
  ebookData: EbookData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useEbookData(ebookId: string | null): UseEbookDataResult {
  const { getToken, isAuthenticated } = useClerkAuth();
  const [ebookData, setEbookData] = useState<EbookData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEbookData = async () => {
    if (!ebookId || !isAuthenticated) {
      setEbookData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = await getToken({ template: 'supabase' });
      if (!token) {
        throw new Error('No authentication token available');
      }

      const supabase = createSupabaseClientWithClerkToken(token);
      
      const { data, error: fetchError } = await supabase
        .from('ebook_generations')
        .select(`
          id,
          title,
          subtitle,
          author_name,
          description,
          cover_image_url,
          chapters,
          images,
          created_at,
          updated_at,
          status,
          word_count,
          chapter_count
        `)
        .eq('id', ebookId)
        .single();

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      if (!data) {
        throw new Error('Ebook not found');
      }

      // Transform the data to match our interface
      const transformedData: EbookData = {
        id: data.id as string,
        title: data.title as string,
        subtitle: data.subtitle as string | undefined,
        author_name: data.author_name as string | undefined,
        description: data.description as string | undefined,
        cover_image_url: data.cover_image_url as string | undefined,
        chapters: Array.isArray(data.chapters)
          ? data.chapters.map((chapter: any, index: number) => ({
              id: chapter.id || `chapter-${index}`,
              title: chapter.title || `Chapter ${index + 1}`,
              content: chapter.content || '',
              imageUrl: chapter.imageUrl
            }))
          : [],
        images: Array.isArray(data.images) ? data.images : [],
        created_at: data.created_at as string,
        updated_at: data.updated_at as string,
        status: data.status as string,
        word_count: data.word_count as number | undefined,
        chapter_count: data.chapter_count as number | undefined
      };

      setEbookData(transformedData);
    } catch (err) {
      console.error('Error fetching ebook data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch ebook data');
      setEbookData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEbookData();
  }, [ebookId, isAuthenticated]);

  return {
    ebookData,
    loading,
    error,
    refetch: fetchEbookData
  };
} 