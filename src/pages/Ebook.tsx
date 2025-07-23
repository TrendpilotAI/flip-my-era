import { SparkleEffect } from "@/modules/shared/components/SparkleEffect";
import { BackgroundImages } from "@/modules/shared/components/BackgroundImages";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/modules/shared/components/ui/card";
import { Button } from "@/modules/shared/components/ui/button";
import { Sparkles, BookOpen, Download, Share2, Star, Zap, Heart } from "lucide-react";
import { AuthDialog } from "@/modules/shared/components/AuthDialog";
import { useClerkAuth } from '@/modules/auth/contexts/ClerkAuthContext';
import { CreditBasedEbookGenerator } from '@/modules/ebook/components/CreditBasedEbookGenerator';
import { createSupabaseClientWithClerkToken } from '@/core/integrations/supabase/client';
import { useToast } from '@/modules/shared/hooks/use-toast';

const Ebook = () => {
  const { isAuthenticated, user, getToken } = useClerkAuth();
  const { toast } = useToast();

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-[#E5DEFF] via-[#FFDEE2] to-[#D3E4FD] py-12 px-4 relative overflow-hidden">
      <SparkleEffect />
      <BackgroundImages />

      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
        {/* Hero Section */}
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-8 w-8 text-purple-500" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Create Your Ebook
            </h1>
            <Sparkles className="h-8 w-8 text-purple-500" />
          </div>
          <p className="text-xl text-gray-700 max-w-2xl mx-auto">
            Transform your stories into beautiful, downloadable ebooks with AI-generated illustrations and chapters.
          </p>
        </div>

        {/* Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white/90 backdrop-blur-lg border border-[#E5DEFF]/50 shadow-xl">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle className="text-lg font-semibold">Multi-Chapter Books</CardTitle>
              <CardDescription>
                Generate complete books with multiple chapters and perfect story continuity
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white/90 backdrop-blur-lg border border-[#E5DEFF]/50 shadow-xl">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-6 w-6 text-pink-600" />
              </div>
              <CardTitle className="text-lg font-semibold">AI Illustrations</CardTitle>
              <CardDescription>
                Beautiful AI-generated illustrations that bring your story to life
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white/90 backdrop-blur-lg border border-[#E5DEFF]/50 shadow-xl">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Download className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle className="text-lg font-semibold">Multiple Formats</CardTitle>
              <CardDescription>
                Download your ebooks in PDF, EPUB, and other popular formats
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Ebook Generator Section */}
        {isAuthenticated ? (
          <Card className="bg-white/90 backdrop-blur-lg border border-[#E5DEFF]/50 shadow-xl">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                Create Your Ebook
              </CardTitle>
              <CardDescription className="text-lg text-gray-600">
                Start with a story idea and watch AI create a complete book with chapters and illustrations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CreditBasedEbookGenerator
                originalStory="Enter your story idea here and watch the AI create a multi-chapter book with perfect continuity..."
                useTaylorSwiftThemes={false}
                selectedTheme="coming-of-age"
                selectedFormat="short-story"
                onChaptersGenerated={async (chapters) => {
                  console.log('Generated chapters:', chapters);
                  
                  // Save to database for credit-based generation
                  try {
                    const token = await getToken({ template: 'supabase' });
                    if (token && user?.id) {
                      const supabaseWithAuth = createSupabaseClientWithClerkToken(token);
                      
                      const { data: ebookGeneration, error } = await supabaseWithAuth
                        .from('ebook_generations')
                        .insert({
                          user_id: user.id,
                          title: `Ebook: ${chapters[0]?.title || 'Untitled'}`,
                          content: JSON.stringify(chapters),
                          status: 'completed',
                          credits_used: 1,
                          paid_with_credits: true,
                          story_type: 'ebook',
                          chapter_count: chapters.length,
                          word_count: chapters.reduce((total, chapter) => total + (chapter.content?.length || 0), 0)
                        })
                        .select()
                        .single();

                      if (error) {
                        console.error('Error saving ebook:', error);
                        toast({
                          title: "Save Failed",
                          description: "Ebook generated but couldn't be saved to your library.",
                          variant: "destructive",
                        });
                      } else {
                        console.log('Successfully saved ebook:', ebookGeneration);
                        toast({
                          title: "Ebook Saved!",
                          description: `Successfully created and saved ${chapters.length} chapters.`,
                        });
                      }
                    } else {
                      toast({
                        title: "Authentication Required",
                        description: "Please sign in to save your generated ebooks.",
                        variant: "destructive",
                      });
                    }
                  } catch (dbError) {
                    console.error('Database save error:', dbError);
                    toast({
                      title: "Save Error",
                      description: "Ebook generated but couldn't be saved. Please try again.",
                      variant: "destructive",
                    });
                  }
                }}
                onError={(error) => {
                  console.error('Generation error:', error);
                  toast({
                    title: "Generation Failed",
                    description: error,
                    variant: "destructive",
                  });
                }}
              />
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-white/90 backdrop-blur-lg border border-[#E5DEFF]/50 shadow-xl">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                Sign In to Create Ebooks
              </CardTitle>
              <CardDescription className="text-lg text-gray-600">
                Join our community to start creating beautiful ebooks with AI assistance
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <AuthDialog
                trigger={
                  <Button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 font-semibold px-8 py-3">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Sign In to Start Creating
                  </Button>
                }
              />
            </CardContent>
          </Card>
        )}

        {/* Benefits Section */}
        <Card className="bg-white/90 backdrop-blur-lg border border-[#E5DEFF]/50 shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
              Why Choose Our Ebook Creator?
            </CardTitle>
            <CardDescription className="text-lg text-gray-600">
              Discover the advantages of our AI-powered ebook generation platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Zap className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Advanced AI Memory</h3>
                    <p className="text-sm text-gray-600">
                      Our AI remembers every detail, ensuring perfect character consistency and plot continuity across all chapters.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Star className="h-4 w-4 text-pink-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Professional Quality</h3>
                    <p className="text-sm text-gray-600">
                      Generate ebooks that rival traditionally published works with proper formatting and structure.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Heart className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Personalized Experience</h3>
                    <p className="text-sm text-gray-600">
                      Every ebook is tailored to your preferences, writing style, and story themes.
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Download className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Multiple Formats</h3>
                    <p className="text-sm text-gray-600">
                      Download your ebooks in PDF, EPUB, and other formats for any device or platform.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Share2 className="h-4 w-4 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Easy Sharing</h3>
                    <p className="text-sm text-gray-600">
                      Share your ebooks with friends, family, or publish them to reach a wider audience.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <BookOpen className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Library Management</h3>
                    <p className="text-sm text-gray-600">
                      Organize and manage all your ebooks in your personal dashboard with easy access.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold mb-2">
              Ready to Create Your First Ebook?
            </CardTitle>
            <CardDescription className="text-purple-100">
              Join thousands of authors creating beautiful ebooks with AI assistance
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            {isAuthenticated ? (
              <Button 
                onClick={() => window.location.href = '/ebook-builder'}
                className="bg-white text-purple-600 hover:bg-gray-100 font-semibold px-8 py-3"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Start Creating Now
              </Button>
            ) : (
              <AuthDialog
                trigger={
                  <Button className="bg-white text-purple-600 hover:bg-gray-100 font-semibold px-8 py-3">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Get Started - It's Free!
                  </Button>
                }
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Ebook; 