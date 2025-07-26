import { SparkleEffect } from "@/modules/shared/components/SparkleEffect";
import { BackgroundImages } from "@/modules/shared/components/BackgroundImages";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/modules/shared/components/ui/card";
import { Button } from "@/modules/shared/components/ui/button";
import { Sparkles, BookOpen, Users, Star, Heart, Zap, Music } from "lucide-react";
import { AuthDialog } from "@/modules/shared/components/AuthDialog";
import AboutCarousel from "@/modules/shared/components/AboutCarousel";
import { useTheme } from "@/modules/shared/contexts/ThemeContext";

const About = () => {
  const { currentTheme, isThemeSet } = useTheme();

  return (
    <div 
      className="min-h-screen py-12 px-4 relative overflow-hidden" 
      style={{ backgroundColor: currentTheme.colors.background }}
    >
      <SparkleEffect />
      <BackgroundImages />

      <div className="max-w-4xl mx-auto space-y-8 relative z-10">
        {/* Hero Section */}
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-8 w-8 text-purple-500" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              About Flip My Era
            </h1>
            <Sparkles className="h-8 w-8 text-purple-500" />
          </div>
          <p className="text-xl text-gray-700 max-w-2xl mx-auto">
            Discover what could have been with AI-powered alternate timeline stories. 
            Every choice creates a new reality - explore yours.
          </p>
        </div>

        {/* Carousel Section */}
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Explore Infinite Possibilities
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              See how our AI transforms your choices into captivating alternate timeline stories
            </p>
          </div>
          <AboutCarousel />
        </div>

        {/* Artist-Inspired Section */}
        {isThemeSet && (
          <>
            {/* Artist Bio Section */}
            <Card 
              className="backdrop-blur-lg border shadow-xl"
              style={{ 
                backgroundColor: `${currentTheme.colors.card}cc`,
                borderColor: currentTheme.colors.border,
                color: currentTheme.colors.cardForeground
              }}
            >
              <CardHeader className="text-center">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Music 
                    className="h-8 w-8" 
                    style={{ color: currentTheme.colors.primary }}
                  />
                  <CardTitle 
                    className="text-3xl font-bold"
                    style={{ color: currentTheme.colors.foreground }}
                  >
                    Inspired by {currentTheme.name}
                  </CardTitle>
                  <Music 
                    className="h-8 w-8" 
                    style={{ color: currentTheme.colors.primary }}
                  />
                </div>
                <CardDescription 
                  className="text-lg"
                  style={{ color: currentTheme.colors.mutedForeground }}
                >
                  Your personalized experience draws inspiration from the musical legacy of {currentTheme.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 
                      className="text-xl font-semibold mb-4"
                      style={{ color: currentTheme.colors.foreground }}
                    >
                      About {currentTheme.name}
                    </h3>
                    <p 
                      className="text-base leading-relaxed max-w-3xl mx-auto"
                      style={{ color: currentTheme.colors.mutedForeground }}
                    >
                      {currentTheme.bio}
                    </p>
                    <div className="flex justify-center gap-4 mt-4 text-sm">
                      <span 
                        className="px-3 py-1 rounded-full"
                        style={{ 
                          backgroundColor: `${currentTheme.colors.primary}20`,
                          color: currentTheme.colors.primary
                        }}
                      >
                        Era: {currentTheme.era}
                      </span>
                      <span 
                        className="px-3 py-1 rounded-full"
                        style={{ 
                          backgroundColor: `${currentTheme.colors.secondary}20`,
                          color: currentTheme.colors.foreground
                        }}
                      >
                        Genre: {currentTheme.genre}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top Songs Billboard */}
            <Card 
              className="backdrop-blur-lg border shadow-xl"
              style={{ 
                backgroundColor: `${currentTheme.colors.card}cc`,
                borderColor: currentTheme.colors.border
              }}
            >
              <CardHeader className="text-center">
                <CardTitle 
                  className="text-2xl font-bold flex items-center justify-center gap-2"
                  style={{ color: currentTheme.colors.foreground }}
                >
                  <Star 
                    className="h-6 w-6" 
                    style={{ color: currentTheme.colors.accent }}
                  />
                  Top Songs Billboard
                  <Star 
                    className="h-6 w-6" 
                    style={{ color: currentTheme.colors.accent }}
                  />
                </CardTitle>
                <CardDescription 
                  className="text-lg"
                  style={{ color: currentTheme.colors.mutedForeground }}
                >
                  The most popular hits from {currentTheme.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentTheme.topSongs.map((song, index) => (
                    <div 
                      key={index}
                      className="flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 hover:shadow-md"
                      style={{ 
                        backgroundColor: `${currentTheme.colors.muted}50`,
                        borderColor: `${currentTheme.colors.border}80`
                      }}
                    >
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                        style={{ 
                          background: `linear-gradient(135deg, ${currentTheme.colors.primary}, ${currentTheme.colors.secondary})`
                        }}
                      >
                        {index + 1}
                      </div>
                      <span 
                        className="font-medium"
                        style={{ color: currentTheme.colors.foreground }}
                      >
                        {song}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Mission Section */}
        <Card className="bg-white/90 backdrop-blur-lg border border-gray-200 shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
              Our Mission
            </CardTitle>
            <CardDescription className="text-lg text-gray-600">
              We believe every life is a story waiting to be told. Through the power of AI, 
              we help you explore the infinite possibilities of your personal narrative.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                  <Sparkles className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900">AI-Powered Stories</h3>
                <p className="text-sm text-gray-600">
                  Advanced AI technology creates personalized alternate timeline narratives based on your unique story.
                </p>
              </div>
              <div className="text-center space-y-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
          <BookOpen className="h-6 w-6 text-gray-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Personalized Experience</h3>
                <p className="text-sm text-gray-600">
                  Every story is tailored to your personality, preferences, and life experiences.
                </p>
              </div>
              <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Community Driven</h3>
                <p className="text-sm text-gray-600">
                  Join a community of storytellers exploring the infinite possibilities of life.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features Section */}
        <Card className="bg-white/90 backdrop-blur-lg border border-gray-200 shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
              What We Offer
            </CardTitle>
            <CardDescription className="text-lg text-gray-600">
              Explore our comprehensive suite of storytelling tools and features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Sparkles className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Story Generation</h3>
                    <p className="text-sm text-gray-600">
                      Create personalized alternate timeline stories based on your life experiences and choices.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                <BookOpen className="h-4 w-4 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Ebook Creation</h3>
                    <p className="text-sm text-gray-600">
                      Transform your stories into beautiful, downloadable ebooks with illustrations and chapters.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Star className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Premium Features</h3>
                    <p className="text-sm text-gray-600">
                      Access advanced AI models, unlimited stories, and exclusive content with premium membership.
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Heart className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Personal Dashboard</h3>
                    <p className="text-sm text-gray-600">
                      Save, organize, and manage all your stories in one beautiful, personalized dashboard.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Zap className="h-4 w-4 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Memory System</h3>
                    <p className="text-sm text-gray-600">
                      Advanced AI memory ensures perfect character consistency and plot continuity across chapters.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Users className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Community Features</h3>
                    <p className="text-sm text-gray-600">
                      Share your stories, discover others' narratives, and connect with fellow storytellers.
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
              Ready to Explore Your Alternate Timeline?
            </CardTitle>
            <CardDescription className="text-purple-100">
              Join thousands of users discovering the infinite possibilities of their life stories
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <AuthDialog
              trigger={
                <Button className="bg-white text-purple-600 hover:bg-gray-100 font-semibold px-8 py-3">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Start Your Journey - It's Free!
                </Button>
              }
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default About; 