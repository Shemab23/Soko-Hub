import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, 
  Trash2, 
  Store, 
  ArrowRight, 
  ArrowLeft, 
  AlertCircle, 
  CheckCircle2, 
  CreditCard,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { api } from '../../api/client';
import { Product, Shop, PaymentGatewayId } from '../../types';
import { formatRwf } from '../../utils/format';

interface CartPageProps {
  onCartCountChange?: () => void;
}

export const CartPage: React.FC<CartPageProps> = ({ onCartCountChange }) => {
  const navigate = useNavigate();
  const [cartData, setCartData] = useState<{
    items: { product: Product; quantity: number; shop: Shop }[];
    shopGroups: { shop: Shop; items: { product: Product; quantity: number }[]; subtotal: number }[];
    totalAmount: number;
    availableGateways: PaymentGatewayId[];
    unavailableGateways: { gateway: PaymentGatewayId; missingByShops: string[] }[];
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    setLoading(true);
    try {
      const data = await api.cart.getCart();
      setCartData(data);
      if (onCartCountChange) onCartCountChange();
    } catch (err) {
      console.error('Error loading cart:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQty = async (productId: string, newQty: number) => {
    setUpdatingId(productId);
    try {
      const updated = await api.cart.updateItem(productId, newQty);
      setCartData(updated);
      if (onCartCountChange) onCartCountChange();
    } catch (err: unknown) {
      const e = err as { error?: string };
      alert(e.error || 'Failed to update item quantity');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleClearCart = async () => {
    if (window.confirm('Clear all items from your cart?')) {
      await api.cart.clear();
      await loadCart();
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center animate-pulse space-y-4">
        <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded mx-auto" />
        <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
      </div>
    );
  }

  const isEmpty = !cartData || cartData.items.length === 0;

  if (isEmpty) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center mx-auto mb-4">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2">Your Cart is Empty</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-sm mx-auto">
          Add items from multiple shops in the marketplace and pay together in one single transaction.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Browse Marketplace</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Shopping Cart
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {cartData.items.length} items across {cartData.shopGroups.length} independent shops
          </p>
        </div>

        <button
          onClick={handleClearCart}
          className="text-xs font-semibold text-rose-500 hover:text-rose-700 flex items-center gap-1.5 cursor-pointer p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30"
        >
          <Trash2 className="w-4 h-4" />
          <span>Empty Cart</span>
        </button>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Grouped by Shop */}
        <div className="lg:col-span-8 space-y-6">
          {cartData.shopGroups.map(({ shop, items, subtotal }) => (
            <div
              key={shop.id}
              className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm"
            >
              {/* Shop Header */}
              <div className="p-4 bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-600/10 text-blue-600 flex items-center justify-center">
                    <Store className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-sm text-slate-900 dark:text-white">{shop.name}</span>
                    <span className="text-[11px] text-slate-400 block">{shop.location}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-slate-400 uppercase font-mono">Shop Subtotal</span>
                  <div className="font-extrabold text-sm text-blue-600 dark:text-blue-400">
                    {formatRwf(subtotal)}
                  </div>
                </div>
              </div>

              {/* Items in this shop */}
              <div className="p-4 divide-y divide-slate-100 dark:divide-slate-800">
                {items.map(({ product, quantity }) => {
                  const isUpdating = updatingId === product.id;

                  return (
                    <div key={product.id} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <Link
                          to={`/product/${product.id}`}
                          className="font-bold text-sm text-slate-900 dark:text-white hover:text-blue-600 transition-colors line-clamp-1"
                        >
                          {product.name}
                        </Link>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {formatRwf(product.price)} each • <span className="font-mono">{product.unit}</span>
                        </div>
                      </div>

                      {/* Quantity Stepper */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                          <button
                            onClick={() => handleUpdateQty(product.id, quantity - 1)}
                            disabled={isUpdating}
                            className="px-2.5 py-1 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                          >
                            -
                          </button>
                          <span className="px-3 py-1 text-xs font-bold font-mono">
                            {quantity}
                          </span>
                          <button
                            onClick={() => handleUpdateQty(product.id, quantity + 1)}
                            disabled={isUpdating || quantity >= product.stock}
                            className="px-2.5 py-1 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer disabled:opacity-40"
                          >
                            +
                          </button>
                        </div>

                        <div className="w-24 text-right">
                          <span className="font-bold text-sm text-slate-900 dark:text-white">
                            {formatRwf(product.price * quantity)}
                          </span>
                        </div>

                        <button
                          onClick={() => handleUpdateQty(product.id, 0)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 rounded cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Right Column: Order Summary & Gateway Policy */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
          <h2 className="font-bold text-lg text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
            Summary
          </h2>

          <div className="space-y-2.5 text-xs">
            {cartData.shopGroups.map(({ shop, subtotal }) => (
              <div key={shop.id} className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>{shop.name}</span>
                <span className="font-medium text-slate-900 dark:text-white">{formatRwf(subtotal)}</span>
              </div>
            ))}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex justify-between text-sm font-extrabold text-slate-900 dark:text-white">
              <span>Grand Total</span>
              <span className="text-blue-600 dark:text-blue-400 text-lg">{formatRwf(cartData.totalAmount)}</span>
            </div>
          </div>

          {/* Gateway Intersection Preview */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Payment Gateway Compatibility
            </span>

            {cartData.availableGateways.length > 0 ? (
              <div className="space-y-1">
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Mutual gateways accepted by all shops:
                </span>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {cartData.availableGateways.map((gw) => (
                    <span
                      key={gw}
                      className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 uppercase"
                    >
                      {gw === 'flutterwave' ? 'Flutterwave (MoMo)' : gw}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-xs text-rose-500 font-semibold flex items-start gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  No common payment gateway exists across all shops in this cart! You will need to check out separately.
                </span>
              </div>
            )}

            {/* Explanation of unavailable gateways */}
            {cartData.unavailableGateways.length > 0 && (
              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 space-y-1">
                {cartData.unavailableGateways.map(({ gateway, missingByShops }) => (
                  <p key={gateway} className="text-[11px] text-amber-700 dark:text-amber-400 leading-snug">
                    • <strong>{gateway === 'flutterwave' ? 'Mobile money' : gateway}</strong> is unavailable because{' '}
                    <em>{missingByShops.join(' & ')}</em> does not accept it.
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* Security note */}
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Prices and stock will be re-verified strictly on the server during checkout.</span>
          </div>

          {/* Proceed to checkout CTA */}
          <button
            onClick={() => navigate('/checkout')}
            disabled={cartData.availableGateways.length === 0}
            className={`w-full py-3.5 px-4 rounded-xl text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
              cartData.availableGateways.length === 0
                ? 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <span>Proceed to Checkout</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
