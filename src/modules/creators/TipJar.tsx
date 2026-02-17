import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/modules/shared/components/ui/card';
import { Heart, DollarSign, Send, Clock } from 'lucide-react';
import { supabase } from '@/core/integrations/supabase/client';
import { useClerkAuth } from '@/modules/auth/contexts';
import { TIP_PRESETS, type Tip } from './types';

interface TipJarProps {
  creatorId: string;
  creatorName: string;
}

export const TipJar = ({ creatorId, creatorName }: TipJarProps) => {
  const { user } = useClerkAuth();
  const [amount, setAmount] = useState<number>(5);
  const [customAmount, setCustomAmount] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [tipHistory, setTipHistory] = useState<Tip[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCustom = !TIP_PRESETS.includes(amount as 1 | 5 | 10);

  useEffect(() => {
    loadTipHistory();
  }, [creatorId]);

  const loadTipHistory = async () => {
    try {
      const { data } = await supabase
        .from('tips')
        .select('*')
        .eq('to_creator_id', creatorId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (data) {
        setTipHistory(
          data.map((t: Record<string, unknown>) => ({
            id: t.id as string,
            fromUserId: t.from_user_id as string,
            fromName: (t.from_name as string) ?? 'Anonymous',
            toCreatorId: t.to_creator_id as string,
            amount: t.amount as number,
            message: t.message as string | undefined,
            createdAt: t.created_at as string,
          }))
        );
      }
    } catch {
      // Tips table may not exist yet — silently fail
    }
  };

  const handleSendTip = useCallback(async () => {
    if (!user) {
      setError('Please sign in to send a tip');
      return;
    }
    if (amount <= 0 || amount > 999) {
      setError('Please enter a valid amount ($1-$999)');
      return;
    }
    if (user.id === creatorId) {
      setError("You can't tip yourself");
      return;
    }

    setSending(true);
    setError(null);

    try {
      const { error: insertError } = await supabase.from('tips').insert({
        from_user_id: user.id,
        from_name: user.fullName ?? user.username ?? 'Anonymous',
        to_creator_id: creatorId,
        amount,
        message: message.trim() || null,
      });

      if (insertError) throw insertError;

      setSent(true);
      setMessage('');
      setTimeout(() => setSent(false), 3000);
      loadTipHistory();
    } catch (err) {
      setError('Failed to send tip. Please try again.');
      console.error('Tip error:', err);
    } finally {
      setSending(false);
    }
  }, [user, amount, message, creatorId]);

  const selectPreset = (preset: number) => {
    setAmount(preset);
    setCustomAmount('');
  };

  const handleCustomChange = (val: string) => {
    setCustomAmount(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) setAmount(num);
  };

  return (
    <Card className="border-pink-200 dark:border-pink-800">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Heart className="w-5 h-5 text-pink-500" />
          Support {creatorName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Preset amounts */}
        <div className="flex gap-2">
          {TIP_PRESETS.map((preset) => (
            <button
              key={preset}
              onClick={() => selectPreset(preset)}
              className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                amount === preset && !isCustom
                  ? 'bg-pink-500 text-white border-pink-500'
                  : 'border-border hover:border-pink-300'
              }`}
            >
              ${preset}
            </button>
          ))}
          <div className="flex-1 relative">
            <DollarSign className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="number"
              min="1"
              max="999"
              placeholder="Custom"
              value={customAmount}
              onChange={(e) => handleCustomChange(e.target.value)}
              className={`w-full py-2 pl-7 pr-2 rounded-lg border text-sm ${
                isCustom ? 'border-pink-500 ring-1 ring-pink-500' : 'border-border'
              }`}
            />
          </div>
        </div>

        {/* Message */}
        <textarea
          placeholder="Leave a message (optional)"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={200}
          rows={2}
          className="w-full p-2 rounded-lg border border-border text-sm resize-none"
        />

        {/* Error */}
        {error && <p className="text-sm text-red-500">{error}</p>}

        {/* Send button */}
        <button
          onClick={handleSendTip}
          disabled={sending || amount <= 0}
          className={`w-full py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors ${
            sent
              ? 'bg-green-500 text-white'
              : 'bg-pink-500 hover:bg-pink-600 text-white disabled:opacity-50'
          }`}
        >
          {sent ? (
            <>❤️ Tip Sent!</>
          ) : sending ? (
            <>Sending...</>
          ) : (
            <>
              <Send className="w-4 h-4" /> Send ${amount.toFixed(2)} Tip
            </>
          )}
        </button>

        {/* Tip History Toggle */}
        {tipHistory.length > 0 && (
          <div>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <Clock className="w-3 h-3" />
              {showHistory ? 'Hide' : 'Show'} Recent Tips ({tipHistory.length})
            </button>

            {showHistory && (
              <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                {tipHistory.map((tip) => (
                  <div key={tip.id} className="flex items-start justify-between p-2 rounded bg-muted/50 text-sm">
                    <div>
                      <span className="font-medium">{tip.fromName}</span>
                      <span className="text-muted-foreground"> tipped ${tip.amount.toFixed(2)}</span>
                      {tip.message && (
                        <p className="text-xs text-muted-foreground mt-0.5">"{tip.message}"</p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(tip.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TipJar;
