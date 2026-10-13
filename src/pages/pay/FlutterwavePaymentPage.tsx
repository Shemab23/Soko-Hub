import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Smartphone, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  PhoneCall, 
  Loader2 
} from 'lucide-react';
import { api } from '../../api/client';
import { Order } from '../../types';
import { formatRwf } from '../../utils/format';

export const FlutterwavePaymentPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Flutterwave Mobile Money options: MTN MoMo Rwanda vs Airtel Money
  const [network, setNetwork] = useState<'mtn' | 'airtel'>('mtn');
  const [phoneNumber, setPhoneNumber] = useState('+250 788 111 222');
  const [ussdStep, setUssdStep] = useState<'input' | 'waiting_ussd'>('input');
  const [processing, setProcessing] = useState(false);

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
      if (ord.customerPhone) {
        setPhoneNumber(ord.customerPhone);
      }
    } catch (err: unknown) {
      const e = err as { error?: string };
      setError(e.error || 'Order not found');
    } finally {
      setLoading(false);
    }
  };

  const handleSendPushPrompt = (e: React.FormEvent) => {
    e.preventDefault();
    setUssdStep('waiting_ussd');
  };

  const handleAuthorizeOnPhone = async () => {
    if (!order) return;
    setProcessing(true);

    try {
      await api.payment.triggerProviderCondition('flutterwave', order.id, callbackCondition);

      if (callbackCondition === 'abandoned') {
        alert('USSD session expired or cancelled on handset. Returning to cart.');
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
    return <div className="p-12 text-center text-slate-500 font-mono text-sm">Initializing Flutterwave-style Mobile Money gateway...</div>;
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
    <div className="min-h-[85vh] bg-[#fffaf5] dark:bg-slate-950 flex flex-col justify-center items-center p-4">
      {/* Simulation Badge */}
      <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f5a623] text-slate-900 text-xs font-mono font-bold shadow-md">
        <span className="w-2 h-2 rounded-full bg-slate-900 animate-pulse" />
        <span>SIMULATED FLUTTERWAVE-STYLE MOBILE MONEY • NO REAL MONEY</span>
      </div>

      <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        {/* Flutterwave Header */}
        <div className="p-6 bg-gradient-to-r from-orange-500 to-amber-500 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white text-orange-600 flex items-center justify-center font-extrabold text-base shadow-sm">
              FW
            </div>
            <div>
              <span className="text-[10px] text-orange-100 uppercase tracking-wider block font-bold">
                Mobile Money Rwanda
              </span>
              <span className="font-extrabold text-sm">Order #{order.id}</span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] text-orange-100 block">Total</span>
            <span className="text-lg font-extrabold font-mono text-white">
              {formatRwf(order.totalAmount)}
            </span>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {ussdStep === 'input' ? (
            <form onSubmit={handleSendPushPrompt} className="space-y-4">
              {/* Network Toggle */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
                  Choose Mobile Carrier:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setNetwork('mtn')}
                    className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 cursor-pointer transition-all ${
                      network === 'mtn'
                        ? 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300 ring-2 ring-amber-500/30'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <span className="text-sm font-extrabold text-amber-500">MTN MoMo</span>
                    <span className="text-[10px] font-normal opacity-70">*182# Rwanda</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNetwork('airtel')}
                    className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 cursor-pointer transition-all ${
                      network === 'airtel'
                        ? 'border-red-500 bg-red-500/10 text-red-700 dark:text-red-300 ring-2 ring-red-500/30'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <span className="text-sm font-extrabold text-red-500">Airtel Money</span>
                    <span className="text-[10px] font-normal opacity-70">*500# Rwanda</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Registered Mobile Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+250 788 000 000"
                    className="w-full text-xs font-mono p-3 pl-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-orange-500"
                  />
                  <Smartphone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
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
                  <option value="declined">Insufficient Mobile Funds / Declined</option>
                  <option value="abandoned">Prompt timed out on handset (Abandoned)</option>
                  <option value="delayed_10s">Success with 10 s webhook delay</option>
                  <option value="duplicate_webhook">Success with duplicate webhook</option>
                  <option value="corrupt_signature">Corrupt signature (401 Rejection)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Send USSD Payment Prompt</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <div className="space-y-5 text-center py-4">
              <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center mx-auto animate-pulse">
                <PhoneCall className="w-8 h-8" />
              </div>

              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Approve on your Phone
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  A USSD prompt has been simulated to <strong>{phoneNumber}</strong> ({network.toUpperCase()}).
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-mono text-left space-y-1">
                <div className="text-[10px] text-slate-400 uppercase font-bold">Simulated Handset Prompt:</div>
                <div className="text-slate-800 dark:text-slate-200 font-semibold">
                  &ldquo;Authorize payment of {formatRwf(order.totalAmount)} to Soko Hub? Enter MoMo PIN:&rdquo;
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setUssdStep('input')}
                  className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  Change Number
                </button>

                <button
                  type="button"
                  onClick={handleAuthorizeOnPhone}
                  disabled={processing}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Transmitting Webhook...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Simulate Handset Approval</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 text-center flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Simulated MTN Rwanda & Airtel Money integration</span>
        </div>
      </div>
    </div>
  );
};
