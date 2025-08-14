import { SparkleEffect } from "@/modules/shared/components/SparkleEffect";
import { BackgroundImages } from "@/modules/shared/components/BackgroundImages";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shared/components/ui/card';
import { Button } from '@/modules/shared/components/ui/button';
import { useClerkAuth } from '@/modules/auth/contexts/ClerkAuthContext';
import { useTheme } from '@/modules/shared/contexts/ThemeContext';
import { useThemeColors } from '@/modules/shared/utils/themeUtils';
import AboutCarousel from '@/modules/shared/components/AboutCarousel';
import { AuthDialog } from '@/modules/shared/components/AuthDialog';
import { Sparkles, Music, ArrowRight, Star, Heart, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

const About = () => {
  const { isAuthenticated } = useClerkAuth();
  const { currentTheme, isThemeSet } = useTheme();
  const themeColors = useThemeColors();

  const features = [
    {
      icon: <Star className="h-6 w-6" style={{ color: themeColors.primary }} />,
      title: "AI-Powered Stories",
      description: "Advanced AI creates personalized alternate timeline stories based on your choices and preferences."
    },
    {
      icon: <Heart className="h-6 w-6" style={{ color: themeColors.secondary }} />,
      title: "Personalized Experience",
      description: "Every story is tailored to you, with themes and styles that match your musical inspiration."
    },
    {
      icon: <Zap className="h-6 w-6" style={{ color: themeColors.accent }} />,
      title: "Instant Generation",
      description: "Get your story in seconds with our lightning-fast AI generation technology."
    }
  ];

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
            <Sparkles className="h-8 w-8" style={{ color: themeColors.primary }} />
            <h1 
              className="text-4xl font-bold bg-clip-text text-transparent"
              style={{ background: `linear-gradient(to right, ${themeColors.primary}, ${themeColors.secondary})` }}
            >
              About Flip My Era
            </h1>
            <Sparkles className="h-8 w-8" style={{ color: themeColors.primary }} />
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
                  
                  {/* Top Songs */}
                  <div className="text-center">
                    <h4 
                      className="text-lg font-semibold mb-3"
                      style={{ color: currentTheme.colors.foreground }}
                    >
                      Top Songs
                    </h4>
                    <div className="flex flex-wrap justify-center gap-2">
                      {currentTheme.topSongs.slice(0, 5).map((song, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 rounded-full text-sm"
                          style={{ 
                            backgroundColor: `${currentTheme.colors.muted}80`,
                            color: currentTheme.colors.mutedForeground
                          }}
                        >
                          {song}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Features Section */}
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Why Choose Flip My Era?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Experience the future of storytelling with cutting-edge AI technology
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="text-center p-6 hover:shadow-lg transition-shadow">
                <div className="flex justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <Card className="text-center p-8">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-gray-900 mb-4">
              Ready to Explore Your Alternate Reality?
            </CardTitle>
            <CardDescription className="text-lg text-gray-600 max-w-2xl mx-auto">
              Join thousands of users who are already discovering what could have been
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
                      Get Started - It's Free!
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
                  <Link to="/">
                    <Sparkles className="h-5 w-5 mr-2" />
                    Create Your Story
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

export default About; 