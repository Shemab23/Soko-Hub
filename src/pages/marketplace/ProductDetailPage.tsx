import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Store, 
  ShoppingBag, 
  Check, 
  AlertTriangle, 
  ShieldCheck, 
  Truck, 
  FileText,
  CreditCard
} from 'lucide-react';
import { api } from '../../api/client';
import { Product, Shop } from '../../types';
import { formatRwf } from '../../utils/format';

interface ProductDetailPageProps {
  onCartCountChange?: () => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({ onCartCountChange }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<{ product: Product; shop: Shop; quoteSupported: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);

  useEffect(() => {
    if (id) {
      loadDetail(id);
    }
  }, [id]);

  const loadDetail = async (productId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.marketplace.getProduct(productId);
      setData(res);
      setQuantity(1);
    } catch (err: unknown) {
      const e = err as { error?: string };
      setError(e.error || 'Product not found');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!data) return;
    setIsAdding(true);
    try {
      await api.cart.addItem(data.product.id, quantity);
      if (onCartCountChange) onCartCountChange();
      setAddedSuccess(true);
      setTimeout(() => setAddedSuccess(false), 2500);
    } catch (err: unknown) {
      const e = err as { error?: string };
      alert(e.error || 'Could not add to cart');
    } finally {
      setIsAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 animate-pulse space-y-6">
        <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
        <div className="grid md:grid-cols-2 gap-8">
          <div className="h-80 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          <div className="space-y-4">
            <div className="h-8 w-3/4 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-6 w-1/4 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">Item Unavailable</h2>
        <p className="text-sm text-slate-500 mb-6">{error || 'This product does not exist or has been removed.'}</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Marketplace</span>
        </Link>
      </div>
    );
  }

  const { product, shop, quoteSupported } = data;
  const isLowStock = product.stock > 0 && product.stock <= 5;
  const isOutOfStock = product.stock <= 0;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-blue-600 dark:text-slate-400 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to All Products</span>
      </Link>

      <div className="grid md:grid-cols-12 gap-8 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
        {/* Left Visual Placeholder */}
        <div className="md:col-span-5 flex flex-col justify-between rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200/60 dark:from-slate-800 dark:to-slate-900/60 p-8 border border-slate-200/60 dark:border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 shadow-sm border border-slate-200 dark:border-slate-700">
              {product.category}
            </span>
            {product.badge && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-600 text-white shadow-sm">
                {product.badge}
              </span>
            )}
          </div>

          <div className="my-12 text-center">
            <div className="w-20 h-20 rounded-2xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-4">
              <Store className="w-10 h-10" />
            </div>
            <div className="font-bold text-slate-700 dark:text-slate-300 text-sm">
              {product.name}
            </div>
            <div className="text-xs text-slate-400 font-mono mt-1">SKU: {product.sku}</div>
          </div>

          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 justify-center">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Server Verified Price Guarantee</span>
          </div>
        </div>

        {/* Right Details */}
        <div className="md:col-span-7 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200/40 dark:border-blue-800/40 flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5" />
                <span>Sold by {shop.name}</span>
              </span>
              <span className="text-xs text-slate-400">• {shop.location}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-3">
              {product.name}
            </h1>

            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">
                {formatRwf(product.price)}
              </span>
              <span className="text-sm text-slate-400 font-medium">per {product.unit}</span>
            </div>

            <div className="prose dark:prose-invert text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
              <p>{product.description}</p>
            </div>

            {/* Stock status indicator */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 mb-6 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Inventory Status:</span>
              {isOutOfStock ? (
                <span className="text-xs font-bold text-rose-600 dark:text-rose-400">Out of Stock</span>
              ) : isLowStock ? (
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Only {product.stock} left in stock (Low inventory)
                </span>
              ) : (
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  In Stock ({product.stock} available)
                </span>
              )}
            </div>

            {/* Payment Gateways accepted by this merchant */}
            <div className="mb-6">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Merchant Accepted Gateways:
              </span>
              <div className="flex gap-2">
                {shop.enabledGateways.map((gw) => (
                  <span
                    key={gw}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 capitalize flex items-center gap-1"
                  >
                    <CreditCard className="w-3 h-3 text-blue-500" />
                    <span>{gw === 'flutterwave' ? 'Flutterwave / MoMo' : gw}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Cart Quantity & Add CTA */}
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-slate-300 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-800">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                  disabled={quantity <= 1 || isOutOfStock}
                >
                  -
                </button>
                <span className="px-4 py-2 text-xs font-bold text-slate-900 dark:text-white select-none">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="px-3 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                  disabled={quantity >= product.stock || isOutOfStock}
                >
                  +
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock || isAdding}
                className={`flex-1 py-3 px-6 rounded-xl text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  addedSuccess
                    ? 'bg-emerald-600 text-white'
                    : isOutOfStock
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {addedSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Added to Cart!</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    <span>{isAdding ? 'Adding...' : `Add to Cart • ${formatRwf(product.price * quantity)}`}</span>
                  </>
                )}
              </button>
            </div>

            {quoteSupported && (
              <p className="text-xs text-slate-500 text-center">
                Need bulk supplies? Return to marketplace card to request wholesale quotation.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
