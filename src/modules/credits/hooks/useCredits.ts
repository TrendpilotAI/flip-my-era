/**
 * useCredits — fetches current credit balance and exposes isExhausted flag.
 * Fires a custom DOM event "credits:exhausted" when a generation is attempted
 * with zero remaining credits so sibling components can open the upsell modal.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/core/integrations/supabase/client';
import { useSupabaseAuth } from '@/core/integrations/better-auth/AuthProvider';

export interface CreditsState {
  balance: number;
  isLoading: boolean;
  isExhausted: boolean;
  subscriptionType: string | null;
  refresh: () => Promise<void>;
  /** Call before any generation attempt. Returns false and fires the exhaustion event if balance is 0. */
  checkBeforeGenerate: () => boolean;
}

export const CREDITS_EXHAUSTED_EVENT = 'credits:exhausted';

export function useCredits(): CreditsState {
  const { isSignedIn, getToken } = useSupabaseAuth();
  const [balance, setBalance] = useState(0);
  const [subscriptionType, setSubscriptionType] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!isSignedIn) {
      setIsLoading(false);
      return;
    }

    try {
      const token = await getToken();
      const { data, error } = await supabase.functions.invoke('credits', {
        method: 'GET',
        headers: token
          ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
          : { 'Content-Type': 'application/json' },
      });

      if (!error && data?.data) {
        const bal = data.data?.balance?.balance ?? 0;
        const sub = data.data?.balance?.subscription_type ?? null;
        setBalance(bal);
        setSubscriptionType(sub);
      }
    } catch (_e) {
      // Silently fail — balance remains at last known value
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn, getToken]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const isExhausted = !isLoading && balance === 0 && subscriptionType !== 'unlimited';

  const checkBeforeGenerate = useCallback((): boolean => {
    if (isExhausted) {
      window.dispatchEvent(new CustomEvent(CREDITS_EXHAUSTED_EVENT, { detail: { balance } }));
      return false;
    }
    return true;
  }, [isExhausted, balance]);

  return {
    balance,
    isLoading,
    isExhausted,
    subscriptionType,
    refresh,
    checkBeforeGenerate,
  };
}
