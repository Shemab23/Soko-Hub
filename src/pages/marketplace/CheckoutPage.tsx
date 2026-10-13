import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  ShieldCheck, 
  CreditCard, 
  Store, 
  AlertCircle, 
  Check, 
  Lock,
  Phone,
  Mail,
  MapPin,
  User
} from 'lucide-react';
import { api } from '../../api/client';
import { Product, Shop, PaymentGatewayId } from '../../types';
import { formatRwf } from '../../utils/format';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const [cartData, setCartData] = useState<{
    items: { product: Product; quantity: number; shop: Shop }[];
    shopGroups: { shop: Shop; items: { product: Product; quantity: number }[]; subtotal: number }[];
    totalAmount: number;
    availableGateways: PaymentGatewayId[];
    unavailableGateways: { gateway: PaymentGatewayId; missingByShops: string[] }[];
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Fields (Guest, no account ever required)
  const [formData, setFormData] = useState({
    name: 'Jean-Paul Mugisha',
    email: 'jp.mugisha@gmail.com',
    phone: '+250 788 111 222',
    address: 'KG 14 Ave, House 28, Kimironko',
    city: 'Kigali - Gasabo',
  });

  const [selectedGateway, setSelectedGateway] = useState<PaymentGatewayId | ''>('');

  useEffect(() => {
    loadCheckoutCart();
  }, []);

  const loadCheckoutCart = async () => {
    setLoading(true);
    try {
      const data = await api.cart.getCart();
      setCartData(data);
      if (data.availableGateways.length > 0) {
        setSelectedGateway(data.availableGateways[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGateway) {
      setError('Please select a payment provider.');
      return;
    }
    if (!cartData || cartData.items.length === 0) {
      setError('Cart is empty.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const result = await api.checkout.start({
        customerName: formData.name,
        customerEmail: formData.email,
        customerPhone: formData.phone,
        shippingAddress: formData.address,
        city: formData.city,
        gateway: selectedGateway,
      });

      // Navigate to simulated provider checkout URL
      navigate(result.paymentUrl);
    } catch (err: unknown) {
      const e = err as { error?: string };
      setError(e.error || 'Failed to initiate checkout. Please try again.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center animate-pulse space-y-4">
        <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded mx-auto" />
        <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
      </div>
    );
  }

  if (!cartData || cartData.items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold mb-4">No items in cart to checkout</h2>
        <Link to="/" className="text-blue-600 font-semibold hover:underline">
          Return to Marketplace
        </Link>
      </div>
    );
  }

  const noCommonGateway = cartData.availableGateways.length === 0;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        to="/cart"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Cart</span>
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          Guest Checkout
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          No sign up required. Pay once for items across {cartData.shopGroups.length} independent shops.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleStartPayment} className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Left Form: Delivery & Gateway Selection */}
        <div className="lg:col-span-7 space-y-6">
          {/* Guest Details */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              <span>Contact & Delivery Info</span>
            </h2>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Email Address (for receipt)
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Phone (MTN / Airtel / Local)
                </label>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Physical Delivery Address
                </label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  City / District
                </label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Gateway Picker: Strict Intersection Enforcement */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <div>
              <h2 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-600" />
                <span>Select Payment Provider</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Only providers accepted by all {cartData.shopGroups.length} merchants in your cart are shown.
              </p>
            </div>

            {noCommonGateway ? (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs space-y-2">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  <span>No Common Payment Gateway Found</span>
                </div>
                <p>
                  The merchants in your cart do not share an intersecting payment gateway. Please split your purchase by shop to proceed.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {cartData.availableGateways.map((gw) => {
                  const isSelected = selectedGateway === gw;
                  let title = 'Stripe-style Card Payment';
                  let desc = 'Visa, Mastercard, American Express simulation';
                  if (gw === 'paypal') {
                    title = 'PayPal-style Wallet Checkout';
                    desc = 'Simulated one-click wallet sign in & authorization';
                  } else if (gw === 'flutterwave') {
                    title = 'Flutterwave-style Mobile Money';
                    desc = 'MTN Mobile Money & Airtel Money Rwanda';
                  }

                  return (
                    <label
                      key={gw}
                      className={`block p-4 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/20 shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="gateway"
                            value={gw}
                            checked={isSelected}
                            onChange={() => setSelectedGateway(gw)}
                            className="text-blue-600 focus:ring-blue-500 w-4 h-4"
                          />
                          <div>
                            <div className="font-bold text-sm text-slate-900 dark:text-white">{title}</div>
                            <div className="text-xs text-slate-500">{desc}</div>
                          </div>
                        </div>

                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold">
                          {gw}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}

            {/* Explanation of Unavailable Gateways */}
            {cartData.unavailableGateways.length > 0 && (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                <span className="font-bold uppercase tracking-wider text-[10px] block opacity-80">
                  Hidden Gateways (Intersection Policy):
                </span>
                {cartData.unavailableGateways.map(({ gateway, missingByShops }) => (
                  <p key={gateway} className="leading-snug">
                    • <strong>{gateway === 'flutterwave' ? 'Mobile money' : gateway}</strong> is unavailable because{' '}
                    <em>{missingByShops.join(' & ')}</em> does not accept it.
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Summary */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
          <h2 className="font-bold text-base text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
            Order Breakdown by Merchant
          </h2>

          <div className="space-y-4">
            {cartData.shopGroups.map(({ shop, items, subtotal }) => (
              <div key={shop.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-2 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
                  <span className="flex items-center gap-1.5">
                    <Store className="w-3.5 h-3.5 text-blue-500" />
                    <span>{shop.name}</span>
                  </span>
                  <span className="text-blue-600 dark:text-blue-400">{formatRwf(subtotal)}</span>
                </div>

                <div className="text-[11px] text-slate-500 space-y-1 pl-5">
                  {items.map((i) => (
                    <div key={i.product.id} className="flex justify-between">
                      <span className="truncate max-w-[180px]">{i.quantity}x {i.product.name}</span>
                      <span>{formatRwf(i.product.price * i.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="font-bold text-sm text-slate-900 dark:text-white">Total Due</span>
            <span className="font-extrabold text-xl text-blue-600 dark:text-blue-400">
              {formatRwf(cartData.totalAmount)}
            </span>
          </div>

          {/* Critical engine note */}
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/60 text-xs text-blue-900 dark:text-blue-300 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Prices are verified on the server.</span>
              <p className="text-[11px] opacity-80 mt-0.5">
                The client only submits product IDs and quantities; the server recomputes totals directly from the database.
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || noCommonGateway || !selectedGateway}
            className={`w-full py-4 px-4 rounded-xl text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
              submitting || noCommonGateway || !selectedGateway
                ? 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>{submitting ? 'Verifying with Server...' : `Proceed to Pay ${formatRwf(cartData.totalAmount)}`}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
