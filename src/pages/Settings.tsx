
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Settings = () => {
  const [groqKey, setGroqKey] = useState("");
  const [runwareKey, setRunwareKey] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
    loadSettings();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/');
      toast({
        title: "Access Denied",
        description: "You must be an administrator to access settings.",
        variant: "destructive",
      });
    }
  };

  const loadSettings = async () => {
    const { data, error } = await supabase
      .from('api_settings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (data) {
      setGroqKey(data.groq_api_key || '');
      setRunwareKey(data.runware_api_key || '');
      
      // Store in localStorage for immediate use
      if (data.groq_api_key) localStorage.setItem('GROQ_API_KEY', data.groq_api_key);
      if (data.runware_api_key) localStorage.setItem('RUNWARE_API_KEY', data.runware_api_key);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('api_settings')
        .insert({
          groq_api_key: groqKey,
          runware_api_key: runwareKey
        });

      if (error) throw error;

      // Update localStorage
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
            Configure global API settings for story generation and image creation.
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
                Get your Groq API key
              </a>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Runware API Key
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
