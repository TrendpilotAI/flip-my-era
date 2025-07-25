import { useState } from "react";
import { SparkleEffect } from "@/modules/shared/components/SparkleEffect";
import { BackgroundImages } from "@/modules/shared/components/BackgroundImages";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/modules/shared/components/ui/card";
import { Button } from "@/modules/shared/components/ui/button";
import { Input } from "@/modules/shared/components/ui/input";
import { Textarea } from "@/modules/shared/components/ui/textarea";
import { Label } from "@/modules/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/modules/shared/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/modules/shared/components/ui/tabs";
import { Badge } from "@/modules/shared/components/ui/badge";
import { Slider } from "@/modules/shared/components/ui/slider";
import { CoverImageGenerator, ChapterImageGenerator } from "@/modules/ebook";
import { 
  Sparkles, 
  BookOpen, 
  Download, 
  Share2, 
  Star, 
  Zap, 
  Heart,
  Plus,
  Edit,
  Eye,
  Settings,
  Palette,
  Type,
  Image,
  Layout,
  Save,
  Play,
  AlignLeft,
  AlignCenter,
  AlignJustify,
  Ruler
} from "lucide-react";
import { AuthDialog } from "@/modules/shared/components/AuthDialog";
import { useClerkAuth } from '@/modules/auth/contexts/ClerkAuthContext';
import { CreditBasedEbookGenerator } from '@/modules/ebook/components/CreditBasedEbookGenerator';
import { EbookPublishDemo } from './EbookPublishDemo';
import { createSupabaseClientWithClerkToken } from '@/core/integrations/supabase/client';
import { useToast } from '@/modules/shared/hooks/use-toast';

interface EbookProject {
  id: string;
  title: string;
  description: string;
  genre: string;
  targetAudience: string;
  coverImage?: string;
  chapters: Chapter[];
  status: 'draft' | 'published';
  createdAt: string;
  updatedAt: string;
  designSettings: EbookDesignSettings;
}

interface Chapter {
  id: string;
  title: string;
  content: string;
  order: number;
}

interface EbookDesignSettings {
  // Typography
  fontFamily: 'serif' | 'sans-serif' | 'monospace';
  fontSize: number; // 12-20px
  lineHeight: number; // 1.2-2.0
  letterSpacing: number; // -0.05 to 0.1em
  textColor: string; // Custom text color in hex format
  chapterHeadingColor: string; // Custom chapter heading color in hex format
  
  // Layout
  pageLayout: 'single' | 'double' | 'magazine';
  textAlignment: 'left' | 'center' | 'justify';
  marginTop: number; // 20-60px
  marginBottom: number; // 20-60px
  marginLeft: number; // 20-80px
  marginRight: number; // 20-80px
  
  // Cover Design
  coverStyle: 'minimal' | 'modern' | 'classic' | 'bold';
  colorScheme: 'purple-pink' | 'blue-green' | 'orange-red' | 'monochrome';
  
  // Chapter Settings
  chapterTitleSize: number; // 24-36px
  chapterSpacing: number; // 30-60px
  paragraphSpacing: number; // 12-24px
}

const defaultDesignSettings: EbookDesignSettings = {
  fontFamily: 'serif',
  fontSize: 16,
  lineHeight: 1.6,
  letterSpacing: 0,
  textColor: '#374151', // Default dark gray text color
  chapterHeadingColor: '#8B5CF6', // Default purple chapter heading color
  pageLayout: 'single',
  textAlignment: 'left',
  marginTop: 40,
  marginBottom: 40,
  marginLeft: 40,
  marginRight: 40,
  coverStyle: 'modern',
  colorScheme: 'purple-pink',
  chapterTitleSize: 28,
  chapterSpacing: 40,
  paragraphSpacing: 16
};

const EbookBuilder = () => {
  const { isAuthenticated, user, getToken } = useClerkAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [currentProject, setCurrentProject] = useState<EbookProject | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedEbookId, setGeneratedEbookId] = useState<string | null>(null);
  
  // Image generation state
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [coverImagePrompt, setCoverImagePrompt] = useState<string>('');
  const [chapterImages, setChapterImages] = useState<Record<string, { url: string; prompt: string }>>({});

  // Image generation handlers
  const handleCoverImageGenerated = (imageUrl: string, prompt: string) => {
    setCoverImage(imageUrl);
    setCoverImagePrompt(prompt);
  };

  const handleChapterImageGenerated = (chapterId: string, imageUrl: string, prompt: string) => {
    setChapterImages(prev => ({
      ...prev,
      [chapterId]: { url: imageUrl, prompt }
    }));
  };

  const handleImageError = (error: string) => {
    toast({
      title: "Image Generation Error",
      description: error,
      variant: "destructive",
    });
  };

  const [projectForm, setProjectForm] = useState({
    title: "",
    description: "",
    genre: "",
    targetAudience: "",
    coverImage: ""
  });

  const handleCreateProject = () => {
    if (!projectForm.title || !projectForm.description) {
      toast({
        title: "Missing Information",
        description: "Please fill in the title and description for your ebook.",
        variant: "destructive",
      });
      return;
    }

    const newProject: EbookProject = {
      id: Date.now().toString(),
      title: projectForm.title,
      description: projectForm.description,
      genre: projectForm.genre,
      targetAudience: projectForm.targetAudience,
      coverImage: projectForm.coverImage,
      chapters: [],
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      designSettings: { ...defaultDesignSettings }
    };

    setCurrentProject(newProject);
    setActiveTab("design");
    
    toast({
      title: "Project Created!",
      description: "Your ebook project has been created successfully. Now customize your design!",
    });
  };

  const updateDesignSetting = <K extends keyof EbookDesignSettings>(
    key: K, 
    value: EbookDesignSettings[K]
  ) => {
    if (!currentProject) return;
    
    // Ensure backward compatibility by adding missing properties
    const designSettings = {
      ...defaultDesignSettings,
      ...currentProject.designSettings
    };
    
    setCurrentProject({
      ...currentProject,
      designSettings: {
        ...designSettings,
        [key]: value
      },
      updatedAt: new Date().toISOString()
    });
  };

  const handleGenerateChapters = async (chapters: any[]) => {
    if (!currentProject || !user?.id) return;

    setIsGenerating(true);
    
    try {
      // No need to insert into database here - the backend stream-chapters-enhanced function already does this
      // Just update the local project state with the generated chapters
      const updatedProject = {
        ...currentProject,
        chapters: chapters.map((chapter, index) => ({
          id: `chapter-${index}`,
          title: chapter.title || `Chapter ${index + 1}`,
          content: chapter.content || "",
          order: index
        })),
        updatedAt: new Date().toISOString()
      };

      setCurrentProject(updatedProject);
      
      toast({
        title: "Chapters Generated!",
        description: `Successfully created ${chapters.length} chapters for your ebook.`,
      });
    } catch (error) {
      console.error('Error updating project:', error);
      toast({
        title: "Update Failed",
        description: "Chapters generated but couldn't update project. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getDesignPreviewStyles = (): React.CSSProperties => {
    if (!currentProject) return {};
    
    const { designSettings } = currentProject;
    
    return {
      fontFamily: designSettings.fontFamily === 'serif' ? 'Georgia, serif' : 
                  designSettings.fontFamily === 'sans-serif' ? 'Arial, sans-serif' : 
                  'Monaco, monospace',
      fontSize: `${designSettings.fontSize}px`,
      lineHeight: designSettings.lineHeight,
      letterSpacing: `${designSettings.letterSpacing}em`,
      textAlign: designSettings.textAlignment as any,
      color: designSettings.textColor || '#374151',
      marginTop: `${designSettings.marginTop}px`,
      marginBottom: `${designSettings.marginBottom}px`,
      marginLeft: `${designSettings.marginLeft}px`,
      marginRight: `${designSettings.marginRight}px`,
      padding: '20px',
      backgroundColor: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: '8px'
    };
  };

  const getColorSchemeColors = (scheme: string) => {
    switch (scheme) {
      case 'purple-pink':
        return { primary: '#8B5CF6', secondary: '#EC4899' };
      case 'blue-green':
        return { primary: '#3B82F6', secondary: '#10B981' };
      case 'orange-red':
        return { primary: '#F97316', secondary: '#EF4444' };
      case 'monochrome':
        return { primary: '#374151', secondary: '#6B7280' };
      default:
        return { primary: '#8B5CF6', secondary: '#EC4899' };
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white py-12 px-4 relative overflow-hidden">
        <SparkleEffect />
        <BackgroundImages />

        <div className="max-w-4xl mx-auto space-y-8 relative z-10">
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="h-8 w-8 text-purple-500" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Ebook Builder
              </h1>
              <Sparkles className="h-8 w-8 text-purple-500" />
            </div>
            <p className="text-xl text-gray-700 max-w-2xl mx-auto">
              Create, design, and publish your own ebooks with our powerful AI-powered builder
            </p>
          </div>

          <Card className="bg-white/90 backdrop-blur-lg border border-gray-200 shadow-xl">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                Sign In to Access Ebook Builder
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
                    Sign In to Start Building
                  </Button>
                }
              />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
            <div className="min-h-screen bg-white py-12 px-4 relative overflow-hidden">
      <SparkleEffect />
      <BackgroundImages />

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Ebook Builder
            </h1>
            <p className="text-gray-600 mt-2">
              Create, design, and publish your own ebooks
            </p>
          </div>
          {currentProject && (
            <div className="flex items-center gap-4">
              <Badge variant={currentProject.status === 'published' ? 'default' : 'secondary'}>
                {currentProject.status === 'published' ? 'Published' : 'Draft'}
              </Badge>
              <Button variant="outline" size="sm">
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
          )}
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="design">Design</TabsTrigger>
            <TabsTrigger value="editor">Editor</TabsTrigger>
            <TabsTrigger value="images">Images</TabsTrigger>
            <TabsTrigger value="publish">Publish</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {!currentProject ? (
              <Card className="bg-white/90 backdrop-blur-lg border border-gray-200 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Create New Ebook Project
                  </CardTitle>
                  <CardDescription>
                    Start building your ebook by filling out the basic information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="title">Ebook Title *</Label>
                      <Input
                        id="title"
                        placeholder="Enter your ebook title"
                        value={projectForm.title}
                        onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="genre">Genre</Label>
                      <Select value={projectForm.genre} onValueChange={(value) => setProjectForm({ ...projectForm, genre: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select genre" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fiction">Fiction</SelectItem>
                          <SelectItem value="non-fiction">Non-Fiction</SelectItem>
                          <SelectItem value="self-help">Self-Help</SelectItem>
                          <SelectItem value="business">Business</SelectItem>
                          <SelectItem value="romance">Romance</SelectItem>
                          <SelectItem value="mystery">Mystery</SelectItem>
                          <SelectItem value="sci-fi">Science Fiction</SelectItem>
                          <SelectItem value="fantasy">Fantasy</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe your ebook and what readers will learn..."
                      value={projectForm.description}
                      onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="targetAudience">Target Audience</Label>
                    <Input
                      id="targetAudience"
                      placeholder="e.g., Young adults, Business professionals, etc."
                      value={projectForm.targetAudience}
                      onChange={(e) => setProjectForm({ ...projectForm, targetAudience: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="coverImage">Cover Image URL (Optional)</Label>
                    <Input
                      id="coverImage"
                      placeholder="https://example.com/cover-image.jpg"
                      value={projectForm.coverImage}
                      onChange={(e) => setProjectForm({ ...projectForm, coverImage: e.target.value })}
                    />
                  </div>

                  <Button 
                    onClick={handleCreateProject}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Ebook Project
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-white/90 backdrop-blur-lg border border-gray-200 shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      Project Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Title</Label>
                      <p className="text-lg font-semibold">{currentProject.title}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Genre</Label>
                      <Badge variant="outline">{currentProject.genre || 'Not specified'}</Badge>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Description</Label>
                      <p className="text-gray-600">{currentProject.description}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Chapters</Label>
                      <p className="text-lg font-semibold">{currentProject.chapters.length} chapters</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/90 backdrop-blur-lg border border-gray-200 shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5" />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button 
                      onClick={() => setActiveTab("design")}
                      className="w-full"
                    >
                      <Palette className="h-4 w-4 mr-2" />
                      Customize Design
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => setActiveTab("editor")}
                      className="w-full"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Generate Content
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => setActiveTab("publish")}
                      className="w-full"
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Publish Ebook
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Design Tab - Now comes second */}
          <TabsContent value="design" className="space-y-6">
            {currentProject ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Design Controls */}
                <Card className="bg-white/90 backdrop-blur-lg border border-gray-200 shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="h-5 w-5" />
                      Design Customization
                    </CardTitle>
                    <CardDescription>
                      Customize the look and feel of your ebook
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    {/* Typography Section */}
                    <div className="space-y-4">
                      <h3 className="font-semibold flex items-center gap-2 text-lg">
                        <Type className="h-5 w-5" />
                        Typography
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Font Family</Label>
                          <Select 
                            value={currentProject.designSettings.fontFamily} 
                            onValueChange={(value: any) => updateDesignSetting('fontFamily', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="serif">Serif (Georgia)</SelectItem>
                              <SelectItem value="sans-serif">Sans Serif (Arial)</SelectItem>
                              <SelectItem value="monospace">Monospace (Monaco)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Text Alignment</Label>
                          <Select 
                            value={currentProject.designSettings.textAlignment} 
                            onValueChange={(value: any) => updateDesignSetting('textAlignment', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="left">
                                <div className="flex items-center gap-2">
                                  <AlignLeft className="h-4 w-4" />
                                  Left
                                </div>
                              </SelectItem>
                              <SelectItem value="center">
                                <div className="flex items-center gap-2">
                                  <AlignCenter className="h-4 w-4" />
                                  Center
                                </div>
                              </SelectItem>
                              <SelectItem value="justify">
                                <div className="flex items-center gap-2">
                                  <AlignJustify className="h-4 w-4" />
                                  Justify
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Font Size: {currentProject.designSettings.fontSize}px</Label>
                          <Slider
                            value={[currentProject.designSettings.fontSize]}
                            onValueChange={([value]) => updateDesignSetting('fontSize', value)}
                            min={12}
                            max={20}
                            step={1}
                            className="w-full"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Line Height: {currentProject.designSettings.lineHeight}</Label>
                          <Slider
                            value={[currentProject.designSettings.lineHeight]}
                            onValueChange={([value]) => updateDesignSetting('lineHeight', value)}
                            min={1.2}
                            max={2.0}
                            step={0.1}
                            className="w-full"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Letter Spacing: {currentProject.designSettings.letterSpacing}em</Label>
                          <Slider
                            value={[currentProject.designSettings.letterSpacing]}
                            onValueChange={([value]) => updateDesignSetting('letterSpacing', value)}
                            min={-0.05}
                            max={0.1}
                            step={0.01}
                            className="w-full"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Chapter Heading Color</Label>
                          <div className="flex items-center gap-3">
                            <input
                              type="color"
                              value={currentProject.designSettings.chapterHeadingColor || '#8B5CF6'}
                              onChange={(e) => updateDesignSetting('chapterHeadingColor', e.target.value)}
                              className="w-12 h-8 rounded border border-gray-300 cursor-pointer"
                            />
                            <Input
                              value={currentProject.designSettings.chapterHeadingColor || '#8B5CF6'}
                              onChange={(e) => updateDesignSetting('chapterHeadingColor', e.target.value)}
                              placeholder="#8B5CF6"
                              className="flex-1"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Text Color</Label>
                          <div className="flex items-center gap-3">
                            <input
                              type="color"
                              value={currentProject.designSettings.textColor}
                              onChange={(e) => updateDesignSetting('textColor', e.target.value)}
                              className="w-12 h-8 rounded border border-gray-300 cursor-pointer"
                            />
                            <Input
                              value={currentProject.designSettings.textColor}
                              onChange={(e) => updateDesignSetting('textColor', e.target.value)}
                              placeholder="#374151"
                              className="flex-1"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Layout Section */}
                    <div className="space-y-4">
                      <h3 className="font-semibold flex items-center gap-2 text-lg">
                        <Layout className="h-5 w-5" />
                        Layout & Spacing
                      </h3>
                      


                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Top Margin: {currentProject.designSettings.marginTop}px</Label>
                          <Slider
                            value={[currentProject.designSettings.marginTop]}
                            onValueChange={([value]) => updateDesignSetting('marginTop', value)}
                            min={20}
                            max={80}
                            step={5}
                            className="w-full"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Bottom Margin: {currentProject.designSettings.marginBottom}px</Label>
                          <Slider
                            value={[currentProject.designSettings.marginBottom]}
                            onValueChange={([value]) => updateDesignSetting('marginBottom', value)}
                            min={20}
                            max={80}
                            step={5}
                            className="w-full"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Left Margin: {currentProject.designSettings.marginLeft}px</Label>
                          <Slider
                            value={[currentProject.designSettings.marginLeft]}
                            onValueChange={([value]) => updateDesignSetting('marginLeft', value)}
                            min={20}
                            max={100}
                            step={5}
                            className="w-full"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Right Margin: {currentProject.designSettings.marginRight}px</Label>
                          <Slider
                            value={[currentProject.designSettings.marginRight]}
                            onValueChange={([value]) => updateDesignSetting('marginRight', value)}
                            min={20}
                            max={100}
                            step={5}
                            className="w-full"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Chapter Title Size: {currentProject.designSettings.chapterTitleSize}px</Label>
                        <Slider
                          value={[currentProject.designSettings.chapterTitleSize]}
                          onValueChange={([value]) => updateDesignSetting('chapterTitleSize', value)}
                          min={24}
                          max={36}
                          step={2}
                          className="w-full"
                        />
                      </div>
                    </div>



                    <div className="pt-6 border-t">
                      <Button 
                        onClick={() => setActiveTab("editor")}
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Continue to Content Generation
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Live Preview */}
                <Card className="bg-white/90 backdrop-blur-lg border border-gray-200 shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="h-5 w-5" />
                      Live Preview
                    </CardTitle>
                    <CardDescription>
                      See how your design choices will look in the final ebook
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-100 p-4 rounded-lg">
                      <div style={getDesignPreviewStyles()}>
                        <h1 style={{ 
                          fontSize: `${currentProject.designSettings.chapterTitleSize}px`,
                          fontWeight: 'bold',
                          marginBottom: `${currentProject.designSettings.chapterSpacing}px`,
                          color: currentProject.designSettings.chapterHeadingColor || '#8B5CF6'
                        }}>
                          Chapter 1: The Beginning
                        </h1>
                        
                        <p style={{ 
                          marginBottom: `${currentProject.designSettings.paragraphSpacing}px`,
                          color: currentProject.designSettings.textColor
                        }}>
                          This is a sample paragraph showing how your text will appear with the current design settings. 
                          You can see the font family, size, line height, and spacing in action.
                        </p>
                        
                        <p style={{ 
                          marginBottom: `${currentProject.designSettings.paragraphSpacing}px`,
                          color: currentProject.designSettings.textColor
                        }}>
                          The quick brown fox jumps over the lazy dog. This sentence contains all the letters 
                          of the alphabet and helps you see how the typography looks with different characters.
                        </p>
                        
                        <p style={{ color: currentProject.designSettings.textColor }}>
                          Your ebook will use these exact settings when generated, ensuring a professional 
                          and consistent reading experience for your audience.
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-700">
                        <strong>Design Summary:</strong> {currentProject.designSettings.fontFamily} font, 
                        {currentProject.designSettings.fontSize}px size, {currentProject.designSettings.textAlignment} aligned, 
                        {currentProject.designSettings.colorScheme} color scheme
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="bg-white/90 backdrop-blur-lg border border-gray-200 shadow-xl">
                <CardContent className="text-center py-12">
                  <Palette className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Project Selected</h3>
                  <p className="text-gray-500 mb-4">Create a new ebook project to start customizing design</p>
                  <Button onClick={() => setActiveTab("overview")}>
                    Create New Project
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Editor Tab - Now comes third */}
          <TabsContent value="editor" className="space-y-6">
            {currentProject ? (
              <Card className="bg-white/90 backdrop-blur-lg border border-gray-200 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Edit className="h-5 w-5" />
                    Ebook Content Generator
                  </CardTitle>
                  <CardDescription>
                    Generate chapters using your custom design settings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Design Settings Applied:</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-blue-700">
                      <div>
                        <strong>Font:</strong> {currentProject.designSettings.fontFamily}
                      </div>
                      <div>
                        <strong>Size:</strong> {currentProject.designSettings.fontSize}px
                      </div>
                      <div>
                        <strong>Alignment:</strong> {currentProject.designSettings.textAlignment}
                      </div>
                      <div>
                        <strong>Style:</strong> {currentProject.designSettings.coverStyle}
                      </div>
                    </div>
                  </div>
                  
                  <CreditBasedEbookGenerator
                    originalStory={currentProject.description || "Enter your story idea here and watch the AI create a multi-chapter book with perfect continuity..."}
                    useTaylorSwiftThemes={false}
                    selectedTheme="coming-of-age"
                    selectedFormat="short-story"
                    designSettings={currentProject.designSettings}
                    onChaptersGenerated={handleGenerateChapters}
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
              <Card className="bg-white/90 backdrop-blur-lg border border-gray-200 shadow-xl">
                <CardContent className="text-center py-12">
                  <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Project Selected</h3>
                  <p className="text-gray-500 mb-4">Create a new ebook project to start editing</p>
                  <Button onClick={() => setActiveTab("overview")}>
                    Create New Project
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Images Tab */}
          <TabsContent value="images" className="space-y-6">
            {currentProject ? (
              <div className="space-y-6">
                {/* Cover Image Generation */}
                <Card className="bg-white/90 backdrop-blur-lg border border-gray-200 shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Image className="h-5 w-5" />
                      Book Cover
                    </CardTitle>
                    <CardDescription>
                      Generate a professional cover image for your ebook
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <CoverImageGenerator
                      storyText={currentProject.chapters?.map(ch => ch.content).join('\n\n') || ''}
                      bookTitle={currentProject.title}
                      authorName={user?.name || 'Anonymous'}
                      genre={currentProject.genre}
                      onImageGenerated={handleCoverImageGenerated}
                      onError={handleImageError}
                    />
                  </CardContent>
                </Card>

                {/* Chapter Images Generation */}
                {currentProject.chapters && currentProject.chapters.length > 0 && (
                  <Card className="bg-white/90 backdrop-blur-lg border border-gray-200 shadow-xl">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        Chapter Illustrations
                      </CardTitle>
                      <CardDescription>
                        Add custom illustrations to enhance each chapter
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChapterImageGenerator
                        chapters={currentProject.chapters.map(chapter => ({
                          ...chapter,
                          imageUrl: chapterImages[chapter.id]?.url,
                          imagePrompt: chapterImages[chapter.id]?.prompt
                        }))}
                        onChapterImageGenerated={handleChapterImageGenerated}
                        onError={handleImageError}
                        bookTitle={currentProject.title}
                        genre={currentProject.genre}
                      />
                    </CardContent>
                  </Card>
                )}

                {/* Image Summary */}
                <Card className="bg-white/90 backdrop-blur-lg border border-gray-200 shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="h-5 w-5" />
                      Image Summary
                    </CardTitle>
                    <CardDescription>
                      Overview of all generated images for your ebook
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Cover Image Summary */}
                      <div className="space-y-2">
                        <Label className="font-medium">Cover Image</Label>
                        {coverImage ? (
                          <div className="space-y-2">
                            <img
                              src={coverImage}
                              alt="Book cover"
                              className="w-full max-w-xs rounded-lg shadow-md"
                            />
                            <Badge variant="default" className="bg-green-100 text-green-700">
                              Generated
                            </Badge>
                          </div>
                        ) : (
                          <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg text-center">
                            <Image className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                            <p className="text-sm text-gray-500">No cover image generated</p>
                          </div>
                        )}
                      </div>

                      {/* Chapter Images Summary */}
                      <div className="space-y-2">
                        <Label className="font-medium">Chapter Images</Label>
                        <div className="space-y-2">
                          <p className="text-sm text-gray-600">
                            {Object.keys(chapterImages).length} of {currentProject.chapters?.length || 0} chapters have images
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {currentProject.chapters?.map((chapter, index) => (
                              <Badge
                                key={chapter.id}
                                variant={chapterImages[chapter.id] ? "default" : "outline"}
                                className={chapterImages[chapter.id] ? "bg-green-100 text-green-700" : ""}
                              >
                                Ch. {index + 1}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="bg-white/90 backdrop-blur-lg border border-gray-200 shadow-xl">
                <CardContent className="text-center py-12">
                  <Image className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Project Selected</h3>
                  <p className="text-gray-500 mb-4">Create a new ebook project to generate images</p>
                  <Button onClick={() => setActiveTab("overview")}>
                    Create New Project
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Publish Tab */}
          <TabsContent value="publish" className="space-y-6">
            {generatedEbookId ? (
              <EbookPublishDemo ebookId={generatedEbookId} />
            ) : (
              <Card className="bg-white/90 backdrop-blur-lg border border-gray-200 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Share2 className="h-5 w-5" />
                    Publish Your Ebook
                  </CardTitle>
                  <CardDescription>
                    Generate your ebook content first to access the publish preview
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center py-8">
                    <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Content Generated Yet</h3>
                    <p className="text-gray-600 mb-6">
                      Generate your ebook content in the "Generate" tab first, then return here to preview and publish your complete book with cover and chapter images.
                    </p>
                    <Button 
                      onClick={() => setActiveTab("generate")}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Generate Content
                    </Button>
                  </div>
                  
                  <div className="border-t pt-6">
                    <h3 className="font-semibold mb-4">What you'll get in the publish preview:</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Eye className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">Complete Book Preview</h4>
                          <p className="text-sm text-gray-600">See your entire ebook with cover and chapter images</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-pink-100 rounded-lg">
                          <Image className="w-4 h-4 text-pink-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">Image Generation</h4>
                          <p className="text-sm text-gray-600">Generate cover and chapter illustrations with DALL-E</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Download className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">Export Options</h4>
                          <p className="text-sm text-gray-600">Download as PDF, EPUB, or share online</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Share2 className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">Share & Publish</h4>
                          <p className="text-sm text-gray-600">Share preview links or publish to platforms</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default EbookBuilder; 