import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/modules/shared/components/ui/card';
import { Button } from '@/modules/shared/components/ui/button';
import { Alert, AlertDescription } from '@/modules/shared/components/ui/alert';
import { useToast } from '@/modules/shared/hooks/use-toast';
import { useClerkAuth } from '@/modules/auth/contexts/ClerkAuthContext';
import { EbookPublishPreview } from '@/modules/ebook/components/EbookPublishPreview';
import { createSupabaseClientWithClerkToken } from '@/core/integrations/supabase/client';
import { 
  ArrowLeft,
  BookOpen,
  Download,
  Share2,
  ExternalLink
} from 'lucide-react';

interface EbookPublishDemoProps {
  ebookId?: string; // Allow passing ebook ID as prop
}

export const EbookPublishDemo: React.FC<EbookPublishDemoProps> = ({ ebookId: propEbookId }) => {
  const { ebookId: paramEbookId } = useParams<{ ebookId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, getToken } = useClerkAuth();
  
  // Use prop ebook ID or URL param
  const ebookId = propEbookId || paramEbookId;
  const [availableEbooks, setAvailableEbooks] = useState<Array<{ id: string; title: string }>>([]);
  const [selectedEbookId, setSelectedEbookId] = useState<string>(ebookId || '');

  // Fetch available ebooks for demo purposes
  useEffect(() => {
    const fetchAvailableEbooks = async () => {
      if (!isAuthenticated) return;

      try {
        const token = await getToken({ template: 'supabase' });
        if (!token) return;

        const supabase = createSupabaseClientWithClerkToken(token);
        
        // Fetch from ebook_generations table
        const { data, error } = await supabase
          .from('ebook_generations')
          .select('id, title')
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) {
          console.error('Error fetching ebooks:', error);
        } else {
          setAvailableEbooks(data || []);
          // If no ebook ID is provided, use the first available one
          if (!selectedEbookId && data && data.length > 0) {
            setSelectedEbookId(data[0].id);
          }
        }
      } catch (error) {
        console.error('Error fetching ebooks:', error);
      }
    };

    fetchAvailableEbooks();
  }, [isAuthenticated, getToken, selectedEbookId]);

  const handleDownload = () => {
    toast({
      title: "Download Started",
      description: "Your ebook download will begin shortly.",
    });
    // Implement actual download logic here
  };

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/ebook/preview/${selectedEbookId}`;
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Share Link Copied",
      description: "The preview link has been copied to your clipboard.",
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4">
        <div className="max-w-4xl mx-auto pt-20">
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
              <p className="text-gray-600 mb-6">Please sign in to view your ebook publish preview.</p>
              <Button onClick={() => navigate('/auth')}>
                Sign In
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!selectedEbookId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4">
        <div className="max-w-4xl mx-auto pt-20">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Select an Ebook to Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              {availableEbooks.length > 0 ? (
                <div className="space-y-4">
                  <p className="text-gray-600">Choose an ebook to preview:</p>
                  <div className="grid gap-3">
                    {availableEbooks.map((ebook) => (
                      <Button
                        key={ebook.id}
                        variant="outline"
                        onClick={() => setSelectedEbookId(ebook.id)}
                        className="justify-start"
                      >
                        <BookOpen className="w-4 h-4 mr-2" />
                        {ebook.title}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Ebooks Found</h3>
                  <p className="text-gray-600 mb-4">
                    You don't have any generated ebooks yet. Create one first to see the preview.
                  </p>
                  <Button onClick={() => navigate('/ebook-builder')}>
                    Create Ebook
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pt-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Ebook Publish Preview</h1>
              <p className="text-gray-600">Preview your complete ebook with cover and chapter images</p>
            </div>
          </div>
          
          {availableEbooks.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Switch ebook:</span>
              <select
                value={selectedEbookId}
                onChange={(e) => setSelectedEbookId(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              >
                {availableEbooks.map((ebook) => (
                  <option key={ebook.id} value={ebook.id}>
                    {ebook.title}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Main Content */}
        <EbookPublishPreview
          ebookId={selectedEbookId}
          onDownload={handleDownload}
          onShare={handleShare}
        />

        {/* Footer Info */}
        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ExternalLink className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">How to Use This Preview</h3>
                <div className="text-sm text-blue-800 space-y-1">
                  <p>• <strong>Preview Tab:</strong> See your complete ebook with cover and chapter images</p>
                  <p>• <strong>Cover Image Tab:</strong> Generate or update your book cover</p>
                  <p>• <strong>Chapter Images Tab:</strong> Add illustrations to individual chapters</p>
                  <p>• All generated images are automatically saved to your ebook</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EbookPublishDemo; 