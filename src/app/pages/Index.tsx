import { SparkleEffect } from "@/modules/shared/components/SparkleEffect";
import { BackgroundImages } from "@/modules/shared/components/BackgroundImages";
import { PageHeader } from "@/modules/shared/components/PageHeader";
import { StoryForm } from "@/modules/story/components/StoryForm";
import { StoryResult } from "@/modules/story/components/StoryResult";
import { useApiCheck } from '@/modules/shared/hooks/useApiCheck';
import { useStoryGeneration } from '@/modules/story/hooks/useStoryGeneration';
import { personalityTypes } from '@/modules/story/types/personality';
import { useClerkAuth } from '@/modules/auth/contexts/ClerkAuthContext';
import { Button } from "@/modules/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/modules/shared/components/ui/card";
import { AuthDialog } from "@/modules/shared/components/AuthDialog";
import { BookOpen, Sparkles, User, Star, ArrowRight, Heart, Zap, Clock } from "lucide-react";
import { motion } from "framer-motion";
import AuthTest from "@/components/AuthTest";

const Index = () => {
  useApiCheck();
  const { isAuthenticated, user } = useClerkAuth();
  const {
    name,
    setName,
    date,
    setDate,
    loading,
    result,
    personalityType,
    setPersonalityType,
    gender,
    setGender,
    storyId,
    previousStory,
    location,
    setLocation,
    handleStorySelect,
    handleSubmit,
    handleUndo
  } = useStoryGeneration();

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-[#E5DEFF] via-[#FFDEE2] to-[#D3E4FD] py-12 px-4 relative overflow-hidden">
      <SparkleEffect />
      <BackgroundImages />

      <div className="max-w-4xl mx-auto space-y-8 relative z-10">
        {/* Modern Hero Section */}
        {!isAuthenticated && (
          <motion.div
            className="text-center space-y-6 mb-8"
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white text-sm font-medium"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Sparkles className="h-4 w-4" />
              <span>✨ AI-Powered Story Generation</span>
              <Sparkles className="h-4 w-4" />
            </motion.div>

            <motion.div
              className="space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <motion.h1
                className="text-4xl md:text-6xl font-bold text-white leading-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
              >
                Turn Your
                <motion.span
                  className="block bg-gradient-to-r from-yellow-300 via-pink-300 to-purple-300 bg-clip-text text-transparent"
                  animate={{
                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                  style={{
                    background: "linear-gradient(45deg, #fde047, #f472b6, #a855f7)",
                    backgroundSize: "200% 200%",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    WebkitTextFillColor: "transparent"
                  }}
                >
                  Memories Into Magic
                </motion.span>
              </motion.h1>

              <motion.p
                className="text-xl text-white/90 max-w-2xl mx-auto leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1.0 }}
              >
                Transform your life stories into beautiful, personalized books with the power of AI.
                From graduation memories to love stories - create something truly magical.
              </motion.p>
            </motion.div>

            {/* Quick Stats */}
            <motion.div
              className="flex justify-center gap-8 text-white/80 text-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.2 }}
            >
              <motion.div
                className="flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
              >
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>10,000+ Stories Created</span>
              </motion.div>
              <motion.div
                className="flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
              >
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span>Free Forever Plan</span>
              </motion.div>
              <motion.div
                className="flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
              >
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                <span>Premium Features</span>
              </motion.div>
            </motion.div>
          </motion.div>
        )}

        <PageHeader />

        {/* Authentication Test Component - Remove this after debugging */}
        {isAuthenticated && user && (
          (user.email === 'admin@flipmyera.com' ||
           user.email === 'danny.ijdo@gmail.com' ||
           user.email?.includes('trendpilot')) && (
            <div className="mb-8">
              <AuthTest />
            </div>
          )
        )}

        {/* Call-to-action for non-authenticated users */}
        {!isAuthenticated && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <Card className="bg-white/90 backdrop-blur-lg border border-[#E5DEFF]/50 shadow-2xl relative overflow-hidden">
              {/* Animated background gradient */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-pink-500/5 to-blue-500/5"
                animate={{
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "linear"
                }}
                style={{
                  backgroundSize: "200% 200%"
                }}
              />

              {/* Floating orbs */}
              <motion.div
                className="absolute top-4 right-4 w-2 h-2 bg-purple-400 rounded-full opacity-60"
                animate={{
                  y: [0, -10, 0],
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              <motion.div
                className="absolute bottom-4 left-4 w-1.5 h-1.5 bg-pink-400 rounded-full opacity-60"
                animate={{
                  y: [0, 8, 0],
                  scale: [1, 1.3, 1],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1
                }}
              />

              <CardHeader className="text-center relative z-10">
                <CardTitle className="flex items-center justify-center gap-2 text-2xl font-bold text-gray-900 mb-2">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Sparkles className="h-6 w-6 text-purple-500" />
                  </motion.div>
                  <motion.span
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                  >
                    Unlock Your Full Potential
                  </motion.span>
                  <motion.div
                    animate={{ rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  >
                    <Sparkles className="h-6 w-6 text-purple-500" />
                  </motion.div>
                </CardTitle>
                <CardDescription className="text-lg text-gray-600">
                  Sign up to save your stories, access your personal dashboard, and unlock premium features
                </CardDescription>
              </CardHeader>

              <CardContent className="text-center space-y-6 relative z-10">
                <motion.div
                  className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8, staggerChildren: 0.1 }}
                >
                  {[
                    { icon: BookOpen, text: "Save & organize stories", color: "text-purple-500", delay: 0 },
                    { icon: User, text: "Personal dashboard", color: "text-pink-500", delay: 0.1 },
                    { icon: Star, text: "Premium features", color: "text-blue-500", delay: 0.2 }
                  ].map((item, index) => (
                    <motion.div
                      key={index}
                      className="flex items-center gap-2 justify-center p-3 rounded-lg bg-gray-50/50 hover:bg-gray-100/50 transition-colors"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 + item.delay, duration: 0.5 }}
                      whileHover={{ scale: 1.05 }}
                    >
                      <motion.div
                        animate={{
                          scale: [1, 1.2, 1],
                          rotate: [0, 5, -5, 0]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: item.delay
                        }}
                      >
                        <item.icon className={`h-4 w-4 ${item.color}`} />
                      </motion.div>
                      <span className="font-medium">{item.text}</span>
                    </motion.div>
                  ))}
                </motion.div>

                <motion.div
                  className="flex flex-col sm:flex-row gap-3 justify-center items-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2, duration: 0.6 }}
                >
                  <AuthDialog
                    trigger={
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 shadow-lg hover:shadow-xl transition-all duration-300">
                          <Sparkles className="h-4 w-4 mr-2" />
                          Get Started - It's Free!
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </motion.div>
                    }
                  />

                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      variant="outline"
                      className="border-purple-200 hover:border-purple-300 hover:bg-purple-50 transition-all duration-300"
                      onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
                    >
                      <Heart className="h-4 w-4 mr-2" />
                      Learn More
                    </Button>
                  </motion.div>
                </motion.div>

                {/* Trust indicators */}
                <motion.div
                  className="flex justify-center items-center gap-6 text-xs text-gray-500 mt-6 pt-4 border-t border-gray-200/50"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.5, duration: 0.6 }}
                >
                  <motion.div
                    className="flex items-center gap-1"
                    whileHover={{ scale: 1.05 }}
                  >
                    <Zap className="h-3 w-3 text-green-500" />
                    <span>Free forever</span>
                  </motion.div>
                  <motion.div
                    className="flex items-center gap-1"
                    whileHover={{ scale: 1.05 }}
                  >
                    <Clock className="h-3 w-3 text-blue-500" />
                    <span>Setup in 30s</span>
                  </motion.div>
                  <motion.div
                    className="flex items-center gap-1"
                    whileHover={{ scale: 1.05 }}
                  >
                    <Heart className="h-3 w-3 text-red-500" />
                    <span>Trusted by creators</span>
                  </motion.div>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <StoryForm
          name={name}
          setName={setName}
          date={date}
          setDate={setDate}
          loading={loading}
          handleSubmit={handleSubmit}
          handleStorySelect={handleStorySelect}
          personalityTypes={personalityTypes}
          personalityType={personalityType}
          setPersonalityType={setPersonalityType}
          gender={gender}
          setGender={setGender}
          location={location}
          setLocation={setLocation}
        />

        {result && (
          <StoryResult
            result={result}
            storyId={storyId}
            onRegenerateClick={handleSubmit}
            onUndoClick={handleUndo}
            hasPreviousStory={!!previousStory}
          />
        )}
      </div>
    </div>
  );
};

export default Index;
