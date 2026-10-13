import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { CreditCard, DollarSign, ArrowDownRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { api } from '../../api/client';
import { Shop, Payout } from '../../types';
import { formatRwf, formatDateTime } from '../../utils/format';

export const AdminPayouts: React.FC = () => {
  const { shop } = useOutletContext<{ shop: Shop; reloadShop: () => void }>();
  const [data, setData] = useState<{
    payouts: Payout[];
    runningTotalNet: number;
    totalGross: number;
    totalFees: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPayouts();
  }, [shop.slug]);

  const loadPayouts = async () => {
    setLoading(true);
    try {
      const res = await api.admin.getPayouts(shop.slug);
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Payouts & Fee Settlement Ledger
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Always on. Engine Rule 7: on paid order, net = shop subtotal &times; 0.95, platform fee = 5%.
          </p>
        </div>

        <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/40 w-fit">
          Automatic Webhook Split
        </span>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-slate-500">Gross Sales Value</span>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
            {formatRwf(data?.totalGross || 0)}
          </div>
          <span className="text-[11px] text-slate-400">Total customer spend on your items</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-slate-500">Platform Commission (5%)</span>
          <div className="text-2xl font-extrabold text-rose-500 font-mono">
            -{formatRwf(data?.totalFees || 0)}
          </div>
          <span className="text-[11px] text-slate-400">5% Soko Hub marketplace fee</span>
        </div>

        <div className="p-5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/60 shadow-sm space-y-2">
          <span className="text-xs font-bold text-blue-900 dark:text-blue-300">Net Merchant Payout (95%)</span>
          <div className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 font-mono">
            {formatRwf(data?.runningTotalNet || 0)}
          </div>
          <span className="text-[11px] text-blue-800/80 dark:text-blue-300/80">Available balance in your account</span>
        </div>
      </div>

      {/* Payouts Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 font-mono text-xs">Loading payouts ledger...</div>
        ) : !data || data.payouts.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">No payout records yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="py-3.5 px-4">Payout ID & Order</th>
                  <th className="py-3.5 px-4">Settled At</th>
                  <th className="py-3.5 px-4">Gross Subtotal</th>
                  <th className="py-3.5 px-4">Platform Fee (5%)</th>
                  <th className="py-3.5 px-4">Net Merchant Share (95%)</th>
                  <th className="py-3.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.payouts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono">
                      <div className="font-bold text-slate-900 dark:text-white">#{p.orderId}</div>
                      <div className="text-[10px] text-slate-400">{p.id}</div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 font-mono">
                      {formatDateTime(p.createdAt)}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-700 dark:text-slate-300">
                      {formatRwf(p.grossAmount)}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-rose-500">
                      -{formatRwf(p.platformFeeAmount)}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                      {formatRwf(p.netAmount)}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center gap-1 w-fit">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Settled</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
