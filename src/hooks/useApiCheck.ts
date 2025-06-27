import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

export const useApiCheck = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // No longer need to check API keys since they're handled via environment variables
  }, []);
};
