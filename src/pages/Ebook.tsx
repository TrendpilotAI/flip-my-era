import { SparkleEffect } from "@/modules/shared/components/SparkleEffect";
import { BackgroundImages } from "@/modules/shared/components/BackgroundImages";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/modules/shared/components/ui/card";
import { Button } from "@/modules/shared/components/ui/button";
import { Sparkles, BookOpen, Download, Share2, Star, Zap, Heart, ArrowRight } from "lucide-react";
import { AuthDialog } from "@/modules/shared/components/AuthDialog";
import { useClerkAuth } from '@/modules/auth/contexts/ClerkAuthContext';
import { CreditBasedEbookGenerator } from '@/modules/ebook/components/CreditBasedEbookGenerator';
import { createSupabaseClientWithClerkToken } from '@/core/integrations/supabase/client';
import { useToast } from '@/modules/shared/hooks/use-toast';
import { useTheme } from '@/modules/shared/contexts/ThemeContext';
import { useThemeColors } from '@/modules/shared/utils/themeUtils';
import { Link } from 'react-router-dom';

const Ebook = () => {
  const { isAuthenticated, user, getToken } = useClerkAuth();
  const { toast } = useToast();
  const { currentTheme } = useTheme();
  const themeColors = useThemeColors();

  return (
    <div 
      className="min-h-screen py-12 px-4 relative overflow-hidden"
      style={{ backgroundColor: currentTheme.colors.background }}
    >
      <SparkleEffect />
      <BackgroundImages />

      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
        {/* Hero Section */}
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-8 w-8" style={{ color: themeColors.primary }} />
            <h1 
              className="text-4xl font-bold bg-clip-text text-transparent"
              style={{ background: `linear-gradient(to right, ${themeColors.primary}, ${themeColors.secondary})` }}
            >
              Create Your Ebook
            </h1>
            <Sparkles className="h-8 w-8" style={{ color: themeColors.primary }} />
          </div>
          <p className="text-xl text-gray-700 max-w-2xl mx-auto">
            Transform your stories into beautiful, downloadable ebooks with AI-generated illustrations and chapters.
          </p>
        </div>

        {/* Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white/90 backdrop-blur-lg border border-gray-200 shadow-xl">
            <CardHeader className="text-center">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: `${themeColors.primary}20` }}
              >
                <BookOpen className="h-6 w-6" style={{ color: themeColors.primary }} />
              </div>
              <CardTitle className="text-lg font-semibold">Multi-Chapter Books</CardTitle>
              <CardDescription>
                Generate complete books with multiple chapters and perfect story continuity
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white/90 backdrop-blur-lg border border-gray-200 shadow-xl">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-6 w-6 text-gray-600" />
              </div>
              <CardTitle className="text-lg font-semibold">AI Illustrations</CardTitle>
              <CardDescription>
                Beautiful AI-generated illustrations that bring your story to life
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white/90 backdrop-blur-lg border border-gray-200 shadow-xl">
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
          <Card className="bg-white/90 backdrop-blur-lg border border-gray-200 shadow-xl">
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
                          title: "Error",
                          description: "Failed to save your ebook. Please try again.",
                          variant: "destructive",
                        });
                      } else {
                        toast({
                          title: "Success!",
                          description: "Your ebook has been saved to your dashboard.",
                        });
                      }
                    }
                  } catch (error) {
                    console.error('Error saving ebook:', error);
                    toast({
                      title: "Error",
                      description: "Failed to save your ebook. Please try again.",
                      variant: "destructive",
                    });
                  }
                }}
              />
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-white/90 backdrop-blur-lg border border-gray-200 shadow-xl">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                Sign Up to Create Ebooks
              </CardTitle>
              <CardDescription className="text-lg text-gray-600">
                Join thousands of users creating beautiful ebooks with AI assistance
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2 justify-center">
                  <BookOpen className="h-4 w-4" style={{ color: themeColors.primary }} />
                  <span>Unlimited ebooks</span>
                </div>
                <div className="flex items-center gap-2 justify-center">
                  <Sparkles className="h-4 w-4 text-gray-500" />
                  <span>AI illustrations</span>
                </div>
                <div className="flex items-center gap-2 justify-center">
                  <Download className="h-4 w-4 text-blue-500" />
                  <span>Multiple formats</span>
                </div>
              </div>
              <div className="flex justify-center">
                <AuthDialog
                  trigger={
                    <Button 
                      className="text-white font-semibold px-8 py-3"
                      style={{ background: `linear-gradient(to right, ${themeColors.primary}, ${themeColors.secondary})` }}
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Get Started - It's Free!
                    </Button>
                  }
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Benefits Section */}
        <Card className="bg-white/90 backdrop-blur-lg border border-gray-200 shadow-xl">
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
                                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Star className="h-4 w-4 text-gray-600" />
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

        {/* Call to Action */}
        <Card className="text-center p-8">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-gray-900 mb-4">
              Ready to Create Your First Ebook?
            </CardTitle>
            <CardDescription className="text-lg text-gray-600 max-w-2xl mx-auto">
              Transform your stories into beautiful, downloadable books with AI assistance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isAuthenticated ? (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <AuthDialog
                  trigger={
                    <Button 
                      className="text-white px-8 py-3 text-lg"
                      style={{ background: `linear-gradient(to right, ${themeColors.primary}, ${themeColors.secondary})` }}
                    >
                      <Sparkles className="h-5 w-5 mr-2" />
                      Start Creating - It's Free!
                    </Button>
                  }
                />
                <Button variant="outline" className="px-8 py-3 text-lg" asChild>
                  <Link to="/about">
                    Learn More
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  className="text-white px-8 py-3 text-lg"
                  style={{ background: `linear-gradient(to right, ${themeColors.primary}, ${themeColors.secondary})` }}
                  asChild
                >
                  <Link to="/ebook-builder">
                    <BookOpen className="h-5 w-5 mr-2" />
                    Create Your Ebook
                  </Link>
                </Button>
                <Button variant="outline" className="px-8 py-3 text-lg" asChild>
                  <Link to="/dashboard">
                    View Dashboard
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Ebook; 