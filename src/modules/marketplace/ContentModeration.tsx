import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/modules/shared/components/ui/card';
import { Button } from '@/modules/shared/components/ui/button';
import { Badge } from '@/modules/shared/components/ui/badge';
import { Flag, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import type { ContentFlag } from './types';

// --- Mock store (swap for Supabase in prod) ---
let flagStore: ContentFlag[] = [];

export function resetFlagStore() {
  flagStore = [];
}

export async function flagContent(
  ebookId: string,
  ebookTitle: string,
  reporterId: string,
  reporterName: string,
  reason: ContentFlag['reason'],
  details: string
): Promise<ContentFlag> {
  const flag: ContentFlag = {
    id: crypto.randomUUID?.() || Math.random().toString(36).slice(2),
    ebook_id: ebookId,
    ebook_title: ebookTitle,
    reporter_id: reporterId,
    reporter_name: reporterName,
    reason,
    details,
    status: 'pending',
    created_at: new Date().toISOString(),
  };
  flagStore.push(flag);
  return flag;
}

export async function getModQueue(): Promise<ContentFlag[]> {
  return flagStore.filter((f) => f.status === 'pending');
}

export async function getAllFlags(): Promise<ContentFlag[]> {
  return [...flagStore];
}

export async function moderateFlag(
  flagId: string,
  action: 'approved' | 'rejected' | 'warned'
): Promise<ContentFlag | null> {
  const flag = flagStore.find((f) => f.id === flagId);
  if (flag) {
    flag.status = action;
    return flag;
  }
  return null;
}

// --- Components ---

const REASON_LABELS: Record<ContentFlag['reason'], string> = {
  inappropriate: 'Inappropriate Content',
  copyright: 'Copyright Violation',
  spam: 'Spam',
  other: 'Other',
};

const STATUS_COLORS: Record<ContentFlag['status'], string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  warned: 'bg-orange-100 text-orange-800',
};

export function FlagButton({
  ebookId,
  ebookTitle,
  userId,
  userName,
  onFlagged,
}: {
  ebookId: string;
  ebookTitle: string;
  userId: string;
  userName: string;
  onFlagged?: (flag: ContentFlag) => void;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ContentFlag['reason']>('inappropriate');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!details.trim()) return;
    setSubmitting(true);
    try {
      const flag = await flagContent(ebookId, ebookTitle, userId, userName, reason, details);
      setOpen(false);
      setDetails('');
      onFlagged?.(flag);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)} data-testid="flag-button">
        <Flag size={14} className="mr-1" /> Report
      </Button>
    );
  }

  return (
    <div className="border rounded-lg p-4 space-y-3" data-testid="flag-form">
      <h4 className="font-medium flex items-center gap-1">
        <Flag size={14} /> Report Content
      </h4>
      <select
        className="w-full border rounded p-2 text-sm"
        value={reason}
        onChange={(e) => setReason(e.target.value as ContentFlag['reason'])}
        data-testid="flag-reason"
      >
        {Object.entries(REASON_LABELS).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>
      <textarea
        className="w-full border rounded p-2 text-sm min-h-[60px]"
        placeholder="Please provide details..."
        value={details}
        onChange={(e) => setDetails(e.target.value)}
        data-testid="flag-details"
      />
      <div className="flex gap-2">
        <Button size="sm" onClick={handleSubmit} disabled={submitting || !details.trim()}>
          Submit Report
        </Button>
        <Button size="sm" variant="outline" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

export function ModerationDashboard() {
  const [flags, setFlags] = useState<ContentFlag[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFlags = useCallback(async () => {
    setLoading(true);
    const queue = await getModQueue();
    setFlags(queue);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadFlags();
  }, [loadFlags]);

  const handleAction = async (flagId: string, action: 'approved' | 'rejected' | 'warned') => {
    await moderateFlag(flagId, action);
    loadFlags();
  };

  if (loading) {
    return <div className="p-4 text-center text-muted-foreground">Loading moderation queue...</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <AlertTriangle size={20} /> Content Moderation
      </h2>
      {flags.length === 0 ? (
        <p className="text-muted-foreground">No pending flags. All clear! 🎉</p>
      ) : (
        flags.map((flag) => (
          <Card key={flag.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">{flag.ebook_title}</CardTitle>
                <Badge className={STATUS_COLORS[flag.status]}>{flag.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-xs text-muted-foreground">
                Reported by {flag.reporter_name} · {REASON_LABELS[flag.reason]}
              </div>
              <p className="text-sm">{flag.details}</p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAction(flag.id, 'approved')}
                  data-testid={`approve-${flag.id}`}
                >
                  <CheckCircle size={14} className="mr-1" /> Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAction(flag.id, 'rejected')}
                  data-testid={`reject-${flag.id}`}
                >
                  <XCircle size={14} className="mr-1" /> Reject
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAction(flag.id, 'warned')}
                  data-testid={`warn-${flag.id}`}
                >
                  <AlertTriangle size={14} className="mr-1" /> Warn
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

export default ModerationDashboard;
