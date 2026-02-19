import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/modules/shared/components/ui/card';
import { DollarSign, TrendingUp, TrendingDown, Users, BarChart3 } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────

export interface RevenueDataPoint {
  month: string; // YYYY-MM
  mrr: number;
  newSubscribers: number;
  churnedSubscribers: number;
  totalSubscribers: number;
  revenue: number;
}

export interface RevenueMetrics {
  currentMRR: number;
  previousMRR: number;
  mrrGrowthRate: number;
  churnRate: number;
  averageLTV: number;
  arpu: number; // avg revenue per user
  totalRevenue: number;
}

// ─── Calculations ────────────────────────────────────────────

export function calculateMRR(activeSubscribers: { monthlyAmount: number }[]): number {
  return activeSubscribers.reduce((sum, s) => sum + s.monthlyAmount, 0);
}

export function calculateChurnRate(
  startSubscribers: number,
  churnedSubscribers: number,
): number {
  if (startSubscribers === 0) return 0;
  return (churnedSubscribers / startSubscribers) * 100;
}

export function calculateLTV(arpu: number, churnRate: number): number {
  if (churnRate === 0) return arpu * 120; // cap at 10 years if no churn
  return arpu / (churnRate / 100);
}

export function calculateARPU(totalRevenue: number, totalUsers: number): number {
  if (totalUsers === 0) return 0;
  return totalRevenue / totalUsers;
}

export function computeRevenueMetrics(data: RevenueDataPoint[]): RevenueMetrics {
  if (data.length === 0) {
    return { currentMRR: 0, previousMRR: 0, mrrGrowthRate: 0, churnRate: 0, averageLTV: 0, arpu: 0, totalRevenue: 0 };
  }

  const current = data[data.length - 1];
  const previous = data.length > 1 ? data[data.length - 2] : null;

  const currentMRR = current.mrr;
  const previousMRR = previous?.mrr ?? 0;
  const mrrGrowthRate = previousMRR > 0 ? ((currentMRR - previousMRR) / previousMRR) * 100 : 0;

  const avgChurn = data.reduce((sum, d) => {
    return sum + calculateChurnRate(d.totalSubscribers + d.churnedSubscribers, d.churnedSubscribers);
  }, 0) / data.length;

  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);
  const totalUsers = current.totalSubscribers || 1;
  const arpu = totalRevenue / totalUsers / data.length;
  const ltv = calculateLTV(arpu, avgChurn);

  return { currentMRR, previousMRR, mrrGrowthRate, churnRate: avgChurn, averageLTV: ltv, arpu, totalRevenue };
}

// ─── Sample Data (replace with real API calls) ───────────────

const SAMPLE_DATA: RevenueDataPoint[] = [
  { month: '2025-07', mrr: 2400, newSubscribers: 45, churnedSubscribers: 3, totalSubscribers: 120, revenue: 2400 },
  { month: '2025-08', mrr: 3200, newSubscribers: 62, churnedSubscribers: 5, totalSubscribers: 177, revenue: 3200 },
  { month: '2025-09', mrr: 4100, newSubscribers: 78, churnedSubscribers: 8, totalSubscribers: 247, revenue: 4100 },
  { month: '2025-10', mrr: 5800, newSubscribers: 95, churnedSubscribers: 7, totalSubscribers: 335, revenue: 5800 },
  { month: '2025-11', mrr: 7200, newSubscribers: 110, churnedSubscribers: 12, totalSubscribers: 433, revenue: 7200 },
  { month: '2025-12', mrr: 8900, newSubscribers: 130, churnedSubscribers: 10, totalSubscribers: 553, revenue: 8900 },
];

// ─── Components ──────────────────────────────────────────────

function MetricCard({
  icon,
  label,
  value,
  change,
  format = 'number',
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  change?: number;
  format?: 'currency' | 'percent' | 'number';
}) {
  const formatted =
    format === 'currency'
      ? `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : format === 'percent'
        ? `${value.toFixed(1)}%`
        : value.toLocaleString();

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">{icon}{label}</div>
          {change !== undefined && (
            <span className={`text-xs flex items-center gap-1 ${change >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(change).toFixed(1)}%
            </span>
          )}
        </div>
        <p className="text-2xl font-bold mt-1">{formatted}</p>
      </CardContent>
    </Card>
  );
}

function SimpleBarChart({ data }: { data: RevenueDataPoint[] }) {
  const maxMRR = Math.max(...data.map(d => d.mrr), 1);

  return (
    <div className="flex items-end gap-2 h-40">
      {data.map(d => (
        <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full bg-primary/80 rounded-t transition-all"
            style={{ height: `${(d.mrr / maxMRR) * 100}%`, minHeight: '4px' }}
            title={`$${d.mrr.toLocaleString()}`}
          />
          <span className="text-[10px] text-muted-foreground">
            {d.month.split('-')[1]}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────

export default function RevenueDashboard() {
  const [data] = useState<RevenueDataPoint[]>(SAMPLE_DATA);
  const metrics = useMemo(() => computeRevenueMetrics(data), [data]);

  return (
    <div className="container py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Revenue Dashboard</h1>
        <p className="text-muted-foreground">Track MRR, churn, and lifetime value</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          icon={<DollarSign className="h-4 w-4" />}
          label="Monthly Recurring Revenue"
          value={metrics.currentMRR}
          change={metrics.mrrGrowthRate}
          format="currency"
        />
        <MetricCard
          icon={<TrendingDown className="h-4 w-4" />}
          label="Churn Rate"
          value={metrics.churnRate}
          format="percent"
        />
        <MetricCard
          icon={<Users className="h-4 w-4" />}
          label="Avg. Lifetime Value"
          value={metrics.averageLTV}
          format="currency"
        />
        <MetricCard
          icon={<DollarSign className="h-4 w-4" />}
          label="Total Revenue"
          value={metrics.totalRevenue}
          format="currency"
        />
      </div>

      {/* MRR Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            MRR Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SimpleBarChart data={data} />
        </CardContent>
      </Card>

      {/* Monthly Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-2 font-medium">Month</th>
                  <th className="pb-2 font-medium">MRR</th>
                  <th className="pb-2 font-medium">New</th>
                  <th className="pb-2 font-medium">Churned</th>
                  <th className="pb-2 font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {data.map(d => (
                  <tr key={d.month} className="border-b last:border-0">
                    <td className="py-2">{d.month}</td>
                    <td className="py-2">${d.mrr.toLocaleString()}</td>
                    <td className="py-2 text-green-600">+{d.newSubscribers}</td>
                    <td className="py-2 text-red-500">-{d.churnedSubscribers}</td>
                    <td className="py-2">{d.totalSubscribers}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
