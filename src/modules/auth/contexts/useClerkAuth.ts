import { useContext } from 'react';
import { AuthContext } from './AuthContext';

export const useClerkAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useClerkAuth must be used within a ClerkAuthProvider');
  }
  return context;
};
