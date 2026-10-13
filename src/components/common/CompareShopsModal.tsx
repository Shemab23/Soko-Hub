import React from 'react';
import { X, Check, ShoppingBag, Store, ShieldCheck, Tag } from 'lucide-react';
import { Product, Shop } from '../../types';
import { formatRwf } from '../../utils/format';

interface CompareShopsModalProps {
  productName: string;
  matchedProducts: { product: Product; shop?: Shop }[];
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
}

export const CompareShopsModal: React.FC<CompareShopsModalProps> = ({
  productName,
  matchedProducts,
  isOpen,
  onClose,
  onAddToCart,
}) => {
  if (!isOpen || matchedProducts.length === 0) return null;

  // Find lowest price
  const lowestPrice = Math.min(...matchedProducts.map((p) => p.product.price));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div>
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Multi-Vendor Price Comparison</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Comparing {matchedProducts.length} independent shops offering &ldquo;{productName}&rdquo;
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comparison List */}
        <div className="p-6 divide-y divide-slate-100 dark:divide-slate-800 space-y-4 max-h-[65vh] overflow-y-auto">
          {matchedProducts.map(({ product, shop }) => {
            const isLowest = product.price === lowestPrice;

            return (
              <div
                key={product.id}
                className={`pt-4 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border transition-all ${
                  isLowest
                    ? 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/60'
                    : 'bg-white dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <Store className="w-4 h-4 text-slate-400" />
                    <span className="font-bold text-slate-900 dark:text-white">{shop?.name || 'Local Merchant'}</span>
                    {isLowest && (
                      <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">
                        Best Price
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {shop?.location || 'Central Kigali'} • Stock: {product.stock} available
                  </p>

                  <div className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                    Accepted Gateways: <span className="font-mono text-slate-500 uppercase">{shop?.enabledGateways.join(', ')}</span>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 shrink-0">
                  <div>
                    <span className="text-lg font-extrabold text-blue-600 dark:text-blue-400">
                      {formatRwf(product.price)}
                    </span>
                    <span className="text-[11px] text-slate-400 block sm:text-right">per {product.unit}</span>
                  </div>

                  <button
                    onClick={() => {
                      onAddToCart(product);
                      onClose();
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Choose this shop</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Explanatory footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>Independent merchants manage their own prices and shipping. You can combine items from both shops into one single checkout payment.</span>
        </div>
      </div>
    </div>
  );
};
