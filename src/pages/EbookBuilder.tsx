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
  Play
} from "lucide-react";
import { AuthDialog } from "@/modules/shared/components/AuthDialog";
import { useClerkAuth } from '@/modules/auth/contexts/ClerkAuthContext';
import { CreditBasedEbookGenerator } from '@/modules/ebook/components/CreditBasedEbookGenerator';
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
}

interface Chapter {
  id: string;
  title: string;
  content: string;
  order: number;
}

const EbookBuilder = () => {
  const { isAuthenticated, user, getToken } = useClerkAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [currentProject, setCurrentProject] = useState<EbookProject | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

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
      updatedAt: new Date().toISOString()
    };

    setCurrentProject(newProject);
    setActiveTab("editor");
    
    toast({
      title: "Project Created!",
      description: "Your ebook project has been created successfully.",
    });
  };

  const handleGenerateChapters = async (chapters: any[]) => {
    if (!currentProject || !user?.id) return;

    setIsGenerating(true);
    
    try {
      const token = await getToken({ template: 'supabase' });
      if (token) {
        const supabaseWithAuth = createSupabaseClientWithClerkToken(token);
        
        const { data: ebookGeneration, error } = await supabaseWithAuth
          .from('ebook_generations')
          .insert({
            user_id: user.id,
            title: currentProject.title,
            content: JSON.stringify(chapters),
            status: 'completed',
            credits_used: 1,
            paid_with_credits: true,
            story_type: 'ebook-builder',
            chapter_count: chapters.length,
            word_count: chapters.reduce((total, chapter) => total + (chapter.content?.length || 0), 0)
          })
          .select()
          .single();

        if (error) {
          throw error;
        }

        // Update current project with generated chapters
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
      }
    } catch (error) {
      console.error('Error saving ebook:', error);
      toast({
        title: "Save Failed",
        description: "Chapters generated but couldn't be saved. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-[#E5DEFF] via-[#FFDEE2] to-[#D3E4FD] py-12 px-4 relative overflow-hidden">
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

          <Card className="bg-white/90 backdrop-blur-lg border border-[#E5DEFF]/50 shadow-xl">
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
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-[#E5DEFF] via-[#FFDEE2] to-[#D3E4FD] py-12 px-4 relative overflow-hidden">
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="editor">Editor</TabsTrigger>
            <TabsTrigger value="design">Design</TabsTrigger>
            <TabsTrigger value="publish">Publish</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {!currentProject ? (
              <Card className="bg-white/90 backdrop-blur-lg border border-[#E5DEFF]/50 shadow-xl">
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
                <Card className="bg-white/90 backdrop-blur-lg border border-[#E5DEFF]/50 shadow-xl">
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

                <Card className="bg-white/90 backdrop-blur-lg border border-[#E5DEFF]/50 shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5" />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button 
                      onClick={() => setActiveTab("editor")}
                      className="w-full"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Continue Editing
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => setActiveTab("design")}
                      className="w-full"
                    >
                      <Palette className="h-4 w-4 mr-2" />
                      Customize Design
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

          {/* Editor Tab */}
          <TabsContent value="editor" className="space-y-6">
            {currentProject ? (
              <Card className="bg-white/90 backdrop-blur-lg border border-[#E5DEFF]/50 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Edit className="h-5 w-5" />
                    Ebook Editor
                  </CardTitle>
                  <CardDescription>
                    Generate chapters and edit your ebook content
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CreditBasedEbookGenerator
                    originalStory={currentProject.description || "Enter your story idea here and watch the AI create a multi-chapter book with perfect continuity..."}
                    useTaylorSwiftThemes={false}
                    selectedTheme="coming-of-age"
                    selectedFormat="short-story"
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
              <Card className="bg-white/90 backdrop-blur-lg border border-[#E5DEFF]/50 shadow-xl">
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

          {/* Design Tab */}
          <TabsContent value="design" className="space-y-6">
            <Card className="bg-white/90 backdrop-blur-lg border border-[#E5DEFF]/50 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Design Customization
                </CardTitle>
                <CardDescription>
                  Customize the look and feel of your ebook
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Type className="h-4 w-4" />
                      Typography
                    </h3>
                    <div className="space-y-2">
                      <Label>Font Family</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select font" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="serif">Serif</SelectItem>
                          <SelectItem value="sans-serif">Sans Serif</SelectItem>
                          <SelectItem value="monospace">Monospace</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Font Size</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="small">Small</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="large">Large</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Layout className="h-4 w-4" />
                      Layout
                    </h3>
                    <div className="space-y-2">
                      <Label>Page Layout</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select layout" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="single">Single Column</SelectItem>
                          <SelectItem value="double">Double Column</SelectItem>
                          <SelectItem value="magazine">Magazine Style</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Margins</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select margins" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="narrow">Narrow</SelectItem>
                          <SelectItem value="standard">Standard</SelectItem>
                          <SelectItem value="wide">Wide</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Image className="h-4 w-4" />
                      Cover Design
                    </h3>
                    <div className="space-y-2">
                      <Label>Cover Style</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select style" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="minimal">Minimal</SelectItem>
                          <SelectItem value="modern">Modern</SelectItem>
                          <SelectItem value="classic">Classic</SelectItem>
                          <SelectItem value="bold">Bold</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Color Scheme</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select colors" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="purple-pink">Purple & Pink</SelectItem>
                          <SelectItem value="blue-green">Blue & Green</SelectItem>
                          <SelectItem value="orange-red">Orange & Red</SelectItem>
                          <SelectItem value="monochrome">Monochrome</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t">
                  <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600">
                    <Eye className="h-4 w-4 mr-2" />
                    Preview Design
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Publish Tab */}
          <TabsContent value="publish" className="space-y-6">
            <Card className="bg-white/90 backdrop-blur-lg border border-[#E5DEFF]/50 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share2 className="h-5 w-5" />
                  Publish Your Ebook
                </CardTitle>
                <CardDescription>
                  Make your ebook available to readers worldwide
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold">Publishing Options</h3>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <input type="radio" id="pdf" name="format" className="text-purple-600" />
                        <Label htmlFor="pdf">PDF Format</Label>
                      </div>
                      <div className="flex items-center space-x-3">
                        <input type="radio" id="epub" name="format" className="text-purple-600" />
                        <Label htmlFor="epub">EPUB Format</Label>
                      </div>
                      <div className="flex items-center space-x-3">
                        <input type="radio" id="mobi" name="format" className="text-purple-600" />
                        <Label htmlFor="mobi">MOBI Format (Kindle)</Label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold">Distribution</h3>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <input type="checkbox" id="download" className="text-purple-600" />
                        <Label htmlFor="download">Direct Download</Label>
                      </div>
                      <div className="flex items-center space-x-3">
                        <input type="checkbox" id="share" className="text-purple-600" />
                        <Label htmlFor="share">Share Link</Label>
                      </div>
                      <div className="flex items-center space-x-3">
                        <input type="checkbox" id="embed" className="text-purple-600" />
                        <Label htmlFor="embed">Embed on Website</Label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t space-y-4">
                  <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600">
                    <Download className="h-4 w-4 mr-2" />
                    Generate Ebook Files
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share Preview Link
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default EbookBuilder; 