import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '@/modules/shared/contexts/ThemeContext';

interface ThemeGuardProps {
  children: React.ReactNode;
}

export const ThemeGuard = ({ children }: ThemeGuardProps) => {
  const { isThemeSet } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Don't redirect if user is already on survey page or it's an admin/auth route
    // Also allow access to dashboard and past-generations even without theme set
    if (
      !isThemeSet && 
      location.pathname !== '/survey' && 
      !location.pathname.startsWith('/admin') &&
      !location.pathname.startsWith('/auth') &&
      location.pathname !== '/reset-password' &&
      location.pathname !== '/dashboard' &&
      location.pathname !== '/past-generations' &&
      !location.pathname.startsWith('/ebook/')
    ) {
      navigate('/survey', { replace: true });
    }
  }, [isThemeSet, location.pathname, navigate]);

  // If theme is not set and not on survey page, show loading or redirect
  // But allow dashboard and past-generations to render
  if (!isThemeSet && 
      location.pathname !== '/survey' && 
      !location.pathname.startsWith('/admin') && 
      !location.pathname.startsWith('/auth') && 
      location.pathname !== '/reset-password' &&
      location.pathname !== '/dashboard' &&
      location.pathname !== '/past-generations' &&
      !location.pathname.startsWith('/ebook/')) {
    return null; // or a loading spinner
  }

  return <>{children}</>;
};