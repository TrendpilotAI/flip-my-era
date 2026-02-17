import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/modules/shared/components/ui/card';
import { Button } from '@/modules/shared/components/ui/button';
import { Input } from '@/modules/shared/components/ui/input';
import { Gift, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { generateGiftCard, redeemGiftCard, GiftCardStatus } from '@/modules/billing/giftCards';

// ─── Gift Card Amounts ───────────────────────────────────────

const GIFT_AMOUNTS = [
  { value: 10, label: '$10', credits: 10 },
  { value: 25, label: '$25', credits: 30 },
  { value: 50, label: '$50', credits: 65 },
  { value: 100, label: '$100', credits: 140 },
];

// ─── Purchase Flow ───────────────────────────────────────────

interface PurchaseFormData {
  amount: number;
  senderName: string;
  recipientEmail: string;
  message: string;
}

export function GiftCardPurchase() {
  const [form, setForm] = useState<PurchaseFormData>({
    amount: 25,
    senderName: '',
    recipientEmail: '',
    message: '',
  });
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePurchase = async () => {
    setError(null);
    setLoading(true);
    try {
      const code = generateGiftCard(
        form.amount,
        form.senderName,
        form.recipientEmail,
        form.message,
      );
      setGeneratedCode(code);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate gift card');
    } finally {
      setLoading(false);
    }
  };

  if (generatedCode) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            Gift Card Created!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-primary/10 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Gift Code</p>
            <p className="text-2xl font-mono font-bold tracking-wider">{generatedCode}</p>
          </div>
          <p className="text-sm text-muted-foreground">
            A gift card for <strong>${form.amount}</strong> has been sent to{' '}
            <strong>{form.recipientEmail}</strong>.
          </p>
          <Button variant="outline" className="w-full" onClick={() => {
            setGeneratedCode(null);
            setForm({ amount: 25, senderName: '', recipientEmail: '', message: '' });
          }}>
            Send Another Gift
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5" />
          Gift an Ebook Experience
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Amount Selection */}
        <div>
          <label className="text-sm font-medium mb-2 block">Select Amount</label>
          <div className="grid grid-cols-4 gap-2">
            {GIFT_AMOUNTS.map(opt => (
              <Button
                key={opt.value}
                variant={form.amount === opt.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setForm(f => ({ ...f, amount: opt.value }))}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </div>

        <Input
          placeholder="Your name"
          value={form.senderName}
          onChange={e => setForm(f => ({ ...f, senderName: e.target.value }))}
        />
        <Input
          placeholder="Recipient email"
          type="email"
          value={form.recipientEmail}
          onChange={e => setForm(f => ({ ...f, recipientEmail: e.target.value }))}
        />
        <Input
          placeholder="Personal message (optional)"
          value={form.message}
          onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
        />

        {error && (
          <div className="flex items-center gap-2 text-destructive text-sm">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        <Button
          className="w-full"
          onClick={handlePurchase}
          disabled={loading || !form.senderName || !form.recipientEmail}
        >
          <Send className="h-4 w-4 mr-2" />
          {loading ? 'Processing...' : `Purchase Gift Card — $${form.amount}`}
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Redeem Flow ─────────────────────────────────────────────

export function GiftCardRedeem() {
  const [code, setCode] = useState('');
  const [result, setResult] = useState<{ credits: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRedeem = async () => {
    setError(null);
    setLoading(true);
    try {
      const credits = redeemGiftCard(code.trim().toUpperCase());
      setResult({ credits });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to redeem gift card');
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            Gift Card Redeemed!
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-lg">
            <strong>${result.credits}</strong> in credits have been added to your account.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5" />
          Redeem Gift Card
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          placeholder="Enter gift code (e.g. FME-GIFT-XXXXXX)"
          value={code}
          onChange={e => setCode(e.target.value)}
          className="font-mono text-center tracking-wider"
        />
        {error && (
          <div className="flex items-center gap-2 text-destructive text-sm">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}
        <Button className="w-full" onClick={handleRedeem} disabled={loading || !code.trim()}>
          {loading ? 'Redeeming...' : 'Redeem'}
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Combined Page ───────────────────────────────────────────

export default function GiftCardPage() {
  const [tab, setTab] = useState<'purchase' | 'redeem'>('purchase');

  return (
    <div className="container max-w-2xl py-8 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Gift Cards</h1>
        <p className="text-muted-foreground mt-2">Give the gift of storytelling</p>
      </div>

      <div className="flex justify-center gap-2">
        <Button
          variant={tab === 'purchase' ? 'default' : 'outline'}
          onClick={() => setTab('purchase')}
        >
          Purchase
        </Button>
        <Button
          variant={tab === 'redeem' ? 'default' : 'outline'}
          onClick={() => setTab('redeem')}
        >
          Redeem
        </Button>
      </div>

      {tab === 'purchase' ? <GiftCardPurchase /> : <GiftCardRedeem />}
    </div>
  );
}
