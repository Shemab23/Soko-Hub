import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  Truck, 
  Package, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  AlertCircle, 
  User, 
  MapPin 
} from 'lucide-react';
import { api } from '../../api/client';
import { Shop, Order, OrderItem } from '../../types';
import { formatDateTime } from '../../utils/format';
import { ModuleNotEnabled } from './ModuleNotEnabled';

export const AdminDeliveries: React.FC = () => {
  const { shop } = useOutletContext<{ shop: Shop; reloadShop: () => void }>();
  const [orders, setOrders] = useState<{ order: Order; shopItems: OrderItem[]; shopSubtotal: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);

  // Status progression confirm dialog
  const [confirmModal, setConfirmModal] = useState<{
    orderId: string;
    itemId: string;
    itemName: string;
    nextStatus: 'shipped' | 'delivered';
  } | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadDeliveries();
  }, [shop.slug]);

  const loadDeliveries = async () => {
    setLoading(true);
    setErrorStatus(null);
    try {
      const data = await api.admin.getOrders(shop.slug);
      // Only paid orders need dispatching
      setOrders(data.filter((d) => d.order.status === 'paid'));
    } catch (err: unknown) {
      const e = err as { status?: number };
      if (e.status === 403) {
        setErrorStatus(403);
      }
    } finally {
      setLoading(false);
    }
  };

  if (errorStatus === 403 || !shop.enabledModules.includes('deliveries')) {
    return <ModuleNotEnabled moduleName="Delivery Processing" moduleId="deliveries" />;
  }

  const handleAdvanceStatus = async () => {
    if (!confirmModal) return;
    setUpdating(true);
    try {
      await api.admin.updateDeliveryStatus(
        shop.slug,
        confirmModal.orderId,
        confirmModal.itemId,
        confirmModal.nextStatus
      );
      setConfirmModal(null);
      await loadDeliveries();
    } catch (err: unknown) {
      const e = err as { error?: string };
      alert(e.error || 'Failed to update delivery status');
    } finally {
      setUpdating(false);
    }
  };

  // Flatten all line items for delivery management
  const deliveryItems: { order: Order; item: OrderItem }[] = [];
  for (const o of orders) {
    for (const item of o.shopItems) {
      deliveryItems.push({ order: o.order, item });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
          Delivery Fulfillment
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Gated module: line items advance strictly forward: <code className="font-mono">pending_dispatch &rarr; shipped &rarr; delivered</code>. Customer receipt updates in real-time.
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 font-mono text-xs">Loading delivery shipments...</div>
      ) : deliveryItems.length === 0 ? (
        <div className="p-12 text-center text-slate-400 text-xs bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
          No items currently pending delivery.
        </div>
      ) : (
        <div className="space-y-4">
          {deliveryItems.map(({ order, item }) => {
            const status = item.deliveryStatus || 'pending_dispatch';

            return (
              <div
                key={item.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      {item.quantity}x {item.productName}
                    </span>
                    <span className="text-xs font-mono text-blue-600 dark:text-blue-400">
                      (Order #{order.id})
                    </span>
                  </div>

                  <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{order.customerName}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{order.shippingAddress}, {order.city}</span>
                    </span>
                    <span>•</span>
                    <span>Ordered: {formatDateTime(order.createdAt)}</span>
                  </div>
                </div>

                {/* Status and Action Buttons */}
                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider font-mono flex items-center gap-1.5 ${
                      status === 'delivered'
                        ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                        : status === 'shipped'
                        ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                        : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                    }`}
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>{status.replace('_', ' ')}</span>
                  </span>

                  {status === 'pending_dispatch' && (
                    <button
                      onClick={() =>
                        setConfirmModal({
                          orderId: order.id,
                          itemId: item.id,
                          itemName: item.productName,
                          nextStatus: 'shipped',
                        })
                      }
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <span>Mark Shipped</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {status === 'shipped' && (
                    <button
                      onClick={() =>
                        setConfirmModal({
                          orderId: order.id,
                          itemId: item.id,
                          itemName: item.productName,
                          nextStatus: 'delivered',
                        })
                      }
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <span>Confirm Delivered</span>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {status === 'delivered' && (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Fulfilled</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center mx-auto">
              <Truck className="w-6 h-6" />
            </div>

            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Confirm Status Transition
            </h3>

            <p className="text-xs text-slate-500 leading-relaxed">
              Are you sure you want to advance <strong>{confirmModal.itemName}</strong> to{' '}
              <strong className="text-blue-600 uppercase font-mono">{confirmModal.nextStatus}</strong>?
              Delivery transitions are forward-only and will update the customer receipt.
            </p>

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={updating}
                onClick={handleAdvanceStatus}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
              >
                {updating ? 'Updating...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
