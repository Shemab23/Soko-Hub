import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  DollarSign, 
  Calendar, 
  PieChart as PieIcon 
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  CartesianGrid 
} from 'recharts';
import { api } from '../../api/client';
import { Shop } from '../../types';
import { formatRwf, formatDate } from '../../utils/format';
import { ModuleNotEnabled } from './ModuleNotEnabled';

export const AdminAnalytics: React.FC = () => {
  const { shop } = useOutletContext<{ shop: Shop; reloadShop: () => void }>();
  const [data, setData] = useState<{
    revenueByDay: { date: string; amount: number; count: number }[];
    topProducts: { name: string; quantity: number; revenue: number }[];
    averageOrderValue: number;
    totalRevenue: number;
    totalOrders: number;
    cartToPaidConversionRate: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, [shop.slug]);

  const loadAnalytics = async () => {
    setLoading(true);
    setErrorStatus(null);
    try {
      const res = await api.admin.getAnalytics(shop.slug);
      setData(res);
    } catch (err: unknown) {
      const e = err as { status?: number };
      if (e.status === 403) {
        setErrorStatus(403);
      }
    } finally {
      setLoading(false);
    }
  };

  if (errorStatus === 403 || !shop.enabledModules.includes('analytics')) {
    return <ModuleNotEnabled moduleName="Customer Tracking & Analytics" moduleId="analytics" />;
  }

  if (loading || !data) {
    return <div className="p-12 text-center text-slate-400 font-mono text-xs">Computing shop analytics...</div>;
  }

  // Format chart data
  const chartData = data.revenueByDay.map((d) => ({
    name: formatDate(d.date),
    revenue: d.amount,
    orders: d.count,
  }));

  const productData = data.topProducts.map((p) => ({
    name: p.name.length > 18 ? p.name.slice(0, 18) + '...' : p.name,
    sales: p.revenue,
    qty: p.quantity,
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Analytics & Customer Trends
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Gated module: 30-day performance trends, average basket size, and conversion metrics.
          </p>
        </div>

        <Link
          to={`/t/${shop.slug}/admin/customers`}
          className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-2 w-fit transition-colors"
        >
          <Users className="w-4 h-4 text-indigo-500" />
          <span>View Customer Roster</span>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold">Cumulative GMV</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
            {formatRwf(data.totalRevenue)}
          </div>
          <span className="text-[11px] text-slate-400">Total gross item value sold</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold">Average Order Value</span>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 font-mono">
            {formatRwf(data.averageOrderValue)}
          </div>
          <span className="text-[11px] text-slate-400">Average share per cart</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold">Paid Orders</span>
            <ShoppingBag className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
            {data.totalOrders}
          </div>
          <span className="text-[11px] text-slate-400">Paid customer orders</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold">Cart-to-Paid Conversion</span>
            <PieIcon className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
            {data.cartToPaidConversionRate}%
          </div>
          <span className="text-[11px] text-slate-400">Successful webhook settled rate</span>
        </div>
      </div>

      {/* Chart 1: Revenue by Day */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div>
          <h2 className="font-bold text-base text-slate-900 dark:text-white">Daily Revenue (RWF)</h2>
          <p className="text-xs text-slate-500">Gross sales across the previous 14 active days</p>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  border: '1px solid #1e293b',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '11px',
                }}
                formatter={(val) => [formatRwf(Number(val) || 0), 'Revenue']}
              />
              <Area type="monotone" dataKey="revenue" stroke="#2563EB" strokeWidth={2} fillOpacity={1} fill="url(#revGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Top Products Bar Chart */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div>
          <h2 className="font-bold text-base text-slate-900 dark:text-white">Top 5 Products by Revenue</h2>
          <p className="text-xs text-slate-500">Leading items driving revenue for {shop.name}</p>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={productData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} angle={-15} textAnchor="end" />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  border: '1px solid #1e293b',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '11px',
                }}
                formatter={(val) => [formatRwf(Number(val) || 0), 'Revenue']}
              />
              <Bar dataKey="sales" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
