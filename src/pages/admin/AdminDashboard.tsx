import React, { useState, useEffect } from 'react';
import { useOutletContext, Link, useSearchParams } from 'react-router-dom';
import { 
  DollarSign, 
  ShoppingBag, 
  AlertTriangle, 
  TrendingUp, 
  Plus, 
  ArrowRight, 
  CheckCircle2, 
  Package, 
  Settings, 
  Sparkles,
  BarChart3,
  Truck,
  FileText
} from 'lucide-react';
import { api } from '../../api/client';
import { Shop, Product, Order, OrderItem } from '../../types';
import { formatRwf } from '../../utils/format';

export const AdminDashboard: React.FC = () => {
  const { shop } = useOutletContext<{ shop: Shop; reloadShop: () => void }>();
  const [searchParams] = useSearchParams();
  const isFirstRun = searchParams.get('firstRun') === 'true';

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<{ order: Order; shopItems: OrderItem[]; shopSubtotal: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [shop.slug]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const prods = await api.admin.getProducts(shop.slug);
      setProducts(prods);

      if (shop.enabledModules.includes('orders')) {
        const ords = await api.admin.getOrders(shop.slug);
        setOrders(ords);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const lowStockProducts = products.filter((p) => p.stock <= 5);
  const pendingOrders = orders.filter((o) => o.order.status === 'pending');
  const todayRevenue = orders
    .filter((o) => o.order.status === 'paid')
    .slice(0, 5)
    .reduce((sum, o) => sum + o.shopSubtotal, 0);

  const disabledModules = [
    { id: 'analytics', name: 'Analytics & Customers', icon: <BarChart3 className="w-4 h-4 text-indigo-500" />, teaser: 'Track repeat customer lifetime spend and sales trends.' },
    { id: 'deliveries', name: 'Delivery Processing', icon: <Truck className="w-4 h-4 text-amber-500" />, teaser: 'Advance shipments from pending dispatch to delivered.' },
    { id: 'quotations', name: 'Wholesale Quotations', icon: <FileText className="w-4 h-4 text-emerald-500" />, teaser: 'Receive B2B wholesale quotation requests from hotels and bulk buyers.' },
  ].filter((m) => !shop.enabledModules.includes(m.id as any));

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Welcome back, {shop.name}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Managing products and payouts for your shop on Soko Hub.
          </p>
        </div>

        <Link
          to={`/t/${shop.slug}/admin/products`}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5 w-fit cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </Link>
      </div>

      {/* First Run Checklist */}
      {isFirstRun && (
        <div className="p-6 rounded-3xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-blue-900 dark:text-blue-300">
            <Sparkles className="w-5 h-5 text-blue-500" />
            <h2 className="font-extrabold text-base">New Shop Onboarding Checklist</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-blue-100 dark:border-blue-950 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Shop domain generated</span>
            </div>
            <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-blue-100 dark:border-blue-950 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Payment routes configured</span>
            </div>
            <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-blue-100 dark:border-blue-950 flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-500" />
              <Link to={`/t/${shop.slug}/admin/products`} className="text-blue-600 font-bold hover:underline">
                Add your first products →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Gross Revenue */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold">Recent Sales</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
            {formatRwf(todayRevenue)}
          </div>
          <span className="text-[11px] text-slate-400">Gross subtotal from your items</span>
        </div>

        {/* Current Net Balance */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold">Settled Balance</span>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 font-mono">
            {formatRwf(shop.balance)}
          </div>
          <span className="text-[11px] text-slate-400">95% net after 5% platform fee</span>
        </div>

        {/* Pending Orders */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold">Total Orders</span>
            <ShoppingBag className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
            {orders.length}
          </div>
          <span className="text-[11px] text-slate-400">
            {shop.enabledModules.includes('orders') ? 'Tracked in Order History' : 'Module not enabled'}
          </span>
        </div>

        {/* Low Stock Alerts */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold">Low Stock Items</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className={`text-2xl font-extrabold font-mono ${lowStockProducts.length > 0 ? 'text-amber-600' : 'text-slate-900 dark:text-white'}`}>
            {lowStockProducts.length}
          </div>
          <span className="text-[11px] text-slate-400">Highlighted at &le;5 units</span>
        </div>
      </div>

      {/* Low Stock Table (Rule: highlighted at 5 or fewer) */}
      {lowStockProducts.length > 0 && (
        <div className="p-6 rounded-3xl bg-amber-500/10 border border-amber-500/20 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h2 className="font-extrabold text-base">Low Stock Alert (&le; 5 units remaining)</h2>
            </div>
            <Link
              to={`/t/${shop.slug}/admin/products`}
              className="text-xs font-bold text-amber-700 dark:text-amber-300 hover:underline"
            >
              Manage stock →
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            {lowStockProducts.map((p) => (
              <div
                key={p.id}
                className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-amber-200 dark:border-amber-900/40 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900 dark:text-white truncate max-w-[150px]">{p.name}</div>
                  <div className="text-slate-500 text-[11px] font-mono">{formatRwf(p.price)}</div>
                </div>
                <span className="px-2 py-1 rounded bg-amber-500 text-white font-mono font-bold text-xs">
                  {p.stock} left
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Feature Gating "Enable module" teasers for disabled modules */}
      {disabledModules.length > 0 && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-base text-slate-900 dark:text-white">Expand Your Shop Capabilities</h2>
              <p className="text-xs text-slate-500">Optional feature modules currently disabled for {shop.name}</p>
            </div>
            <Link
              to={`/t/${shop.slug}/admin/settings`}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Shop Settings</span>
            </Link>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            {disabledModules.map((m) => (
              <div
                key={m.id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    {m.icon}
                    <span className="font-bold text-sm text-slate-900 dark:text-white">{m.name}</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed mb-4">{m.teaser}</p>
                </div>
                <Link
                  to={`/t/${shop.slug}/admin/settings`}
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  <span>Enable in Settings</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
