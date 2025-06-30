import { useState, useEffect } from "react";
import { Button } from '@/modules/shared/components/ui/button';
import { useToast } from '@/modules/shared/hooks/use-toast';
import { useNavigate } from "react-router-dom";
import { useClerkAuth } from '@/modules/auth/contexts/ClerkAuthContext';
import { ArrowLeft, CheckCircle } from "lucide-react";

const Settings = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useClerkAuth();

  useEffect(() => {
    if (!isLoading) {
      checkAuth();
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
          <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
          <p className="text-gray-600">
            API keys and services are managed by the system administrator.
          </p>

          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-6 w-6 text-green-500" />
              <div>
                <h3 className="text-lg font-semibold text-green-800">Services Ready</h3>
                <p className="text-green-700">
                  All AI services are configured and ready to use. You can start generating stories immediately.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2">Available Services</h4>
              <ul className="text-blue-700 space-y-1">
                <li>• Story Generation (Groq AI)</li>
                <li>• Image Generation (OpenAI DALL-E)</li>
                <li>• Chapter Generation</li>
                <li>• Name Transformation</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
