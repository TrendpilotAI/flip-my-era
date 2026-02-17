import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/modules/shared/components/ui/card';
import { Button } from '@/modules/shared/components/ui/button';
import { CreditBalance } from '@/modules/user/components/CreditBalance';
import { CreditPurchaseModal, pricingTiers } from '@/modules/user/components/CreditPurchaseModal';
import { Coins } from 'lucide-react';

const CreditsPage = () => {
  const [showPurchase, setShowPurchase] = useState(false);
  const [currentBalance, setCurrentBalance] = useState(0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Coins className="h-6 w-6 mr-2 text-yellow-500" /> Credits
          </h1>
          <Button onClick={() => setShowPurchase(true)} className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
            Buy Credits
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CreditBalance onBalanceChange={setCurrentBalance} />

          <Card>
            <CardHeader>
              <CardTitle>How credits work</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-600 space-y-2">
              <p>Credits are used for generating chapters and illustrations.</p>
              <p>They never expire and can be used any time.</p>
              <p>You currently have <strong>{currentBalance}</strong> credits.</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Credit Packs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {pricingTiers.map((tier) => (
                <div key={tier.id} className={`p-4 border rounded-md ${tier.bestValue ? 'ring-2 ring-indigo-400' : ''}`}>
                  <div className="font-semibold mb-1">{tier.name} — {tier.credits} credits</div>
                  <div className="text-lg font-bold mb-1">${tier.price.toFixed(2)}</div>
                  <div className="text-sm text-muted-foreground mb-3">{tier.description}</div>
                  <Button variant={tier.bestValue ? 'default' : 'outline'} onClick={() => setShowPurchase(true)} className="w-full">
                    Buy {tier.name}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <CreditPurchaseModal
          isOpen={showPurchase}
          onClose={() => setShowPurchase(false)}
          onSuccess={() => setShowPurchase(false)}
          currentBalance={currentBalance}
        />
      </div>
    </div>
  );
};

export default CreditsPage;


