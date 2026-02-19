import { useState } from 'react';
import { useSupabaseAuth } from '@/core/integrations/supabase/auth';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/modules/shared/components/ui/dialog';
import { Button } from '@/modules/shared/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/shared/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shared/components/ui/card';
import { Badge } from '@/modules/shared/components/ui/badge';
import { Switch } from '@/modules/shared/components/ui/switch';
import { Label } from '@/modules/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shared/components/ui/select';
import { useToast } from '@/modules/shared/hooks/use-toast';
import { 
  Download, 
  Share2, 
  FileText, 
  BookOpen, 
  Smartphone,
  Copy,
  Check,
  Loader2,
  Instagram,
  Twitter,
  Facebook,
  Linkedin,
  MessageCircle,
  Pin,
  Music,
  Settings,
  Eye,
  Globe
} from 'lucide-react';
import { cn } from '@/core/lib/utils';

// Import our utility functions
import { 
  downloadContent, 
  downloadStory, 
  downloadEbook,
  type DownloadOptions,
  type Chapter,
  type Story
} from '@/modules/shared/utils/downloadUtils';
import { 
  shareContent, 
  shareToInstagram,
  shareToTikTok,
  shareToTwitter,
  shareToFacebook,
  shareToWhatsApp,
  shareToLinkedIn,
  shareToPinterest,
  copyToClipboard,
  nativeShare,
  type ShareContent,
  type ShareOptions
} from '@/modules/shared/utils/socialShareUtils';

interface DownloadShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: {
    id: string;
    title: string;
    content: string | Chapter[];
    type: 'story' | 'ebook';
    author?: string;
    url?: string;
    imageUrl?: string;
  };
  className?: string;
}

export const DownloadShareModal = ({ 
  isOpen, 
  onClose, 
  content, 
  className 
}: DownloadShareModalProps) => {
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'download' | 'share'>('download');
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<'pdf' | 'epub' | 'txt' | 'json'>('pdf');
  const [shareMethod, setShareMethod] = useState<'copy' | 'native' | 'direct'>('direct');
  const [copiedPlatform, setCopiedPlatform] = useState<string | null>(null);
  
  // Download options
  const [downloadOptions, setDownloadOptions] = useState<DownloadOptions>({
    format: 'pdf',
    includeMetadata: true,
    includeCoverPage: true,
    fontSize: 12,
    fontFamily: 'helvetica',
    pageSize: 'A4'
  });

  // Share options
  const [shareOptions, setShareOptions] = useState<ShareOptions>({
    platform: 'twitter',
    contentType: content.type,
    includeAttribution: true,
    customMessage: ''
  });

  const handleDownload = async (format: 'pdf' | 'epub' | 'txt' | 'json') => {
    setIsDownloading(true);
    
    try {
      const options: DownloadOptions = {
        ...downloadOptions,
        format
      };

      if (content.type === 'story') {
        const storyData: Story = {
          id: content.id,
          title: content.title,
          content: content.content as string
        };
        
        await downloadStory(storyData, options, user?.id);
      } else {
        await downloadEbook(
          content.title,
          content.content as Chapter[],
          options,
          content.id,
          user?.id
        );
      }

      toast({
        title: "Download Started",
        description: `Your ${content.type} is being downloaded as ${format.toUpperCase()}.`,
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download Failed",
        description: "There was an error downloading your content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = async (platform: string) => {
    setIsSharing(true);
    try {
      const sharePayload: ShareContent = {
        title: content.title,
        content: Array.isArray(content.content)
          ? content.content.map(ch => ch.content).join('\n\n')
          : content.content,
        url: content.url,
        imageUrl: content.imageUrl,
        author: content.author,
      };

      const options: ShareOptions = {
        ...shareOptions,
        platform: platform as ShareOptions['platform']
      };

      const result = await shareContent(sharePayload, options, {
        userId: user?.id,
        contentType: content.type,
        contentId: content.id,
        platform,
        sharedAt: new Date().toISOString(),
        shareMethod: 'direct'
      });

      if (result.success) {
        if (result.message) {
          // Show detailed instructions for platforms that need manual pasting
          toast({
            title: "Content Ready to Share!",
            description: result.message,
            duration: 8000, // Longer duration for detailed instructions
          });
        } else {
          // Standard success message for platforms with direct sharing
          toast({
            title: "Shared Successfully",
            description: `Your ${content.type} has been shared to ${platform}.`,
          });
        }
      } else {
        toast({
          title: "Share Failed",
          description: result.message || "There was an error sharing your content. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Share error:', error);
      toast({
        title: "Share Failed",
        description: "There was an error sharing your content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyToClipboard = async (platform: string) => {
    try {
      const sharePayload: ShareContent = {
        title: content.title,
        content: Array.isArray(content.content)
          ? content.content.map(ch => ch.content).join('\n\n')
          : content.content,
        url: content.url,
        imageUrl: content.imageUrl,
        author: content.author,
      };

      await copyToClipboard(sharePayload, {
        platform: platform as ShareOptions['platform'],
        contentType: content.type
      });

      setCopiedPlatform(platform);
      setTimeout(() => setCopiedPlatform(null), 2000);

      toast({
        title: "Copied to Clipboard",
        description: `${platform} content copied to clipboard.`,
      });
    } catch (error) {
      console.error('Copy error:', error);
      toast({
        title: "Copy Failed",
        description: "Failed to copy content to clipboard.",
        variant: "destructive",
      });
    }
  };

  const socialPlatforms = [
    { 
      id: 'instagram', 
      name: 'Instagram', 
      icon: Instagram, 
      color: 'bg-gradient-to-r from-purple-500 to-pink-500',
      description: 'Share to Instagram Stories or copy caption for posts'
    },
    { 
      id: 'tiktok', 
      name: 'TikTok', 
      icon: Music, 
      color: 'bg-black',
      description: 'Create TikTok content with your story'
    },
    { 
      id: 'twitter', 
      name: 'Twitter', 
      icon: Twitter, 
      color: 'bg-blue-500',
      description: 'Share as a Twitter thread or single tweet'
    },
    { 
      id: 'facebook', 
      name: 'Facebook', 
      icon: Facebook, 
      color: 'bg-blue-600',
      description: 'Share to Facebook timeline'
    },
    { 
      id: 'whatsapp', 
      name: 'WhatsApp', 
      icon: MessageCircle, 
      color: 'bg-green-500',
      description: 'Share via WhatsApp message'
    },
    { 
      id: 'linkedin', 
      name: 'LinkedIn', 
      icon: Linkedin, 
      color: 'bg-blue-700',
      description: 'Share to LinkedIn professional network'
    },
    { 
      id: 'pinterest', 
      name: 'Pinterest', 
      icon: Pin, 
      color: 'bg-red-500',
      description: 'Pin to Pinterest boards'
    }
  ];

  const downloadFormats = [
    { 
      id: 'pdf', 
      name: 'PDF', 
      icon: FileText, 
      description: 'Perfect for reading and printing',
      features: ['Professional formatting', 'Print-ready', 'Universal compatibility']
    },
    { 
      id: 'epub', 
      name: 'EPUB', 
      icon: BookOpen, 
      description: 'E-reader compatible format',
      features: ['Responsive text', 'E-reader support', 'Adjustable font size']
    },
    { 
      id: 'txt', 
      name: 'Text', 
      icon: FileText, 
      description: 'Simple plain text format',
      features: ['Universal compatibility', 'Small file size', 'Easy to edit']
    },
    { 
      id: 'json', 
      name: 'JSON', 
      icon: Settings, 
      description: 'Structured data format',
      features: ['Developer friendly', 'Structured data', 'Easy to parse']
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn("max-w-4xl max-h-[90vh] overflow-y-auto", className)}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Download & Share
          </DialogTitle>
          <DialogDescription>
            Download your {content.type} in various formats or share it on social media
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'download' | 'share')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="download" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Download
            </TabsTrigger>
            <TabsTrigger value="share" className="flex items-center gap-2">
              <Share2 className="h-4 w-4" />
              Share
            </TabsTrigger>
          </TabsList>

          <TabsContent value="download" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {downloadFormats.map((format) => {
                const Icon = format.icon;
                return (
                  <Card key={format.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="h-5 w-5 text-blue-500" />
                          <CardTitle className="text-lg">{format.name}</CardTitle>
                        </div>
                        <Badge variant="outline">{format.id.toUpperCase()}</Badge>
                      </div>
                      <CardDescription>{format.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="text-sm text-gray-600 space-y-1 mb-4">
                        {format.features.map((feature, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <Check className="h-3 w-3 text-green-500" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <Button 
                        onClick={() => handleDownload(format.id as DownloadOptions['format'])}
                        disabled={isDownloading}
                        className="w-full"
                      >
                        {isDownloading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Downloading...
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-2" />
                            Download {format.name}
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Download Options */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Download Options
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="include-metadata">Include Metadata</Label>
                    <Switch
                      id="include-metadata"
                      checked={downloadOptions.includeMetadata}
                      onCheckedChange={(checked) => 
                        setDownloadOptions(prev => ({ ...prev, includeMetadata: checked }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="include-cover">Include Cover Page</Label>
                    <Switch
                      id="include-cover"
                      checked={downloadOptions.includeCoverPage}
                      onCheckedChange={(checked) => 
                        setDownloadOptions(prev => ({ ...prev, includeCoverPage: checked }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="page-size">Page Size</Label>
                    <Select 
                      value={downloadOptions.pageSize} 
                      onValueChange={(value) => 
                        setDownloadOptions(prev => ({ ...prev, pageSize: value as DownloadOptions['pageSize'] }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A4">A4</SelectItem>
                        <SelectItem value="Letter">Letter</SelectItem>
                        <SelectItem value="A5">A5</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="font-size">Font Size</Label>
                    <Select 
                      value={downloadOptions.fontSize?.toString()} 
                      onValueChange={(value) => 
                        setDownloadOptions(prev => ({ ...prev, fontSize: parseInt(value) }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10pt</SelectItem>
                        <SelectItem value="12">12pt</SelectItem>
                        <SelectItem value="14">14pt</SelectItem>
                        <SelectItem value="16">16pt</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="share" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {socialPlatforms.map((platform) => {
                const Icon = platform.icon;
                const isCopied = copiedPlatform === platform.id;
                
                return (
                  <Card key={platform.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-lg text-white", platform.color)}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{platform.name}</CardTitle>
                          <CardDescription className="text-sm">
                            {platform.description}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => handleShare(platform.id)}
                          disabled={isSharing}
                          className="flex-1"
                          variant="outline"
                        >
                          {isSharing ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Sharing...
                            </>
                          ) : (
                            <>
                              <Globe className="h-4 w-4 mr-2" />
                              Share
                            </>
                          )}
                        </Button>
                        <Button 
                          onClick={() => handleCopyToClipboard(platform.id)}
                          variant="outline"
                          size="sm"
                        >
                          {isCopied ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Native Share */}
            {navigator.share && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5" />
                    Native Share
                  </CardTitle>
                  <CardDescription>
                    Use your device's built-in sharing options
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => handleShare('native')}
                    disabled={isSharing}
                    className="w-full"
                  >
                    {isSharing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Opening...
                      </>
                    ) : (
                      <>
                        <Share2 className="h-4 w-4 mr-2" />
                        Open Share Menu
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}; 