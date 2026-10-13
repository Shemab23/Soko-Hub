import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Lock, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  UserCheck, 
  ArrowRight 
} from 'lucide-react';
import { api } from '../../api/client';
import { Order } from '../../types';
import { formatRwf } from '../../utils/format';

export const PayPalPaymentPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // PayPal flow states: 1 = mock account login / select funding, 2 = review & approve
  const [ppStep, setPpStep] = useState<1 | 2>(1);
  const [ppEmail, setPpEmail] = useState('buyer.rwanda@wallet.mock');

  // Callback injection condition
  const [callbackCondition, setCallbackCondition] = useState<
    'success' | 'declined' | 'abandoned' | 'delayed_10s' | 'duplicate_webhook' | 'corrupt_signature'
  >('success');

  useEffect(() => {
    if (orderId) {
      loadOrder(orderId);
    }
  }, [orderId]);

  const loadOrder = async (id: string) => {
    setLoading(true);
    try {
      const ord = await api.payment.getOrderForPayment(id);
      setOrder(ord);
    } catch (err: unknown) {
      const e = err as { error?: string };
      setError(e.error || 'Order not found');
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePayment = async () => {
    if (!order) return;
    setProcessing(true);

    try {
      await api.payment.triggerProviderCondition('paypal', order.id, callbackCondition);

      if (callbackCondition === 'abandoned') {
        alert('PayPal session abandoned. Returning to cart.');
        navigate('/cart');
        return;
      }

      navigate(`/orders/${order.id}`);
    } catch (err: unknown) {
      const e = err as { error?: string };
      alert(`Simulation error: ${e.error || 'Failed'}`);
      setProcessing(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-500 font-mono text-sm">Initializing PayPal-style gateway...</div>;
  }

  if (error || !order) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-lg text-center">
        <h2 className="text-lg font-bold text-rose-600 mb-2">Order Not Found</h2>
        <p className="text-xs text-slate-500 mb-4">{error}</p>
        <button onClick={() => navigate('/')} className="text-blue-600 text-xs font-semibold hover:underline">
          Return to Marketplace
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] bg-[#f5f7fa] dark:bg-slate-950 flex flex-col justify-center items-center p-4">
      <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#003087] text-white text-xs font-mono font-bold shadow-md">
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
        <span>SIMULATED PAYPAL-STYLE CHECKOUT • NO REAL MONEY</span>
      </div>

      <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        {/* PayPal Header */}
        <div className="p-6 bg-[#003087] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="font-extrabold text-2xl tracking-tighter italic text-amber-400">
              P<span className="text-blue-300">P</span>
            </div>
            <div>
              <span className="text-[10px] text-blue-200 uppercase tracking-widest block font-bold">
                Wallet Checkout
              </span>
              <span className="font-bold text-sm">Soko Hub Multi-Vendor</span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] text-blue-200 block">Total Due</span>
            <span className="text-lg font-bold text-amber-400 font-mono">
              {formatRwf(order.totalAmount)}
            </span>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {ppStep === 1 ? (
            <div className="space-y-4">
              <div className="text-center py-2">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Log in to your Simulated PayPal
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Pay securely using your simulated wallet balance or linked card
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  PayPal Email
                </label>
                <input
                  type="email"
                  value={ppEmail}
                  onChange={(e) => setPpEmail(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value="••••••••••••"
                  readOnly
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-400 focus:outline-none"
                />
              </div>

              <button
                type="button"
                onClick={() => setPpStep(2)}
                className="w-full py-3 bg-[#0070ba] hover:bg-[#003087] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Continue to Review</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-xs flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">Logged in as:</span>
                  <span className="text-slate-600 dark:text-slate-400">{ppEmail}</span>
                </div>
                <button
                  onClick={() => setPpStep(1)}
                  className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                >
                  Change
                </button>
              </div>

              {/* Simulated Funding Source */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-xs space-y-1">
                <div className="flex justify-between font-bold text-slate-800 dark:text-slate-200">
                  <span>Simulated PayPal Balance</span>
                  <span className="text-emerald-600">Available: 850,000 RWF</span>
                </div>
                <p className="text-slate-500 text-[11px]">Covers entire cart amount across all {Object.keys(order.shopSubtotals).length} merchants.</p>
              </div>

              {/* INJECT CALLBACK CONDITION SELECTOR */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <label className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider">
                    Inject Callback Condition:
                  </label>
                </div>
                <select
                  value={callbackCondition}
                  onChange={(e) =>
                    setCallbackCondition(
                      e.target.value as
                        | 'success'
                        | 'declined'
                        | 'abandoned'
                        | 'delayed_10s'
                        | 'duplicate_webhook'
                        | 'corrupt_signature'
                    )
                  }
                  className="w-full p-2 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 border border-amber-500/40 text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="success">Success (Instant Webhook)</option>
                  <option value="declined">Payment declined by PayPal</option>
                  <option value="abandoned">Customer abandoned window</option>
                  <option value="delayed_10s">Success with 10 s webhook delay</option>
                  <option value="duplicate_webhook">Success with duplicate webhook</option>
                  <option value="corrupt_signature">Corrupt signature (401 Rejection)</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleApprovePayment}
                disabled={processing}
                className="w-full py-3.5 bg-[#ffc439] hover:bg-[#f4bb34] text-slate-900 text-sm font-extrabold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <UserCheck className="w-4 h-4" />
                <span>
                  {processing ? 'Processing Webhook...' : `Approve Payment (${formatRwf(order.totalAmount)})`}
                </span>
              </button>
            </div>
          )}
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 text-center flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Simulated PayPal Buyer Protection</span>
        </div>
      </div>
    </div>
  );
};
