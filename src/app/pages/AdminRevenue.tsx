/**
 * AdminRevenue — Revenue dashboard with MRR, charts, and transaction history
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/modules/shared/components/ui/card';
import { Badge } from '@/modules/shared/components/ui/badge';
import {
  DollarSign,
  TrendingUp,
  Users,
  UserMinus,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

// ─── Mock Data (replace with Supabase queries) ──────────────

const MOCK_METRICS = {
  mrr: 12_450,
  mrrChange: 8.2,
  totalRevenue: 89_340,
  activeSubscriptions: 847,
  subsChange: 12,
  churnRate: 3.1,
  churnChange: -0.4,
};

const MOCK_MONTHLY_REVENUE = [
  { month: 'Sep', amount: 8200 },
  { month: 'Oct', amount: 9100 },
  { month: 'Nov', amount: 9800 },
  { month: 'Dec', amount: 10500 },
  { month: 'Jan', amount: 11200 },
  { month: 'Feb', amount: 12450 },
];

const MOCK_TIER_BREAKDOWN = [
  { tier: 'Speak Now', count: 520, color: '#8b5cf6', pct: 61 },
  { tier: 'Midnights', count: 280, color: '#6366f1', pct: 33 },
  { tier: 'Eras Tour', count: 47, color: '#f59e0b', pct: 6 },
];

const MOCK_TRANSACTIONS = [
  { id: 1, user: 'alice@example.com', type: 'subscription', tier: 'Midnights', amount: 19.99, date: '2026-02-17' },
  { id: 2, user: 'bob@example.com', type: 'credit_pack', tier: 'Album', amount: 9.99, date: '2026-02-17' },
  { id: 3, user: 'carol@example.com', type: 'subscription', tier: 'Speak Now', amount: 9.99, date: '2026-02-16' },
  { id: 4, user: 'dave@example.com', type: 'subscription', tier: 'Eras Tour', amount: 49.99, date: '2026-02-16' },
  { id: 5, user: 'eve@example.com', type: 'gift_card', tier: '—', amount: 25.00, date: '2026-02-15' },
  { id: 6, user: 'frank@example.com', type: 'credit_pack', tier: 'Tour', amount: 19.99, date: '2026-02-15' },
  { id: 7, user: 'grace@example.com', type: 'subscription', tier: 'Midnights', amount: 15.99, date: '2026-02-14' },
  { id: 8, user: 'henry@example.com', type: 'subscription', tier: 'Speak Now', amount: 7.99, date: '2026-02-14' },
];

// ─── Simple Bar Chart (CSS) ─────────────────────────────────

function RevenueBarChart({ data }: { data: typeof MOCK_MONTHLY_REVENUE }) {
  const max = Math.max(...data.map((d) => d.amount));
  return (
    <div className="flex items-end gap-3 h-48">
      {data.map((d) => {
        const height = (d.amount / max) * 100;
        return (
          <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-xs text-gray-500 font-medium">
              ${(d.amount / 1000).toFixed(1)}k
            </span>
            <div
              className="w-full bg-gradient-to-t from-purple-500 to-indigo-400 rounded-t-md transition-all duration-500"
              style={{ height: `${height}%`, minHeight: 4 }}
            />
            <span className="text-xs text-gray-400">{d.month}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Simple Pie Chart (CSS circles) ─────────────────────────

function TierPieChart({ data }: { data: typeof MOCK_TIER_BREAKDOWN }) {
  // Using a conic-gradient for a simple pie chart
  let cumPct = 0;
  const gradientStops = data.map((d) => {
    const start = cumPct;
    cumPct += d.pct;
    return `${d.color} ${start}% ${cumPct}%`;
  }).join(', ');

  return (
    <div className="flex items-center gap-6">
      <div
        className="w-32 h-32 rounded-full shrink-0"
        style={{ background: `conic-gradient(${gradientStops})` }}
      />
      <div className="space-y-2">
        {data.map((d) => (
          <div key={d.tier} className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
            <span className="font-medium">{d.tier}</span>
            <span className="text-gray-400">({d.count} · {d.pct}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Metric Card ─────────────────────────────────────────────

function MetricCard({
  title,
  value,
  change,
  icon: Icon,
  prefix = '',
  suffix = '',
}: {
  title: string;
  value: number | string;
  change?: number;
  icon: React.ElementType;
  prefix?: string;
  suffix?: string;
}) {
  const isPositive = change !== undefined && change >= 0;
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-gray-500">{title}</CardTitle>
        <Icon className="h-4 w-4 text-gray-400" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
        </div>
        {change !== undefined && (
          <p className={`text-xs mt-1 flex items-center gap-1 ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
            {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(change)}% from last month
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Component ───────────────────────────────────────────────

const AdminRevenue = () => {
  const metrics = MOCK_METRICS;
  const monthlyRevenue = MOCK_MONTHLY_REVENUE;
  const tierBreakdown = MOCK_TIER_BREAKDOWN;
  const transactions = MOCK_TRANSACTIONS;

  return (
    <div className="container py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Revenue Dashboard</h1>
        <p className="text-gray-500 mt-1">Track your subscription metrics and revenue</p>
      </div>

      {/* ── Key Metrics ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Monthly Recurring Revenue"
          value={metrics.mrr}
          change={metrics.mrrChange}
          icon={DollarSign}
          prefix="$"
        />
        <MetricCard
          title="Total Revenue"
          value={metrics.totalRevenue}
          icon={TrendingUp}
          prefix="$"
        />
        <MetricCard
          title="Active Subscriptions"
          value={metrics.activeSubscriptions}
          change={metrics.subsChange}
          icon={Users}
        />
        <MetricCard
          title="Churn Rate"
          value={metrics.churnRate}
          change={metrics.churnChange}
          icon={UserMinus}
          suffix="%"
        />
      </div>

      {/* ── Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Revenue by Month</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueBarChart data={monthlyRevenue} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Subscribers by Tier</CardTitle>
          </CardHeader>
          <CardContent>
            <TierPieChart data={tierBreakdown} />
          </CardContent>
        </Card>
      </div>

      {/* ── Recent Transactions ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-3 font-medium">User</th>
                  <th className="pb-3 font-medium">Type</th>
                  <th className="pb-3 font-medium">Plan/Pack</th>
                  <th className="pb-3 font-medium text-right">Amount</th>
                  <th className="pb-3 font-medium text-right">Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id} className="border-b last:border-0">
                    <td className="py-3 font-medium">{tx.user}</td>
                    <td className="py-3">
                      <Badge variant="secondary" className="text-xs capitalize">
                        {tx.type.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="py-3 text-gray-600">{tx.tier}</td>
                    <td className="py-3 text-right font-medium">${tx.amount.toFixed(2)}</td>
                    <td className="py-3 text-right text-gray-400">{tx.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminRevenue;
