import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

export const useApiCheck = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkApiKeys();
  }, []);

  const checkApiKeys = () => {
    const groqKey = localStorage.getItem('GROQ_API_KEY');
    const runwareKey = localStorage.getItem('RUNWARE_API_KEY');

    if (!groqKey) {
      toast({
        title: "API Key Recommended",
        description: "Configure your Groq API key in settings for the best experience.",
        variant: "default",
      });
      // Don't automatically redirect, let user decide
      // navigate('/settings');
    }
  };
};
