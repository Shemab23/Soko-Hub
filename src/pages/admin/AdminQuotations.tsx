import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { FileText, CheckCircle2, XCircle, Clock, Send, X } from 'lucide-react';
import { api } from '../../api/client';
import { Shop, QuotationRequest } from '../../types';
import { formatRwf, formatDateTime } from '../../utils/format';
import { ModuleNotEnabled } from './ModuleNotEnabled';

export const AdminQuotations: React.FC = () => {
  const { shop } = useOutletContext<{ shop: Shop; reloadShop: () => void }>();
  const [quotes, setQuotes] = useState<QuotationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);

  // Response dialog state
  const [activeQuote, setActiveQuote] = useState<QuotationRequest | null>(null);
  const [offeredPrice, setOfferedPrice] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadQuotations();
  }, [shop.slug]);

  const loadQuotations = async () => {
    setLoading(true);
    setErrorStatus(null);
    try {
      const data = await api.admin.getQuotations(shop.slug);
      setQuotes(data);
    } catch (err: unknown) {
      const e = err as { status?: number };
      if (e.status === 403) {
        setErrorStatus(403);
      }
    } finally {
      setLoading(false);
    }
  };

  if (errorStatus === 403 || !shop.enabledModules.includes('quotations')) {
    return <ModuleNotEnabled moduleName="Quotations" moduleId="quotations" />;
  }

  const handleRespond = async (status: 'quoted' | 'rejected') => {
    if (!activeQuote) return;
    setSubmitting(true);
    try {
      await api.admin.respondQuotation(shop.slug, activeQuote.id, {
        status,
        offeredPrice: status === 'quoted' ? offeredPrice : undefined,
      });
      setActiveQuote(null);
      await loadQuotations();
    } catch (err: unknown) {
      const e = err as { error?: string };
      alert(e.error || 'Failed to submit quote response');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
          Wholesale Quotation Inquiries
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Gated module: inbound pricing inquiries submitted by institutions and bulk buyers through your marketplace products.
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 font-mono text-xs">Loading quote inquiries...</div>
      ) : quotes.length === 0 ? (
        <div className="p-12 text-center text-slate-400 text-xs bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
          No quotation inquiries yet.
        </div>
      ) : (
        <div className="space-y-4">
          {quotes.map((q) => (
            <div
              key={q.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">{q.customerName}</span>
                  <span className="text-xs text-slate-400 font-mono">({q.customerEmail} • {q.customerPhone})</span>
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-300">
                  Item: <strong className="text-blue-600 dark:text-blue-400">{q.productName}</strong> • Requested Quantity:{' '}
                  <span className="font-bold font-mono">{q.requestedQuantity} units</span>
                </div>

                {q.notes && (
                  <p className="text-xs text-slate-500 italic bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                    &ldquo;{q.notes}&rdquo;
                  </p>
                )}

                <div className="text-[11px] text-slate-400">Received: {formatDateTime(q.createdAt)}</div>
              </div>

              {/* Status & Response */}
              <div className="flex items-center gap-3 shrink-0">
                {q.status === 'pending' ? (
                  <button
                    onClick={() => {
                      setActiveQuote(q);
                      setOfferedPrice(7000);
                    }}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Wholesale Quote</span>
                  </button>
                ) : q.status === 'quoted' ? (
                  <div className="text-right">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                      Quoted: {formatRwf(q.offeredPrice || 0)} / unit
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Responded</span>
                  </div>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20">
                    Declined
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Response Dialog */}
      {activeQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Respond to #{activeQuote.id}
              </h3>
              <button onClick={() => setActiveQuote(null)} className="p-1 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Set wholesale price offer for <strong>{activeQuote.requestedQuantity}</strong> units of{' '}
              {activeQuote.productName}:
            </p>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Offered Price per Unit (RWF)
              </label>
              <input
                type="number"
                min="100"
                step="100"
                value={offeredPrice}
                onChange={(e) => setOfferedPrice(Number(e.target.value))}
                className="w-full text-xs font-mono p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="pt-2 flex items-center justify-between gap-2">
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleRespond('rejected')}
                className="px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl"
              >
                Reject Request
              </button>

              <button
                type="button"
                disabled={submitting || offeredPrice <= 0}
                onClick={() => handleRespond('quoted')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
              >
                {submitting ? 'Transmitting...' : 'Send Quote'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
