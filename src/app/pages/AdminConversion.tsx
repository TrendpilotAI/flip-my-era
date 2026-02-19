import { useState, useMemo } from 'react';
import AdminNav from '@/modules/shared/components/AdminNav';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/modules/shared/components/ui/card';
import { Badge } from '@/modules/shared/components/ui/badge';
import { Button } from '@/modules/shared/components/ui/button';
import { BarChart3, TrendingUp, Users, BookOpen, CreditCard, Coins, RefreshCw } from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────

interface FunnelStep {
  name: string;
  count: number;
  icon: React.ElementType;
  color: string;
}

interface MetricCard {
  title: string;
  value: string;
  change: string;
  positive: boolean;
  icon: React.ElementType;
}

// ─── Component ─────────────────────────────────────────────────

const AdminConversion = () => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  // In production these would come from PostHog API / Supabase queries.
  // Placeholder data to demonstrate the dashboard layout.
  const metrics: MetricCard[] = useMemo(() => [
    { title: 'Total Signups', value: '1,247', change: '+14%', positive: true, icon: Users },
    { title: 'Ebooks Created', value: '863', change: '+9%', positive: true, icon: BookOpen },
    { title: 'Purchases', value: '312', change: '+22%', positive: true, icon: CreditCard },
    { title: 'Conversion Rate', value: '25.0%', change: '+3.2pp', positive: true, icon: TrendingUp },
  ], []);

  const funnel: FunnelStep[] = useMemo(() => [
    { name: 'Page Views', count: 8420, icon: BarChart3, color: 'bg-blue-500' },
    { name: 'Signups', count: 1247, icon: Users, color: 'bg-indigo-500' },
    { name: 'Ebook Started', count: 985, icon: BookOpen, color: 'bg-purple-500' },
    { name: 'Ebook Completed', count: 863, icon: BookOpen, color: 'bg-violet-500' },
    { name: 'Checkout Started', count: 445, icon: CreditCard, color: 'bg-pink-500' },
    { name: 'Purchase Completed', count: 312, icon: Coins, color: 'bg-rose-500' },
  ], []);

  const maxCount = funnel[0]?.count || 1;

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />
      <div className="container max-w-7xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <TrendingUp className="h-8 w-8 text-purple-500" />
              Conversion Analytics
            </h1>
            <p className="text-gray-600 mt-1">Track your signup → purchase funnel</p>
          </div>
          <div className="flex items-center gap-2">
            {(['7d', '30d', '90d'] as const).map((range) => (
              <Button
                key={range}
                size="sm"
                variant={timeRange === range ? 'default' : 'outline'}
                onClick={() => setTimeRange(range)}
              >
                {range}
              </Button>
            ))}
            <Button size="sm" variant="ghost">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {metrics.map((m) => {
            const Icon = m.icon;
            return (
              <Card key={m.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{m.title}</CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{m.value}</div>
                  <p className={`text-xs ${m.positive ? 'text-green-600' : 'text-red-600'}`}>
                    {m.change} from previous period
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Funnel Visualization */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Conversion Funnel</CardTitle>
            <CardDescription>
              Drop-off at each stage ({timeRange} window)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {funnel.map((step, i) => {
                const pct = ((step.count / maxCount) * 100).toFixed(1);
                const dropOff = i > 0
                  ? (((funnel[i - 1].count - step.count) / funnel[i - 1].count) * 100).toFixed(1)
                  : null;
                const Icon = step.icon;

                return (
                  <div key={step.name} className="flex items-center gap-4">
                    <div className="w-40 flex items-center gap-2 shrink-0">
                      <div className={`p-1.5 rounded ${step.color}`}>
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-sm font-medium truncate">{step.name}</span>
                    </div>
                    <div className="flex-1">
                      <div className="h-8 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${step.color} rounded-full transition-all duration-500 flex items-center justify-end pr-3`}
                          style={{ width: `${pct}%` }}
                        >
                          <span className="text-xs text-white font-medium">
                            {step.count.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="w-20 text-right shrink-0">
                      <span className="text-sm text-gray-500">{pct}%</span>
                    </div>
                    <div className="w-24 text-right shrink-0">
                      {dropOff !== null ? (
                        <Badge variant="secondary" className="text-xs">
                          -{dropOff}% drop
                        </Badge>
                      ) : (
                        <span className="text-xs text-gray-400">baseline</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* A/B Tests Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Active Experiments</CardTitle>
            <CardDescription>A/B tests currently running</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: 'pricing_page_variant', status: 'running', variants: 2, conversions: '12.4% vs 15.1%' },
                { name: 'signup_cta_variant', status: 'draft', variants: 2, conversions: 'N/A' },
              ].map((exp) => (
                <div key={exp.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <span className="font-medium text-sm">{exp.name}</span>
                    <span className="text-xs text-gray-500 ml-2">{exp.variants} variants</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600">{exp.conversions}</span>
                    <Badge variant={exp.status === 'running' ? 'default' : 'secondary'}>
                      {exp.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminConversion;
