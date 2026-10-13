import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  CreditCard, 
  Lock, 
  ShieldCheck, 
  ArrowRight, 
  AlertTriangle, 
  CheckCircle2, 
  ExternalLink 
} from 'lucide-react';
import { api } from '../../api/client';
import { Order } from '../../types';
import { formatRwf } from '../../utils/format';

export const StripePaymentPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  // Card form state
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [expiry, setExpiry] = useState('12 / 28');
  const [cvc, setCvc] = useState('123');

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

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    setProcessing(true);

    try {
      await api.payment.triggerProviderCondition('stripe', order.id, callbackCondition);

      if (callbackCondition === 'abandoned') {
        alert('Payment marked abandoned. Returning to cart.');
        navigate('/cart');
        return;
      }

      // Engine Rule 5: Order receipt polling
      // Navigate to receipt page which polls order until paid via webhook
      navigate(`/orders/${order.id}`);
    } catch (err: unknown) {
      const e = err as { error?: string };
      alert(`Simulation error: ${e.error || 'Failed'}`);
      setProcessing(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-500 font-mono text-sm">Initializing Stripe-style gateway...</div>;
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
    <div className="min-h-[85vh] bg-slate-100 dark:bg-slate-950 flex flex-col justify-center items-center p-4">
      {/* Simulation Badge */}
      <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 text-slate-100 dark:bg-white dark:text-slate-900 text-xs font-mono font-bold shadow-md">
        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
        <span>SIMULATED STRIPE-STYLE CHECKOUT • NO REAL MONEY</span>
      </div>

      <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        {/* Stripe Header */}
        <div className="p-6 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
              S
            </div>
            <div>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Pay Merchant Pool
              </span>
              <span className="font-extrabold text-slate-900 dark:text-white text-base">
                Order #{order.id}
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400 block">Total</span>
            <span className="text-lg font-extrabold text-blue-600 dark:text-blue-400 font-mono">
              {formatRwf(order.totalAmount)}
            </span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmitPayment} className="p-6 space-y-5">
          {/* Card Form */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Card Number
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full text-xs font-mono p-3 pl-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
                <CreditCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Expires
                </label>
                <input
                  type="text"
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  className="w-full text-xs font-mono p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  CVC
                </label>
                <input
                  type="text"
                  value={cvc}
                  onChange={(e) => setCvc(e.target.value)}
                  className="w-full text-xs font-mono p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
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
              <option value="declined">Card declined (payment.failed)</option>
              <option value="abandoned">Customer abandoned (No payment)</option>
              <option value="delayed_10s">Success with 10 s webhook delay</option>
              <option value="duplicate_webhook">Success with duplicate webhook (Idempotency)</option>
              <option value="corrupt_signature">Corrupt signature (401 Rejection)</option>
            </select>
            <p className="text-[11px] text-amber-800 dark:text-amber-300/80 leading-snug">
              Tests how the engine handles webhooks, delays, duplicate events, and signature tampering.
            </p>
          </div>

          {/* Pay Button */}
          <button
            type="submit"
            disabled={processing}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Lock className="w-4 h-4" />
            <span>
              {processing ? 'Processing Webhook...' : `Pay ${formatRwf(order.totalAmount)}`}
            </span>
          </button>
        </form>

        {/* Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 text-center flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Simulated 256-bit SSL encryption. Order marked paid strictly via webhook.</span>
        </div>
      </div>
    </div>
  );
};
