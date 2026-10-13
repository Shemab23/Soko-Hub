import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShoppingBag, 
  Store, 
  Tag, 
  Check, 
  AlertTriangle, 
  Filter, 
  Layers, 
  FileText, 
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { api } from '../../api/client';
import { Product, Shop } from '../../types';
import { formatRwf } from '../../utils/format';
import { CompareShopsModal } from '../../components/common/CompareShopsModal';

interface MarketplacePageProps {
  searchQuery: string;
  onCartCountChange?: () => void;
}

export const MarketplacePage: React.FC<MarketplacePageProps> = ({ searchQuery, onCartCountChange }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedShopId, setSelectedShopId] = useState<string>('all');
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [addingProductId, setAddingProductId] = useState<string | null>(null);

  // Compare modal state
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [compareProductName, setCompareProductName] = useState('');

  // Quotation modal state
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [quoteProduct, setQuoteProduct] = useState<{ product: Product; shop: Shop } | null>(null);
  const [quoteFormData, setQuoteFormData] = useState({
    name: '',
    email: '',
    phone: '',
    quantity: 50,
    notes: '',
  });
  const [quoteSubmitted, setQuoteSubmitted] = useState(false);

  useEffect(() => {
    loadMarketplace();
  }, []);

  const loadMarketplace = async () => {
    setLoading(true);
    setError(null);
    try {
      const [prods, shps] = await Promise.all([
        api.marketplace.getProducts(),
        api.marketplace.getShops(),
      ]);
      setProducts(prods);
      setShops(shps);
    } catch (err) {
      setError('Failed to load marketplace products.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (product: Product) => {
    setAddingProductId(product.id);
    try {
      await api.cart.addItem(product.id, 1);
      if (onCartCountChange) onCartCountChange();
    } catch (err: unknown) {
      const e = err as { error?: string };
      alert(e.error || 'Could not add product to cart');
    } finally {
      setAddingProductId(null);
    }
  };

  const handleRequestQuote = (product: Product, shop: Shop) => {
    setQuoteProduct({ product, shop });
    setQuoteFormData({
      name: '',
      email: '',
      phone: '+250 788 ',
      quantity: 50,
      notes: '',
    });
    setQuoteSubmitted(false);
    setQuoteModalOpen(true);
  };

  const submitQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteProduct) return;
    try {
      await api.marketplace.requestQuotation({
        shopId: quoteProduct.shop.id,
        productId: quoteProduct.product.id,
        customerName: quoteFormData.name,
        customerEmail: quoteFormData.email,
        customerPhone: quoteFormData.phone,
        requestedQuantity: Number(quoteFormData.quantity),
        notes: quoteFormData.notes,
      });
      setQuoteSubmitted(true);
      setTimeout(() => {
        setQuoteModalOpen(false);
      }, 2000);
    } catch (err: unknown) {
      const e = err as { error?: string };
      alert(e.error || 'Failed to submit quote');
    }
  };

  // Find identical items sold by multiple shops
  const productNameGroups = products.reduce<Record<string, Product[]>>((acc, p) => {
    acc[p.name] = acc[p.name] || [];
    acc[p.name].push(p);
    return acc;
  }, {});

  const filteredProducts = products.filter((p) => {
    if (selectedShopId !== 'all' && p.shopId !== selectedShopId) return false;
    if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
    if (inStockOnly && p.stock <= 0) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchDesc = p.description.toLowerCase().includes(q);
      const matchCat = p.category.toLowerCase().includes(q);
      if (!matchName && !matchDesc && !matchCat) return false;
    }
    return true;
  });

  const categories = Array.from(new Set(products.map((p) => p.category)));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Welcome */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-800 text-white p-8 sm:p-12 mb-8 shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-blue-100 text-xs font-semibold uppercase tracking-wider mb-4 border border-white/10">
            <Sparkles className="w-3.5 h-3.5 text-blue-300" />
            <span>Kigali Multi-Tenant Marketplace</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3 leading-tight">
            One Unified Cart.<br />Multiple Independent Rwandan Shops.
          </h1>
          <p className="text-blue-100/90 text-sm sm:text-base leading-relaxed mb-6">
            Browse fresh local groceries, solar electronics, and stationery. Fill your cart across different merchants, pay once with server-verified prices, and each shop gets its direct payout.
          </p>
          <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
            <span className="px-3 py-1.5 rounded-lg bg-black/20 backdrop-blur-sm border border-white/10">
              Active Shops: {shops.length}
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-black/20 backdrop-blur-sm border border-white/10">
              Currency: RWF (no decimals)
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-black/20 backdrop-blur-sm border border-white/10">
              Zero Login for Guests
            </span>
          </div>
        </div>

        {/* Decorative background circle */}
        <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-white/5 blur-2xl pointer-events-none" />
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 mb-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Shop selector */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mr-1">
            <Store className="w-3.5 h-3.5" /> Shop:
          </span>
          <button
            onClick={() => setSelectedShopId('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
              selectedShopId === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            All Shops ({products.length})
          </button>
          {shops.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedShopId(s.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                selectedShopId === s.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>

        {/* In-stock toggle and category filter */}
        <div className="flex items-center gap-4">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-800 border-none text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <label className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <span>In stock only</span>
          </label>
        </div>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-pulse">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div key={n} className="bg-slate-200 dark:bg-slate-800 h-80 rounded-2xl" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12 text-rose-500 font-semibold">{error}</div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
          <Store className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="font-bold text-slate-700 dark:text-slate-200 text-base">No products found</h3>
          <p className="text-xs text-slate-500 mt-1">Try clearing filters or search query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => {
            const shop = shops.find((s) => s.id === product.shopId);
            const isLowStock = product.stock > 0 && product.stock <= 5;
            const isOutOfStock = product.stock <= 0;
            const hasCrossVendors = (productNameGroups[product.name]?.length || 0) > 1;
            const supportsQuotes = shop?.enabledModules.includes('quotations');

            return (
              <div
                key={product.id}
                className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group"
              >
                {/* Product Card Top Badges */}
                <div className="p-4 pb-0 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-1">
                      <Store className="w-3 h-3 text-blue-500" />
                      <span>{shop?.name || 'Shop'}</span>
                    </span>

                    {product.badge && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                        {product.badge}
                      </span>
                    )}
                  </div>

                  {isLowStock && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      <span>Low ({product.stock})</span>
                    </span>
                  )}
                  {isOutOfStock && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                      Out of stock
                    </span>
                  )}
                </div>

                {/* Body Info */}
                <div className="p-4 flex-1 flex flex-col">
                  <Link
                    to={`/product/${product.id}`}
                    className="font-bold text-base text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-2 mb-1"
                  >
                    {product.name}
                  </Link>

                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-4">
                    {product.description}
                  </p>

                  {/* Multi-Vendor Comparison Trigger */}
                  {hasCrossVendors && (
                    <button
                      onClick={() => {
                        setCompareProductName(product.name);
                        setCompareModalOpen(true);
                      }}
                      className="mb-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 border border-indigo-200/50 dark:border-indigo-800/50 transition-colors cursor-pointer w-fit"
                    >
                      <Layers className="w-3 h-3 text-indigo-500" />
                      <span>Compare {productNameGroups[product.name].length} shops selling this item</span>
                    </button>
                  )}

                  <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800 flex items-baseline justify-between">
                    <div>
                      <span className="text-lg font-extrabold text-blue-600 dark:text-blue-400">
                        {formatRwf(product.price)}
                      </span>
                      <span className="text-[11px] text-slate-400 ml-1">/ {product.unit}</span>
                    </div>

                    <span className="text-[10px] text-slate-400 font-mono">
                      Stock: {product.stock}
                    </span>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="p-3 bg-slate-50/50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  <button
                    onClick={() => handleAddToCart(product)}
                    disabled={isOutOfStock || addingProductId === product.id}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      isOutOfStock
                        ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>{addingProductId === product.id ? 'Adding...' : 'Add to cart'}</span>
                  </button>

                  {/* Quotations button only when module is enabled */}
                  {supportsQuotes && shop && (
                    <button
                      onClick={() => handleRequestQuote(product, shop)}
                      className="p-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                      title="Request wholesale quotation for bulk order"
                    >
                      <FileText className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Multi-Vendor Comparison Modal */}
      {compareProductName && (
        <CompareShopsModal
          isOpen={compareModalOpen}
          productName={compareProductName}
          matchedProducts={(productNameGroups[compareProductName] || []).map((p) => ({
            product: p,
            shop: shops.find((s) => s.id === p.shopId),
          }))}
          onClose={() => setCompareModalOpen(false)}
          onAddToCart={(p) => handleAddToCart(p)}
        />
      )}

      {/* Quotation Request Modal */}
      {quoteModalOpen && quoteProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              Request a Bulk Quote
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Send an inquiry directly to <strong>{quoteProduct.shop.name}</strong> for{' '}
              <em>{quoteProduct.product.name}</em>.
            </p>

            {quoteSubmitted ? (
              <div className="py-8 text-center text-emerald-600 dark:text-emerald-400 space-y-2">
                <CheckCircle2 className="w-12 h-12 mx-auto" />
                <div className="font-bold">Quotation Request Sent!</div>
                <p className="text-xs text-slate-500">The merchant will review and respond with wholesale terms.</p>
              </div>
            ) : (
              <form onSubmit={submitQuote} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Your Name / Organization
                  </label>
                  <input
                    type="text"
                    required
                    value={quoteFormData.name}
                    onChange={(e) => setQuoteFormData({ ...quoteFormData, name: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:border-blue-500"
                    placeholder="e.g. Kigali Serena Hotel"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      value={quoteFormData.email}
                      onChange={(e) => setQuoteFormData({ ...quoteFormData, email: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:border-blue-500"
                      placeholder="buyer@domain.rw"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      required
                      value={quoteFormData.phone}
                      onChange={(e) => setQuoteFormData({ ...quoteFormData, phone: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Requested Quantity ({quoteProduct.product.unit})
                  </label>
                  <input
                    type="number"
                    min="10"
                    required
                    value={quoteFormData.quantity}
                    onChange={(e) => setQuoteFormData({ ...quoteFormData, quantity: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Special Notes / Delivery Schedule
                  </label>
                  <textarea
                    rows={2}
                    value={quoteFormData.notes}
                    onChange={(e) => setQuoteFormData({ ...quoteFormData, notes: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:border-blue-500"
                    placeholder="Weekly recurring delivery, custom packaging..."
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setQuoteModalOpen(false)}
                    className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer"
                  >
                    Submit Quotation Request
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
