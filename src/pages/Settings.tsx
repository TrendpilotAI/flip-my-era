import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useClerkAuth } from "@/contexts/ClerkAuthContext";
import { ArrowLeft } from "lucide-react";

const Settings = () => {
  const [groqKey, setGroqKey] = useState("");
  const [runwareKey, setRunwareKey] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useClerkAuth();

  useEffect(() => {
    if (!isLoading) {
      checkAuth();
      loadSettings();
    }
  }, [isLoading, isAuthenticated]);

  const checkAuth = async () => {
    if (!isAuthenticated) {
      navigate('/');
      toast({
        title: "Access Denied",
        description: "You must be an administrator to access settings.",
        variant: "destructive",
      });
    }
  };

  const loadSettings = async () => {
    // Load from localStorage instead of database
    const savedGroqKey = localStorage.getItem('GROQ_API_KEY') || '';
    const savedRunwareKey = localStorage.getItem('RUNWARE_API_KEY') || '';
    
    setGroqKey(savedGroqKey);
    setRunwareKey(savedRunwareKey);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save to localStorage instead of database
      localStorage.setItem('GROQ_API_KEY', groqKey);
      localStorage.setItem('RUNWARE_API_KEY', runwareKey);

      toast({
        title: "Settings Saved",
        description: "API settings have been updated successfully.",
      });
      
      navigate('/');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    }
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          className="mb-6 text-white hover:bg-white/20"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Stories
        </Button>

        <div className="bg-white/95 backdrop-blur-lg rounded-2xl p-8 space-y-6">
          <h1 className="text-3xl font-bold text-gray-900">API Settings</h1>
          <p className="text-gray-600">
            Configure API settings for story generation and image creation. These are stored locally in your browser.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Groq API Key
              </label>
              <Input
                type="password"
                value={groqKey}
                onChange={(e) => setGroqKey(e.target.value)}
                placeholder="Enter your Groq API key"
              />
              <a
                href="https://console.groq.com/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-500 hover:underline mt-1 block"
              >
                Get your Groq API key (free tier available)
              </a>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Runware API Key (Optional)
              </label>
              <Input
                type="password"
                value={runwareKey}
                onChange={(e) => setRunwareKey(e.target.value)}
                placeholder="Enter your Runware API key"
              />
              <a
                href="https://runware.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-500 hover:underline mt-1 block"
              >
                Get your Runware API key
              </a>
            </div>
          </div>

          <div className="space-y-4">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white"
            >
              {saving ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
