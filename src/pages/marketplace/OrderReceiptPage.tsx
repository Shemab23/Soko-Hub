import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Store, 
  Truck, 
  Package, 
  ArrowLeft, 
  ShieldCheck, 
  RefreshCw, 
  ExternalLink 
} from 'lucide-react';
import { api } from '../../api/client';
import { Order } from '../../types';
import { formatRwf, formatDateTime } from '../../utils/format';

export const OrderReceiptPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pollCount, setPollCount] = useState(0);
  const [pollTimedOut, setPollTimedOut] = useState(false);

  useEffect(() => {
    if (orderId) {
      loadReceipt(orderId);
    }
  }, [orderId]);

  // Polling logic for webhook confirmation (Engine Rule 5)
  useEffect(() => {
    if (!orderId || !order || order.status === 'paid' || order.status === 'failed' || pollTimedOut) {
      return;
    }

    const interval = setInterval(async () => {
      setPollCount((prev) => {
        if (prev >= 15) {
          // ~30 seconds (15 polls * 2s)
          setPollTimedOut(true);
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });

      try {
        const statusRes = await api.orders.pollOrderStatus(orderId);
        if (statusRes.status === 'paid') {
          // Reload full receipt
          const full = await api.orders.getReceipt(orderId);
          setOrder(full);
        }
      } catch (e) {
        console.error('Polling error:', e);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [orderId, order, pollTimedOut]);

  const loadReceipt = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.orders.getReceipt(id);
      setOrder(res);
      setPollTimedOut(false);
      setPollCount(0);
    } catch (err: unknown) {
      const e = err as { status?: number; error?: string };
      if (e.status === 404) {
        setError('404 Not Found: You do not have permission to view this order receipt (Guest session isolation).');
      } else {
        setError(e.error || 'Failed to load order receipt.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center animate-pulse space-y-4">
        <div className="w-16 h-16 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto" />
        <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded mx-auto" />
        <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Access Denied or Not Found</h2>
        <p className="text-xs text-slate-500 mb-6 leading-relaxed">
          {error || 'This order could not be located.'}
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Marketplace</span>
        </Link>
      </div>
    );
  }

  const isPending = order.status === 'pending';
  const isPaid = order.status === 'paid';
  const isFailed = order.status === 'failed';

  // Group items by shop for delivery timeline
  const shopGroupMap = new Map<string, { shopName: string; items: typeof order.items }>();
  for (const item of order.items) {
    if (!shopGroupMap.has(item.shopId)) {
      shopGroupMap.set(item.shopId, { shopName: item.shopName, items: [] });
    }
    shopGroupMap.get(item.shopId)!.items.push(item);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Return button */}
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Continue Shopping</span>
      </Link>

      {/* Main Status Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden mb-8">
        {/* Top Status Header */}
        <div
          className={`p-6 sm:p-8 text-center border-b ${
            isPaid
              ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/40'
              : isPending
              ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/40'
              : 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/40'
          }`}
        >
          {isPaid && (
            <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-9 h-9" />
            </div>
          )}
          {isPending && (
            <div className="w-16 h-16 rounded-full bg-amber-500 text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-amber-500/20 animate-pulse">
              <Clock className="w-9 h-9" />
            </div>
          )}
          {isFailed && (
            <div className="w-16 h-16 rounded-full bg-rose-500 text-white flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-9 h-9" />
            </div>
          )}

          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {isPaid
              ? 'Payment Confirmed & Verified!'
              : isPending
              ? 'Confirming your payment…'
              : 'Payment Failed or Declined'}
          </h1>

          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            {isPaid
              ? `Receipt reference ${order.paymentReference || 'N/A'}. A separate dispatch share has been credited to each merchant.`
              : isPending
              ? 'Engine rule: an order never becomes paid from the browser return URL alone. Awaiting verified webhook from payment engine...'
              : 'The simulated provider declined the transaction. No inventory was deducted.'}
          </p>

          {/* Polling Timeout Warning */}
          {isPending && pollTimedOut && (
            <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-800 dark:text-amber-200 inline-flex flex-col sm:flex-row items-center gap-3">
              <span>Webhook confirmation timed out after 30 seconds.</span>
              <button
                onClick={() => loadReceipt(order.id)}
                className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Check again</span>
              </button>
            </div>
          )}

          {isPending && !pollTimedOut && (
            <div className="mt-3 inline-flex items-center gap-2 text-xs font-mono text-amber-700 dark:text-amber-300">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>Polling webhook listener (attempt #{pollCount + 1})...</span>
            </div>
          )}
        </div>

        {/* Order Meta bar */}
        <div className="p-4 bg-slate-50/50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">Order ID</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">#{order.id}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">Date</span>
            <span className="text-slate-700 dark:text-slate-300">{formatDateTime(order.createdAt)}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">Gateway</span>
            <span className="font-bold uppercase text-blue-600 dark:text-blue-400">{order.gateway}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">Status</span>
            <span
              className={`font-bold capitalize ${
                isPaid ? 'text-emerald-600' : isPending ? 'text-amber-600' : 'text-rose-600'
              }`}
            >
              {order.status}
            </span>
          </div>
        </div>

        {/* Delivery Timeline per Shop */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Fulfillment & Delivery per Merchant
          </h2>

          <div className="space-y-4">
            {Array.from(shopGroupMap.entries()).map(([shopId, { shopName, items }]) => (
              <div
                key={shopId}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Store className="w-4 h-4 text-blue-500" />
                    <span className="font-bold text-sm text-slate-900 dark:text-white">{shopName}</span>
                  </div>
                  <span className="text-xs font-bold text-blue-600 font-mono">
                    {formatRwf(order.shopSubtotals[shopId] || 0)}
                  </span>
                </div>

                {/* Items in this shop */}
                <div className="space-y-2 pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Package className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-slate-700 dark:text-slate-300">
                          {item.quantity}x {item.productName}
                        </span>
                      </div>

                      {/* Delivery Status Chip (only if shop has delivery module) */}
                      {item.deliveryStatus ? (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize flex items-center gap-1 ${
                            item.deliveryStatus === 'delivered'
                              ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                              : item.deliveryStatus === 'shipped'
                              ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                              : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                          }`}
                        >
                          <Truck className="w-3 h-3" />
                          <span>{item.deliveryStatus.replace('_', ' ')}</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">Direct In-Store Pick</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Customer & Address Details */}
        <div className="p-6 bg-slate-50/40 dark:bg-slate-800/30 flex flex-col sm:flex-row justify-between gap-6 text-xs">
          <div>
            <span className="font-bold uppercase tracking-wider text-[10px] text-slate-400 block mb-1">
              Customer Details
            </span>
            <div className="font-semibold text-slate-800 dark:text-slate-200">{order.customerName}</div>
            <div className="text-slate-500">{order.customerEmail}</div>
            <div className="text-slate-500">{order.customerPhone}</div>
          </div>

          <div>
            <span className="font-bold uppercase tracking-wider text-[10px] text-slate-400 block mb-1">
              Delivery Address
            </span>
            <div className="font-semibold text-slate-800 dark:text-slate-200">{order.shippingAddress}</div>
            <div className="text-slate-500">{order.city}, Rwanda</div>
          </div>

          <div className="sm:text-right">
            <span className="font-bold uppercase tracking-wider text-[10px] text-slate-400 block mb-1">
              Total Amount
            </span>
            <div className="font-extrabold text-xl text-blue-600 dark:text-blue-400 font-mono">
              {formatRwf(order.totalAmount)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Inclusive of all local taxes</div>
          </div>
        </div>
      </div>
    </div>
  );
};
