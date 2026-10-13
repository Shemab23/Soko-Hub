import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  Store, 
  DollarSign, 
  ShoppingBag, 
  AlertTriangle, 
  CheckCircle2, 
  Ban, 
  ExternalLink, 
  ArrowLeft,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid 
} from 'recharts';
import { api } from '../../api/client';
import { Shop } from '../../types';
import { formatRwf, formatDate } from '../../utils/format';

export const OperatorPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<{
    shops: (Shop & { totalOrders: number; gmv: number; feeEarnings: number })[];
    totalGmv: number;
    totalPlatformFees: number;
    totalOrdersCount: number;
    feeEarningsByDay: { date: string; amount: number }[];
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [togglingShopId, setTogglingShopId] = useState<string | null>(null);

  useEffect(() => {
    loadOperatorStats();
  }, []);

  const loadOperatorStats = async () => {
    setLoading(true);
    try {
      // Ensure operator session exists
      const session = api.auth.getCurrentSession();
      if (!session || session.role !== 'operator') {
        await api.auth.login({
          email: 'operator@soko.demo',
          password: 'Demo1234!',
        });
      }

      const res = await api.operator.getStats();
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSuspend = async (shop: Shop) => {
    const actionName = shop.isSuspended ? 'reactivate' : 'suspend';
    if (window.confirm(`Are you sure you want to ${actionName} '${shop.name}'?`)) {
      setTogglingShopId(shop.id);
      try {
        await api.operator.setSuspension(shop.id, !shop.isSuspended);
        await loadOperatorStats();
      } catch (err: unknown) {
        const e = err as { error?: string };
        alert(e.error || 'Failed to update shop status');
      } finally {
        setTogglingShopId(null);
      }
    }
  };

  if (loading || !data) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center animate-pulse text-xs font-mono text-slate-400">
        Authenticating Platform Operator & aggregating multi-tenant metrics...
      </div>
    );
  }

  const chartData = data.feeEarningsByDay.map((d) => ({
    name: formatDate(d.date),
    fee: d.amount,
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold font-mono mb-2 border border-emerald-500/20">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>PLATFORM OPERATOR PORTAL • GLOBAL SUPER ADMIN</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Soko Hub Operator Dashboard
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Across all active shops: gross marketplace volume, 5% platform earnings, and tenant suspension enforcement.
          </p>
        </div>

        <Link
          to="/"
          className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-2 w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Marketplace</span>
        </Link>
      </div>

      {/* Global Financial Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-slate-500">Total Marketplace GMV</span>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
            {formatRwf(data.totalGmv)}
          </div>
          <span className="text-[11px] text-slate-400">Total gross value transacted</span>
        </div>

        <div className="p-5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/60 shadow-sm space-y-2">
          <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">Platform Fees Earned (5%)</span>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
            {formatRwf(data.totalPlatformFees)}
          </div>
          <span className="text-[11px] text-emerald-700/80 dark:text-emerald-300/80">Soko Hub commission retained</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-slate-500">Gross Paid Orders</span>
          <div className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 font-mono">
            {data.totalOrdersCount}
          </div>
          <span className="text-[11px] text-slate-400">Paid customer checkouts</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-slate-500">Registered Tenants</span>
          <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">
            {data.shops.length}
          </div>
          <span className="text-[11px] text-slate-400">Independent merchant shops</span>
        </div>
      </div>

      {/* Platform Fee Earnings Chart */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div>
          <h2 className="font-bold text-base text-slate-900 dark:text-white">Platform Fee Earnings Over Time (5% Net)</h2>
          <p className="text-xs text-slate-500">Daily commission generated across all tenant sales</p>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="feeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
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
                formatter={(val) => [formatRwf(Number(val) || 0), 'Platform Fee']}
              />
              <Area type="monotone" dataKey="fee" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#feeGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* All Tenants Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden space-y-4 p-6">
        <div>
          <h2 className="font-bold text-base text-slate-900 dark:text-white">Tenant Registry & Control</h2>
          <p className="text-xs text-slate-500">
            Suspend or reactivate shops. When suspended, a shop&apos;s products vanish from the marketplace and its admin login is revoked.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3 px-4">Shop</th>
                <th className="py-3 px-4">Subdomain</th>
                <th className="py-3 px-4">Enabled Modules</th>
                <th className="py-3 px-4">Orders</th>
                <th className="py-3 px-4">GMV</th>
                <th className="py-3 px-4">Fee Share (5%)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.shops.map((s) => {
                const isToggling = togglingShopId === s.id;

                return (
                  <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">{s.name}</div>
                      <div className="text-[11px] text-slate-400">{s.category} • {s.location}</div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-blue-600 dark:text-blue-400">
                      {s.slug}.soko.rw
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {s.enabledModules.map((m) => (
                          <span
                            key={m}
                            className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase"
                          >
                            {m}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-700 dark:text-slate-300">
                      {s.totalOrders}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      {formatRwf(s.gmv)}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {formatRwf(s.feeEarnings)}
                    </td>

                    <td className="py-3.5 px-4">
                      {s.isSuspended ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20">
                          Suspended
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                          Active
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right space-x-2">
                      <Link
                        to={`/t/${s.slug}/admin`}
                        className="p-1.5 text-slate-400 hover:text-blue-600 rounded inline-block"
                        title="Enter Tenant Admin"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>

                      <button
                        onClick={() => handleToggleSuspend(s)}
                        disabled={isToggling}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          s.isSuspended
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'
                        }`}
                      >
                        {isToggling ? 'Updating...' : s.isSuspended ? 'Reactivate' : 'Suspend'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
