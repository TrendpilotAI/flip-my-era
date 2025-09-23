import { Card, CardContent, CardHeader, CardTitle } from '@/modules/shared/components/ui/card';
import { Button } from '@/modules/shared/components/ui/button';
import { CreditPurchaseModal, pricingTiers } from '@/modules/user/components/CreditPurchaseModal';
import { useState } from 'react';
import { Crown } from 'lucide-react';

const PlansPage = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Crown className="h-6 w-6 mr-2 text-purple-600" /> Plans & Pricing
          </h1>
          <Button onClick={() => setOpen(true)} className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">Buy Credits</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {pricingTiers.map((tier) => (
            <Card key={tier.id} className={tier.popular ? 'ring-2 ring-purple-400' : ''}>
              <CardHeader>
                <CardTitle>{tier.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-muted-foreground">{tier.description}</div>
                <ul className="text-sm list-disc ml-5 space-y-1">
                  {tier.features.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
                <Button className="w-full" onClick={() => setOpen(true)}>Select</Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <CreditPurchaseModal isOpen={open} onClose={() => setOpen(false)} onSuccess={() => setOpen(false)} currentBalance={0} />
      </div>
    </div>
  );
};

export default PlansPage; 