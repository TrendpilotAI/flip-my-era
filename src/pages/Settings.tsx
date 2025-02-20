
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Settings = () => {
  const [deepseekKey, setDeepseekKey] = useState("");
  const [runwareKey, setRunwareKey] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const { data, error } = await supabase
      .from('api_settings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (data) {
      setDeepseekKey(data.deepseek_api_key || '');
      setRunwareKey(data.runware_api_key || '');
      
      // Store in localStorage for immediate use
      if (data.deepseek_api_key) localStorage.setItem('DEEPSEEK_API_KEY', data.deepseek_api_key);
      if (data.runware_api_key) localStorage.setItem('RUNWARE_API_KEY', data.runware_api_key);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('api_settings')
        .insert({
          deepseek_api_key: deepseekKey,
          runware_api_key: runwareKey
        });

      if (error) throw error;

      // Update localStorage
      localStorage.setItem('DEEPSEEK_API_KEY', deepseekKey);
      localStorage.setItem('RUNWARE_API_KEY', runwareKey);

      toast({
        title: "Settings Saved",
        description: "Your API keys have been saved successfully.",
      });
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
        <div className="bg-white/95 backdrop-blur-lg rounded-2xl p-8 space-y-6">
          <h1 className="text-3xl font-bold text-gray-900">API Settings</h1>
          <p className="text-gray-600">
            Configure your API keys for story generation and image creation.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                DeepSeek API Key
              </label>
              <Input
                type="password"
                value={deepseekKey}
                onChange={(e) => setDeepseekKey(e.target.value)}
                placeholder="Enter your DeepSeek API key"
              />
              <a
                href="https://deepseek.com/api"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-500 hover:underline mt-1 block"
              >
                Get your DeepSeek API key
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
  );
};

export default Settings;
