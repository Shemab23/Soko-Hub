import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  ShoppingBag, 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  X, 
  Truck, 
  User, 
  MapPin, 
  CreditCard 
} from 'lucide-react';
import { api } from '../../api/client';
import { Shop, Order, OrderItem } from '../../types';
import { formatRwf, formatDateTime } from '../../utils/format';
import { ModuleNotEnabled } from './ModuleNotEnabled';

export const AdminOrders: React.FC = () => {
  const { shop } = useOutletContext<{ shop: Shop; reloadShop: () => void }>();
  const [orders, setOrders] = useState<{ order: Order; shopItems: OrderItem[]; shopSubtotal: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Selected Order Drawer
  const [selectedOrder, setSelectedOrder] = useState<{ order: Order; shopItems: OrderItem[]; shopSubtotal: number } | null>(null);

  useEffect(() => {
    loadOrders();
  }, [shop.slug]);

  const loadOrders = async () => {
    setLoading(true);
    setErrorStatus(null);
    try {
      const data = await api.admin.getOrders(shop.slug);
      setOrders(data);
    } catch (err: unknown) {
      const e = err as { status?: number };
      if (e.status === 403) {
        setErrorStatus(403);
      }
    } finally {
      setLoading(false);
    }
  };

  if (errorStatus === 403 || !shop.enabledModules.includes('orders')) {
    return <ModuleNotEnabled moduleName="Order History" moduleId="orders" />;
  }

  const filtered = orders.filter((o) => {
    if (statusFilter !== 'all' && o.order.status !== statusFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchCust = o.order.customerName.toLowerCase().includes(q) || o.order.customerEmail.toLowerCase().includes(q);
      const matchId = o.order.id.toLowerCase().includes(q);
      const matchItem = o.shopItems.some((i) => i.productName.toLowerCase().includes(q));
      if (!matchCust && !matchId && !matchItem) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Order History
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Tenant-isolated: shows strictly your shop&apos;s line items, even inside mixed multi-shop customer orders.
          </p>
        </div>

        <span className="text-xs font-mono px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/40 font-bold w-fit">
          {orders.length} Total Orders Recorded
        </span>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status:</span>
          {['all', 'paid', 'pending', 'cancelled'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize cursor-pointer transition-all ${
                statusFilter === st
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search order #, customer, item..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-3 py-1.5 text-xs rounded-lg bg-slate-100 dark:bg-slate-800 border-none text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 w-64"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 font-mono text-xs">Loading orders...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">No orders matching your criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="py-3.5 px-4">Order ID & Date</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Your Shop Line Items</th>
                  <th className="py-3.5 px-4">Your Share (Gross)</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((item) => {
                  const isPaid = item.order.status === 'paid';
                  const isMixed = Object.keys(item.order.shopSubtotals).length > 1;

                  return (
                    <tr
                      key={item.order.id}
                      onClick={() => setSelectedOrder(item)}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono">
                        <div className="font-bold text-blue-600 dark:text-blue-400">#{item.order.id}</div>
                        <div className="text-[11px] text-slate-400">{formatDateTime(item.order.createdAt)}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white">{item.order.customerName}</div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[140px]">{item.order.customerEmail}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          {item.shopItems.map((si) => (
                            <div key={si.id} className="text-slate-700 dark:text-slate-300 truncate max-w-[200px]">
                              {si.quantity}x {si.productName}
                            </div>
                          ))}
                        </div>
                        {isMixed && (
                          <span className="text-[10px] text-indigo-500 font-semibold block mt-1">
                            Part of multi-shop cart ({Object.keys(item.order.shopSubtotals).length} shops)
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                        {formatRwf(item.shopSubtotal)}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                            isPaid
                              ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                          }`}
                        >
                          {item.order.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right text-slate-400">
                        <ChevronRight className="w-4 h-4 ml-auto" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail Drawer */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 h-full shadow-2xl flex flex-col">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
                  Order Details
                </span>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  #{selectedOrder.order.id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
              {/* Customer */}
              <div className="space-y-2">
                <span className="font-bold uppercase tracking-wider text-[10px] text-slate-400 block">
                  Customer & Shipping
                </span>
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 space-y-1">
                  <div className="font-bold text-slate-900 dark:text-white text-sm">
                    {selectedOrder.order.customerName}
                  </div>
                  <div className="text-slate-500">{selectedOrder.order.customerEmail}</div>
                  <div className="text-slate-500">{selectedOrder.order.customerPhone}</div>
                  <div className="pt-2 text-slate-700 dark:text-slate-300 border-t border-slate-200/40 dark:border-slate-700/40">
                    <MapPin className="w-3.5 h-3.5 inline mr-1 text-blue-500" />
                    {selectedOrder.order.shippingAddress}, {selectedOrder.order.city}
                  </div>
                </div>
              </div>

              {/* Items belonging to this shop */}
              <div className="space-y-2">
                <span className="font-bold uppercase tracking-wider text-[10px] text-slate-400 block">
                  Your Line Items
                </span>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200/60 dark:border-slate-800 rounded-2xl overflow-hidden">
                  {selectedOrder.shopItems.map((i) => (
                    <div key={i.id} className="p-3.5 flex justify-between items-center bg-white dark:bg-slate-900">
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">{i.productName}</div>
                        <div className="text-[11px] text-slate-400">
                          {i.quantity} x {formatRwf(i.unitPrice)}
                        </div>
                      </div>
                      <span className="font-bold font-mono text-slate-900 dark:text-white">
                        {formatRwf(i.subtotal)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payout Math */}
              <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/60 space-y-2">
                <span className="font-bold uppercase tracking-wider text-[10px] text-blue-900 dark:text-blue-300 block">
                  Settlement Breakdown (Engine Rule 7)
                </span>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Gross Line Items:</span>
                  <span className="font-mono">{formatRwf(selectedOrder.shopSubtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Platform Fee (5%):</span>
                  <span className="font-mono text-rose-500">
                    -{formatRwf(Math.round(selectedOrder.shopSubtotal * 0.05))}
                  </span>
                </div>
                <div className="pt-2 border-t border-blue-200/50 dark:border-blue-800/50 flex justify-between font-extrabold text-blue-700 dark:text-blue-400 text-sm">
                  <span>Net Merchant Share (95%):</span>
                  <span className="font-mono">
                    {formatRwf(selectedOrder.shopSubtotal - Math.round(selectedOrder.shopSubtotal * 0.05))}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
