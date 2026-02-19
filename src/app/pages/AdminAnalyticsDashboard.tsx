/**
 * AdminAnalyticsDashboard — Comprehensive admin analytics with Recharts
 * Revenue metrics, user signups, ebook stats, Stripe webhooks, errors, SEO pages
 */

import { useState, useMemo } from 'react';
import AdminNav from '@/modules/shared/components/AdminNav';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/modules/shared/components/ui/card';
import { Badge } from '@/modules/shared/components/ui/badge';
import { Button } from '@/modules/shared/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/shared/components/ui/tabs';
import {
  DollarSign,
  TrendingUp,
  Users,
  BookOpen,
  AlertTriangle,
  Globe,
  CreditCard,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Zap,
  Search,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// ─── Mock Data ─────────────────────────────────────────────────

const DAILY_REVENUE = Array.from({ length: 30 }, (_, i) => {
  const date = new Date(2026, 1, i + 1);
  const base = 380 + Math.sin(i * 0.3) * 120 + i * 8;
  return {
    date: date.toISOString().slice(5, 10),
    revenue: Math.round(base + Math.random() * 80),
    subscriptions: Math.round(base * 0.7 + Math.random() * 50),
    credits: Math.round(base * 0.3 + Math.random() * 30),
  };
});

const WEEKLY_REVENUE = [
  { week: 'W1', revenue: 2840, prev: 2450 },
  { week: 'W2', revenue: 3120, prev: 2700 },
  { week: 'W3', revenue: 3450, prev: 2980 },
  { week: 'W4', revenue: 3890, prev: 3200 },
];

const DAILY_SIGNUPS = Array.from({ length: 30 }, (_, i) => {
  const date = new Date(2026, 1, i + 1);
  const signups = Math.round(15 + Math.random() * 25 + i * 0.5);
  return {
    date: date.toISOString().slice(5, 10),
    signups,
    cumulative: 0, // filled below
  };
});
let cum = 1180; // starting total
DAILY_SIGNUPS.forEach((d) => {
  cum += d.signups;
  d.cumulative = cum;
});

const EBOOK_BY_TEMPLATE = [
  { template: 'Lover', count: 245, color: '#ec4899' },
  { template: 'Midnights', count: 198, color: '#6366f1' },
  { template: 'Folklore', count: 167, color: '#78716c' },
  { template: 'Reputation', count: 134, color: '#171717' },
  { template: '1989', count: 112, color: '#38bdf8' },
  { template: 'Evermore', count: 89, color: '#b45309' },
];

const EBOOK_BY_DAY = Array.from({ length: 14 }, (_, i) => {
  const date = new Date(2026, 1, i + 5);
  return {
    date: date.toISOString().slice(5, 10),
    generated: Math.round(20 + Math.random() * 30),
    completed: Math.round(15 + Math.random() * 25),
    failed: Math.round(Math.random() * 4),
  };
});

const STRIPE_EVENTS = [
  { id: 'evt_1', type: 'checkout.session.completed', status: 'success', customer: 'cus_abc123', amount: 19.99, created: '2026-02-18 06:12:04' },
  { id: 'evt_2', type: 'invoice.payment_succeeded', status: 'success', customer: 'cus_def456', amount: 9.99, created: '2026-02-18 05:48:22' },
  { id: 'evt_3', type: 'customer.subscription.updated', status: 'success', customer: 'cus_ghi789', amount: 0, created: '2026-02-18 05:30:11' },
  { id: 'evt_4', type: 'invoice.payment_failed', status: 'failed', customer: 'cus_jkl012', amount: 19.99, created: '2026-02-18 04:55:33' },
  { id: 'evt_5', type: 'checkout.session.completed', status: 'success', customer: 'cus_mno345', amount: 49.99, created: '2026-02-18 04:20:18' },
  { id: 'evt_6', type: 'customer.subscription.deleted', status: 'success', customer: 'cus_pqr678', amount: 0, created: '2026-02-18 03:45:09' },
  { id: 'evt_7', type: 'charge.refunded', status: 'success', customer: 'cus_stu901', amount: -9.99, created: '2026-02-18 02:30:44' },
  { id: 'evt_8', type: 'invoice.payment_succeeded', status: 'success', customer: 'cus_vwx234', amount: 9.99, created: '2026-02-18 01:15:27' },
  { id: 'evt_9', type: 'checkout.session.completed', status: 'success', customer: 'cus_yza567', amount: 19.99, created: '2026-02-17 23:50:12' },
  { id: 'evt_10', type: 'invoice.payment_failed', status: 'failed', customer: 'cus_bcd890', amount: 49.99, created: '2026-02-17 22:10:55' },
];

const ERROR_SUMMARY = [
  { type: 'Ebook Generation Timeout', count: 12, severity: 'warning', lastSeen: '2h ago' },
  { type: 'Stripe Webhook 4xx', count: 5, severity: 'error', lastSeen: '4h ago' },
  { type: 'Groq API Rate Limit', count: 8, severity: 'warning', lastSeen: '1h ago' },
  { type: 'Image Generation Failed', count: 3, severity: 'error', lastSeen: '6h ago' },
  { type: 'Auth Token Expired', count: 2, severity: 'info', lastSeen: '12h ago' },
  { type: 'Supabase Connection Drop', count: 1, severity: 'error', lastSeen: '1d ago' },
];

const SEO_PAGES = [
  { path: '/taylor-swift-eras-tour-ebook', title: 'Eras Tour Ebook', views: 3420, conversions: 156, rate: 4.6 },
  { path: '/custom-taylor-swift-gifts', title: 'Custom TS Gifts', views: 2890, conversions: 134, rate: 4.6 },
  { path: '/swiftie-birthday-present-ideas', title: 'Swiftie Birthday', views: 2150, conversions: 89, rate: 4.1 },
  { path: '/eras-tour-memories-book', title: 'Memories Book', views: 1980, conversions: 78, rate: 3.9 },
  { path: '/taylor-swift-fan-art-book', title: 'Fan Art Book', views: 1540, conversions: 62, rate: 4.0 },
  { path: '/personalized-eras-tour-photo-book', title: 'Photo Book', views: 1320, conversions: 51, rate: 3.9 },
  { path: '/taylor-swift-concert-keepsake-gift', title: 'Concert Keepsake', views: 1180, conversions: 45, rate: 3.8 },
  { path: '/swiftie-graduation-gift-ideas', title: 'Graduation Gift', views: 890, conversions: 32, rate: 3.6 },
  { path: '/taylor-swift-friendship-bracelet-book', title: 'Bracelet Book', views: 760, conversions: 28, rate: 3.7 },
  { path: '/eras-tour-scrapbook-digital', title: 'Digital Scrapbook', views: 620, conversions: 22, rate: 3.5 },
];

const COLORS = ['#8b5cf6', '#6366f1', '#ec4899', '#f59e0b', '#10b981', '#38bdf8'];

// ─── Metric Card ─────────────────────────────────────────────

function MetricCard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  iconColor = 'text-gray-400',
}: {
  title: string;
  value: string;
  change?: number;
  changeLabel?: string;
  icon: React.ElementType;
  iconColor?: string;
}) {
  const positive = change !== undefined && change >= 0;
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-gray-500">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${iconColor}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change !== undefined && (
          <p className={`text-xs mt-1 flex items-center gap-1 ${positive ? 'text-green-600' : 'text-red-500'}`}>
            {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(change)}% {changeLabel || 'vs last period'}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Component ──────────────────────────────────────────

const AdminAnalyticsDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [stripeFilter, setStripeFilter] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filteredEvents = useMemo(() => {
    if (stripeFilter === 'all') return STRIPE_EVENTS;
    return STRIPE_EVENTS.filter((e) => e.status === stripeFilter);
  }, [stripeFilter]);

  const totalEbooks = EBOOK_BY_TEMPLATE.reduce((s, t) => s + t.count, 0);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />
      <div className="container max-w-7xl mx-auto py-6 px-4 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Analytics Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">Comprehensive metrics for FlipMyEra</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="self-start"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Top-level KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard title="Total Revenue" value="$89,340" change={18.2} icon={DollarSign} iconColor="text-green-500" />
          <MetricCard title="MRR" value="$12,450" change={8.2} icon={TrendingUp} iconColor="text-indigo-500" />
          <MetricCard title="Total Users" value="1,834" change={14.1} icon={Users} iconColor="text-blue-500" />
          <MetricCard title="Ebooks Generated" value={totalEbooks.toLocaleString()} change={11.5} icon={BookOpen} iconColor="text-purple-500" />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex flex-wrap h-auto gap-1">
            <TabsTrigger value="overview">Revenue</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="ebooks">Ebooks</TabsTrigger>
            <TabsTrigger value="stripe">Stripe Events</TabsTrigger>
            <TabsTrigger value="errors">Errors</TabsTrigger>
            <TabsTrigger value="seo">SEO Pages</TabsTrigger>
          </TabsList>

          {/* ─── Revenue Tab ─── */}
          <TabsContent value="overview" className="space-y-6 mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Daily Revenue Area Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Daily Revenue (Feb 2026)</CardTitle>
                  <CardDescription>Subscriptions vs credit pack sales</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={DAILY_REVENUE}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorSubs" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                      <Tooltip formatter={(v: number) => `$${v}`} />
                      <Legend />
                      <Area type="monotone" dataKey="subscriptions" stroke="#6366f1" fill="url(#colorSubs)" name="Subscriptions" />
                      <Area type="monotone" dataKey="credits" stroke="#ec4899" fill="#ec489920" name="Credit Packs" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Weekly Comparison */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Weekly Revenue Comparison</CardTitle>
                  <CardDescription>This month vs previous month</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={WEEKLY_REVENUE}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                      <Tooltip formatter={(v: number) => `$${v}`} />
                      <Legend />
                      <Bar dataKey="prev" name="Previous" fill="#d1d5db" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="revenue" name="Current" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ─── Users Tab ─── */}
          <TabsContent value="users" className="space-y-6 mt-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard title="New Today" value="28" change={12} icon={Users} iconColor="text-blue-500" />
              <MetricCard title="This Week" value="187" change={9.3} icon={Users} iconColor="text-indigo-500" />
              <MetricCard title="This Month" value="654" change={14.1} icon={Users} iconColor="text-purple-500" />
              <MetricCard title="Total Users" value="1,834" icon={Users} iconColor="text-green-500" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Daily Signups */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Daily Signups</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={DAILY_SIGNUPS}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="signups" fill="#6366f1" radius={[4, 4, 0, 0]} name="Signups" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Cumulative Users */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Cumulative Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={DAILY_SIGNUPS}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="cumulative" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Total Users" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ─── Ebooks Tab ─── */}
          <TabsContent value="ebooks" className="space-y-6 mt-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard title="Total Generated" value={totalEbooks.toLocaleString()} change={11.5} icon={BookOpen} iconColor="text-purple-500" />
              <MetricCard title="Today" value="34" change={8} icon={Zap} iconColor="text-yellow-500" />
              <MetricCard title="Success Rate" value="96.2%" change={1.1} icon={Activity} iconColor="text-green-500" />
              <MetricCard title="Avg. per User" value="1.8" icon={BookOpen} iconColor="text-blue-500" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* By Template Pie */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">By Template / Era</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={EBOOK_BY_TEMPLATE}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="count"
                        nameKey="template"
                        label={({ template, percent }) => `${template} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {EBOOK_BY_TEMPLATE.map((entry, idx) => (
                          <Cell key={idx} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* By Day */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Generation by Day</CardTitle>
                  <CardDescription>Generated, completed, and failed</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={EBOOK_BY_DAY}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="generated" fill="#8b5cf6" name="Generated" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="completed" fill="#10b981" name="Completed" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="failed" fill="#ef4444" name="Failed" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ─── Stripe Events Tab ─── */}
          <TabsContent value="stripe" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg">Stripe Webhook Event Log</CardTitle>
                    <CardDescription>Recent webhook events from Stripe</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {['all', 'success', 'failed'].map((f) => (
                      <Button
                        key={f}
                        size="sm"
                        variant={stripeFilter === f ? 'default' : 'outline'}
                        onClick={() => setStripeFilter(f)}
                        className="capitalize text-xs"
                      >
                        {f}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-gray-500">
                        <th className="pb-3 font-medium">Event Type</th>
                        <th className="pb-3 font-medium hidden sm:table-cell">Customer</th>
                        <th className="pb-3 font-medium">Status</th>
                        <th className="pb-3 font-medium text-right">Amount</th>
                        <th className="pb-3 font-medium text-right hidden md:table-cell">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEvents.map((evt) => (
                        <tr key={evt.id} className="border-b last:border-0 hover:bg-gray-50">
                          <td className="py-3">
                            <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{evt.type}</code>
                          </td>
                          <td className="py-3 text-gray-500 hidden sm:table-cell text-xs">{evt.customer}</td>
                          <td className="py-3">
                            <Badge variant={evt.status === 'success' ? 'default' : 'destructive'} className="text-xs">
                              {evt.status}
                            </Badge>
                          </td>
                          <td className="py-3 text-right font-medium">
                            {evt.amount !== 0 ? `$${evt.amount.toFixed(2)}` : '—'}
                          </td>
                          <td className="py-3 text-right text-gray-400 text-xs hidden md:table-cell">{evt.created}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── Errors Tab ─── */}
          <TabsContent value="errors" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <MetricCard title="Total Errors (24h)" value="31" change={-15} changeLabel="vs yesterday" icon={AlertTriangle} iconColor="text-red-500" />
              <MetricCard title="Warning" value="20" icon={AlertTriangle} iconColor="text-yellow-500" />
              <MetricCard title="Critical" value="9" change={-22} changeLabel="vs yesterday" icon={AlertTriangle} iconColor="text-red-600" />
            </div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Error Tracking Summary</CardTitle>
                <CardDescription>Grouped by error type (last 24 hours)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {ERROR_SUMMARY.map((err, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            err.severity === 'error' ? 'bg-red-500' : err.severity === 'warning' ? 'bg-yellow-500' : 'bg-blue-400'
                          }`}
                        />
                        <span className="text-sm font-medium truncate">{err.type}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <Badge variant={err.severity === 'error' ? 'destructive' : 'secondary'} className="text-xs">
                          {err.count}×
                        </Badge>
                        <span className="text-xs text-gray-400 hidden sm:inline">{err.lastSeen}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── SEO Pages Tab ─── */}
          <TabsContent value="seo" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <MetricCard title="Total SEO Views" value="16,750" change={22.4} icon={Globe} iconColor="text-green-500" />
              <MetricCard title="SEO Conversions" value="697" change={18.7} icon={Search} iconColor="text-blue-500" />
              <MetricCard title="Avg. Conv. Rate" value="4.0%" change={1.2} icon={TrendingUp} iconColor="text-purple-500" />
            </div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Top-Performing SEO Pages</CardTitle>
                <CardDescription>Ranked by page views</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-gray-500">
                        <th className="pb-3 font-medium">#</th>
                        <th className="pb-3 font-medium">Page</th>
                        <th className="pb-3 font-medium text-right">Views</th>
                        <th className="pb-3 font-medium text-right hidden sm:table-cell">Conversions</th>
                        <th className="pb-3 font-medium text-right hidden sm:table-cell">Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {SEO_PAGES.map((page, i) => (
                        <tr key={page.path} className="border-b last:border-0 hover:bg-gray-50">
                          <td className="py-3 text-gray-400">{i + 1}</td>
                          <td className="py-3">
                            <div>
                              <p className="font-medium text-sm">{page.title}</p>
                              <p className="text-xs text-gray-400 truncate max-w-[200px] sm:max-w-none">{page.path}</p>
                            </div>
                          </td>
                          <td className="py-3 text-right font-medium">{page.views.toLocaleString()}</td>
                          <td className="py-3 text-right text-green-600 hidden sm:table-cell">{page.conversions}</td>
                          <td className="py-3 text-right hidden sm:table-cell">{page.rate}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* SEO Views Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">SEO Page Views Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={SEO_PAGES} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis dataKey="title" type="category" tick={{ fontSize: 11 }} width={120} />
                    <Tooltip />
                    <Bar dataKey="views" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Views" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminAnalyticsDashboard;
