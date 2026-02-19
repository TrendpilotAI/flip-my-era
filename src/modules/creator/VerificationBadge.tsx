import { useState, useEffect } from 'react';
import { supabase } from '@/core/integrations/supabase/client';

interface VerificationBadgeProps {
  userId: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Check if a creator is verified: 5+ ebooks AND account age > 30 days.
 */
export async function isCreatorVerified(userId: string): Promise<boolean> {
  try {
    // Check ebook count
    const { count, error: countError } = await supabase
      .from('ebooks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (countError || (count ?? 0) < 5) return false;

    // Check account age (look at earliest ebook or user profile)
    const { data: profile } = await supabase
      .from('profiles')
      .select('created_at')
      .eq('id', userId)
      .single();

    if (!profile?.created_at) return false;

    const accountAge = Date.now() - new Date(profile.created_at).getTime();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    return accountAge > thirtyDays;
  } catch {
    return false;
  }
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
};

export const VerificationBadge = ({ userId, size = 'md', className = '' }: VerificationBadgeProps) => {
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    isCreatorVerified(userId).then(setVerified);
  }, [userId]);

  if (!verified) return null;

  return (
    <span title="Verified Creator" className={`inline-flex items-center ${className}`}>
      <svg
        className={`${sizeClasses[size]} text-blue-500`}
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    </span>
  );
};

export default VerificationBadge;
