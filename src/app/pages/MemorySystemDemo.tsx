// Memory System Demo Page
// Showcases the enhanced story generation with memory system

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/modules/shared/components/ui/card';
import { Button } from '@/modules/shared/components/ui/button';
import { Textarea } from '@/modules/shared/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shared/components/ui/select';
import { Switch } from '@/modules/shared/components/ui/switch';
import { Label } from '@/modules/shared/components/ui/label';
import { Badge } from '@/modules/shared/components/ui/badge';
import { MemoryEnhancedEbookGenerator } from '@/modules/ebook/components/MemoryEnhancedEbookGenerator';
import { 
  Brain, 
  BookOpen, 
  Sparkles, 
  ArrowRight,
  Info,
  CheckCircle2,
  AlertCircle,
  Clock,
  Users
} from 'lucide-react';

interface Chapter {
  title: string;
  content: string;
  id: string;
}

export const MemorySystemDemo: React.FC = () => {
  const [originalStory, setOriginalStory] = useState('');
  const [useTaylorSwiftThemes, setUseTaylorSwiftThemes] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState('coming-of-age');
  const [selectedFormat, setSelectedFormat] = useState('short-story');
  const [generatedChapters, setGeneratedChapters] = useState<Chapter[]>([]);
  const [showGenerator, setShowGenerator] = useState(false);

  const sampleStories = [
    {
      title: "The Time Traveler's Dilemma",
      content: "Sarah discovers an old pocket watch in her grandmother's attic that can transport her back in time. Each time she uses it, she changes something small, but these changes ripple through history in unexpected ways. Now she must decide whether to fix the timeline or embrace the chaos she's created."
    },
    {
      title: "The Last Library",
      content: "In a world where books have been banned and all knowledge is digital, Maya finds the last hidden library. The elderly librarian tells her she's been chosen to preserve humanity's written heritage, but powerful forces are hunting for this sanctuary of forbidden knowledge."
    },
    {
      title: "The Melody Keeper",
      content: "Alex has the rare ability to see emotions as colors and hear them as melodies. When the city's music starts disappearing, leaving people emotionally numb, Alex must journey into the realm of lost songs to restore harmony before silence consumes everything."
    }
  ];

  const handleSampleStory = (story: { title: string; content: string }) => {
    setOriginalStory(story.content);
  };

  const handleStartGeneration = () => {
    if (!originalStory.trim()) {
      return;
    }
    setShowGenerator(true);
  };

  const handleChaptersGenerated = (chapters: Chapter[]) => {
    setGeneratedChapters(chapters);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Brain className="w-10 h-10 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">
              Memory-Enhanced Story Generation
            </h1>
            <Sparkles className="w-10 h-10 text-purple-600" />
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Experience the future of AI storytelling with our advanced memory system that ensures perfect character consistency, plot continuity, and eliminates repetition.
          </p>
        </div>

        {/* Feature Overview */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-blue-900">Story Outline Planning</h3>
              </div>
              <p className="text-sm text-blue-700">
                AI creates comprehensive outlines with character bios and plot structure before writing.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-green-900">Rolling Memory</h3>
              </div>
              <p className="text-sm text-green-700">
                Each chapter is summarized and stored to maintain context throughout the story.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-purple-900">Character Tracking</h3>
              </div>
              <p className="text-sm text-purple-700">
                Persistent tracking of character states, relationships, and development arcs.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-orange-600" />
                <h3 className="font-semibold text-orange-900">Repetition Detection</h3>
              </div>
              <p className="text-sm text-orange-700">
                AI embeddings detect and prevent repetitive content between chapters.
              </p>
            </CardContent>
          </Card>
        </div>

        {!showGenerator ? (
          <>
            {/* Story Input Section */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Story Setup
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Sample Stories */}
                <div>
                  <Label className="text-base font-medium mb-3 block">
                    Try a Sample Story
                  </Label>
                  <div className="grid md:grid-cols-3 gap-4">
                    {sampleStories.map((story, index) => (
                      <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-blue-300">
                        <CardContent className="p-4" onClick={() => handleSampleStory(story)}>
                          <h4 className="font-semibold mb-2">{story.title}</h4>
                          <p className="text-sm text-gray-600 line-clamp-3">
                            {story.content}
                          </p>
                          <Button variant="outline" size="sm" className="mt-3 w-full">
                            <ArrowRight className="w-4 h-4 mr-2" />
                            Use This Story
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Custom Story Input */}
                <div>
                  <Label htmlFor="story-input" className="text-base font-medium mb-3 block">
                    Or Enter Your Own Story
                  </Label>
                  <Textarea
                    id="story-input"
                    placeholder="Enter your story premise here. This will be expanded into a multi-chapter book with perfect continuity using our memory system..."
                    value={originalStory}
                    onChange={(e) => setOriginalStory(e.target.value)}
                    rows={6}
                    className="resize-none"
                  />
                </div>

                {/* Configuration Options */}
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <Label className="text-base font-medium mb-3 block">
                      Story Format
                    </Label>
                    <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="short-story">Short Story (3 chapters)</SelectItem>
                        <SelectItem value="children-book">Children's Book (5 chapters)</SelectItem>
                        <SelectItem value="novella">Novella (8 chapters)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-base font-medium mb-3 block">
                      Theme Style
                    </Label>
                    <div className="flex items-center space-x-2 mb-3">
                      <Switch
                        id="taylor-swift"
                        checked={useTaylorSwiftThemes}
                        onCheckedChange={setUseTaylorSwiftThemes}
                      />
                      <Label htmlFor="taylor-swift">Taylor Swift Inspired</Label>
                    </div>
                    {useTaylorSwiftThemes && (
                      <Select value={selectedTheme} onValueChange={setSelectedTheme}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="coming-of-age">Coming of Age</SelectItem>
                          <SelectItem value="first-love">First Love</SelectItem>
                          <SelectItem value="heartbreak">Heartbreak & Healing</SelectItem>
                          <SelectItem value="friendship">Friendship</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  <div className="flex items-end">
                    <Button
                      onClick={handleStartGeneration}
                      disabled={!originalStory.trim()}
                      size="lg"
                      className="w-full"
                    >
                      <Brain className="w-4 h-4 mr-2" />
                      Start Memory-Enhanced Generation
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Benefits Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="w-5 h-5" />
                  Why Use Memory-Enhanced Generation?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3 text-green-700">✅ With Memory System</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Characters maintain consistent names, personalities, and relationships</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Plot progresses logically with clear story arc</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>No repetition of events or character developments</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Rich world-building that builds upon previous chapters</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Emotionally satisfying conclusions that resolve conflicts</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-3 text-red-700">❌ Without Memory System</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                        <span>Character names and traits change between chapters</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                        <span>Plot threads are forgotten or contradicted</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                        <span>Repetitive scenes and character introductions</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                        <span>Disconnected chapters that don't build on each other</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                        <span>Unsatisfying endings due to lost context</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            {/* Generation Interface */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  Memory-Enhanced Generation in Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h4 className="font-medium mb-2">Story Premise:</h4>
                  <p className="text-sm text-gray-700">{originalStory}</p>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="outline">
                    Format: {selectedFormat.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Badge>
                  {useTaylorSwiftThemes && (
                    <Badge variant="outline">
                      Theme: {selectedTheme.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Badge>
                  )}
                  <Badge variant="secondary">
                    <Brain className="w-3 h-3 mr-1" />
                    Memory Enhanced
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <MemoryEnhancedEbookGenerator
              originalStory={originalStory}
              useTaylorSwiftThemes={useTaylorSwiftThemes}
              selectedTheme={selectedTheme}
              selectedFormat={selectedFormat}
              onChaptersGenerated={handleChaptersGenerated}
              onError={(error) => {
                console.error('Generation error:', error);
              }}
            />

            {/* Back Button */}
            <div className="flex justify-center mt-8">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowGenerator(false);
                  setGeneratedChapters([]);
                }}
              >
                ← Try Another Story
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}; 