import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shared/components/ui/card';
import { Button } from '@/modules/shared/components/ui/button';
import { Input } from '@/modules/shared/components/ui/input';
import { Label } from '@/modules/shared/components/ui/label';
import { Badge } from '@/modules/shared/components/ui/badge';
import { Switch } from '@/modules/shared/components/ui/switch';
import { Textarea } from '@/modules/shared/components/ui/textarea';
import { useToast } from '@/modules/shared/hooks/use-toast';
import AdminNav from '@/modules/shared/components/AdminNav';
import { 
  ArrowLeft, 
  Key, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Save,
  TestTube,
  RefreshCw
} from "lucide-react";

interface IntegrationStatus {
  groq: {
    status: 'active' | 'inactive' | 'error';
    lastTested: string;
    callsToday: number;
    errorMessage?: string;
  };
  openai: {
    status: 'active' | 'inactive' | 'error';
    lastTested: string;
    callsToday: number;
    errorMessage?: string;
  };
}

const AdminIntegrations = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showKeys, setShowKeys] = useState(false);
  
  // API Keys (in production, these would be fetched from secure storage)
  const [groqApiKey, setGroqApiKey] = useState(import.meta.env.VITE_GROQ_API_KEY || '');
  const [openaiApiKey, setOpenaiApiKey] = useState(import.meta.env.VITE_OPENAI_API_KEY || '');
  
  // Integration status
  const [integrationStatus, setIntegrationStatus] = useState<IntegrationStatus>({
    groq: {
      status: 'active',
      lastTested: new Date().toISOString(),
      callsToday: 1234
    },
    openai: {
      status: 'active',
      lastTested: new Date().toISOString(),
      callsToday: 567
    }
  });

  // Settings
  const [settings, setSettings] = useState({
    enableGroq: true,
    enableOpenAI: true,
    fallbackToOpenAI: true,
    maxRetries: 3,
    rateLimitPerMinute: 60
  });

  const testIntegration = async (provider: 'groq' | 'openai') => {
    setIsLoading(true);
    
    try {
      // Simulate API test
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const success = Math.random() > 0.2; // 80% success rate for demo
      
      if (success) {
        setIntegrationStatus(prev => ({
          ...prev,
          [provider]: {
            ...prev[provider],
            status: 'active',
            lastTested: new Date().toISOString(),
            errorMessage: undefined
          }
        }));
        
        toast({
          title: `${provider.toUpperCase()} Integration Test`,
          description: "Connection successful!",
        });
      } else {
        setIntegrationStatus(prev => ({
          ...prev,
          [provider]: {
            ...prev[provider],
            status: 'error',
            lastTested: new Date().toISOString(),
            errorMessage: 'Invalid API key or network error'
          }
        }));
        
        toast({
          title: `${provider.toUpperCase()} Integration Test`,
          description: "Connection failed. Please check your API key.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Test Failed",
        description: "An error occurred while testing the integration.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    setIsLoading(true);
    
    try {
      // Simulate saving to backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Settings Saved",
        description: "Your integration settings have been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'inactive':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-500">Active</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />
      <div className="container max-w-6xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/admin')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex items-center gap-3">
            <Key className="h-8 w-8 text-blue-500" />
            <h1 className="text-3xl font-bold">API Integrations</h1>
          </div>
          <p className="text-gray-600 mt-2">
            Manage your AI service integrations and API keys
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Groq Integration */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-xl font-bold">Groq Integration</span>
                    {getStatusIcon(integrationStatus.groq.status)}
                  </CardTitle>
                  <CardDescription>
                    LLM API for story generation and content creation
                  </CardDescription>
                </div>
                {getStatusBadge(integrationStatus.groq.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="groq-api-key">API Key</Label>
                <div className="relative">
                  <Input
                    id="groq-api-key"
                    type={showKeys ? "text" : "password"}
                    value={groqApiKey}
                    onChange={(e) => setGroqApiKey(e.target.value)}
                    placeholder="gsk_..."
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowKeys(!showKeys)}
                  >
                    {showKeys ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Calls Today:</span>
                  <div className="font-semibold">{integrationStatus.groq.callsToday}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Last Tested:</span>
                  <div className="font-semibold">
                    {new Date(integrationStatus.groq.lastTested).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {integrationStatus.groq.errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{integrationStatus.groq.errorMessage}</p>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={() => testIntegration('groq')}
                  disabled={isLoading}
                  variant="outline"
                  size="sm"
                >
                  <TestTube className="h-4 w-4 mr-2" />
                  Test Connection
                </Button>
                <Button
                  onClick={saveSettings}
                  disabled={isLoading}
                  size="sm"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* OpenAI Integration */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-xl font-bold">OpenAI Integration</span>
                    {getStatusIcon(integrationStatus.openai.status)}
                  </CardTitle>
                  <CardDescription>
                    Image generation and backup LLM services
                  </CardDescription>
                </div>
                {getStatusBadge(integrationStatus.openai.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="openai-api-key">API Key</Label>
                <div className="relative">
                  <Input
                    id="openai-api-key"
                    type={showKeys ? "text" : "password"}
                    value={openaiApiKey}
                    onChange={(e) => setOpenaiApiKey(e.target.value)}
                    placeholder="sk-..."
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowKeys(!showKeys)}
                  >
                    {showKeys ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Calls Today:</span>
                  <div className="font-semibold">{integrationStatus.openai.callsToday}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Last Tested:</span>
                  <div className="font-semibold">
                    {new Date(integrationStatus.openai.lastTested).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {integrationStatus.openai.errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{integrationStatus.openai.errorMessage}</p>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={() => testIntegration('openai')}
                  disabled={isLoading}
                  variant="outline"
                  size="sm"
                >
                  <TestTube className="h-4 w-4 mr-2" />
                  Test Connection
                </Button>
                <Button
                  onClick={saveSettings}
                  disabled={isLoading}
                  size="sm"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Integration Settings */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Integration Settings</CardTitle>
            <CardDescription>
              Configure how your integrations work together
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enable-groq">Enable Groq</Label>
                    <p className="text-sm text-muted-foreground">
                      Use Groq for primary LLM operations
                    </p>
                  </div>
                  <Switch
                    id="enable-groq"
                    checked={settings.enableGroq}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enableGroq: checked }))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enable-openai">Enable OpenAI</Label>
                    <p className="text-sm text-muted-foreground">
                      Use OpenAI for image generation
                    </p>
                  </div>
                  <Switch
                    id="enable-openai"
                    checked={settings.enableOpenAI}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enableOpenAI: checked }))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="fallback">Fallback to OpenAI</Label>
                    <p className="text-sm text-muted-foreground">
                      Use OpenAI if Groq fails
                    </p>
                  </div>
                  <Switch
                    id="fallback"
                    checked={settings.fallbackToOpenAI}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, fallbackToOpenAI: checked }))}
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="max-retries">Max Retries</Label>
                  <Input
                    id="max-retries"
                    type="number"
                    value={settings.maxRetries}
                    onChange={(e) => setSettings(prev => ({ ...prev, maxRetries: parseInt(e.target.value) }))}
                    min="1"
                    max="10"
                  />
                </div>
                
                <div>
                  <Label htmlFor="rate-limit">Rate Limit (per minute)</Label>
                  <Input
                    id="rate-limit"
                    type="number"
                    value={settings.rateLimitPerMinute}
                    onChange={(e) => setSettings(prev => ({ ...prev, rateLimitPerMinute: parseInt(e.target.value) }))}
                    min="1"
                    max="1000"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button onClick={saveSettings} disabled={isLoading}>
                <Save className="h-4 w-4 mr-2" />
                Save All Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminIntegrations; 