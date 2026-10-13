import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Store, 
  Check, 
  ArrowRight, 
  ArrowLeft, 
  ShieldCheck, 
  Layers, 
  CreditCard, 
  CheckCircle2, 
  AlertCircle,
  Package,
  ShoppingBag,
  Users,
  BarChart3,
  Truck,
  FileText,
  ClipboardList
} from 'lucide-react';
import { api } from '../../api/client';
import { simDb } from '../../sim/db';
import { FeatureModuleId, PaymentGatewayId, Shop } from '../../types';

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [shopName, setShopName] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState<Shop['category']>('Groceries');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('Kigali - Nyarugenge');
  const [phone, setPhone] = useState('+250 788 000 000');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Selected Modules
  const [enabledModules, setEnabledModules] = useState<FeatureModuleId[]>([
    'orders',
    'analytics',
    'deliveries',
  ]);

  // Selected Gateways
  const [enabledGateways, setEnabledGateways] = useState<PaymentGatewayId[]>([
    'stripe',
    'paypal',
    'flutterwave',
  ]);

  // Live slug auto-generation and availability check
  const handleNameChange = (name: string) => {
    setShopName(name);
    const generatedSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-');
    setSlug(generatedSlug);
  };

  const isSlugAvailable = slug.length >= 3 && !simDb.getShopBySlug(slug);

  // Password strength meter
  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score; // 0 to 4
  };
  const pwStrength = getPasswordStrength(password);

  const toggleModule = (mod: FeatureModuleId) => {
    if (enabledModules.includes(mod)) {
      setEnabledModules(enabledModules.filter((m) => m !== mod));
    } else {
      setEnabledModules([...enabledModules, mod]);
    }
  };

  const toggleGateway = (gw: PaymentGatewayId) => {
    if (enabledGateways.includes(gw)) {
      if (enabledGateways.length <= 1) {
        alert('You must enable at least one payment gateway for your shop.');
        return;
      }
      setEnabledGateways(enabledGateways.filter((g) => g !== gw));
    } else {
      setEnabledGateways([...enabledGateways, gw]);
    }
  };

  const handleFinishOnboarding = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const result = await api.auth.registerShop({
        name: shopName,
        slug,
        email,
        password,
        category,
        description,
        location,
        phone,
        enabledModules,
        enabledGateways,
      });

      // Redirect directly to the new shop's admin dashboard
      navigate(`/t/${result.shop.slug}/admin?firstRun=true`);
    } catch (err: unknown) {
      const e = err as { error?: string };
      setError(e.error || 'Failed to complete registration');
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Wizard Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
          <span>Step {step} of 4</span>
          <span>
            {step === 1 && 'Shop Identity'}
            {step === 2 && 'Owner Security'}
            {step === 3 && 'Choose Modules'}
            {step === 4 && 'Payment Gateways & Review'}
          </span>
        </div>
        <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex">
          <div
            className="bg-blue-600 transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: SHOP IDENTITY */}
      {step === 1 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Shop Identity & Domain</h2>
            <p className="text-xs text-slate-500 mt-1">
              Set up your merchant brand. In production, your shop will resolve to its own subdomain.
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Shop Name
            </label>
            <input
              type="text"
              required
              value={shopName}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Butare Artisanal Crafts"
              className="w-full text-sm p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Shop Slug & Domain URL
            </label>
            <div className="flex items-center">
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="butare-crafts"
                className="flex-1 text-sm font-mono p-3 rounded-l-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-blue-500"
              />
              <span className="px-4 py-3 bg-slate-100 dark:bg-slate-800 border border-l-0 border-slate-300 dark:border-slate-700 rounded-r-xl text-xs font-mono text-slate-500 select-none">
                .soko.rw
              </span>
            </div>

            <div className="mt-1.5 flex items-center gap-1.5 text-xs font-mono">
              {slug.length < 3 ? (
                <span className="text-slate-400">Slug must be at least 3 characters.</span>
              ) : isSlugAvailable ? (
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>Available: https://{slug}.soko.rw (Route: /t/{slug}/admin)</span>
                </span>
              ) : (
                <span className="text-rose-500 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>This slug is already taken. Please choose another.</span>
                </span>
              )}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Shop['category'])}
                className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 cursor-pointer"
              >
                <option value="Groceries">Groceries & Produce</option>
                <option value="Electronics">Electronics & Solar</option>
                <option value="Books">Books & Stationery</option>
                <option value="Fashion">Fashion & Apparel</option>
                <option value="General">General Retail</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Physical Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Kimironko, Kigali"
                className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell shoppers about your products and specialties..."
              className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="button"
              disabled={!shopName || !isSlugAvailable}
              onClick={() => setStep(2)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-40"
            >
              <span>Next: Owner Account</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: OWNER SECURITY */}
      {step === 2 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Owner Credentials</h2>
            <p className="text-xs text-slate-500 mt-1">
              Passwords are stored only as simulated secure hash strings (<code className="font-mono">hash$sha256$mock...</code>).
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Admin Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="owner@yourshop.rw"
              className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters..."
              className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-blue-500"
            />

            {/* Password strength meter */}
            <div className="mt-2 space-y-1">
              <div className="flex gap-1.5 h-1.5">
                {[1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className={`flex-1 rounded-full transition-all ${
                      pwStrength >= level
                        ? pwStrength <= 2
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                        : 'bg-slate-200 dark:bg-slate-800'
                    }`}
                  />
                ))}
              </div>
              <div className="text-[11px] text-slate-400">
                Strength: {pwStrength <= 1 ? 'Weak' : pwStrength <= 2 ? 'Fair' : pwStrength === 3 ? 'Good' : 'Strong'}
              </div>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Back
            </button>
            <button
              type="button"
              disabled={!email || password.length < 6}
              onClick={() => setStep(3)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-40"
            >
              <span>Next: Choose Modules</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: CHOOSE MODULES WITH LIVE PREVIEW */}
      {step === 3 && (
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Module Pickers */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Feature Modules</h2>
              <p className="text-xs text-slate-500 mt-1">
                Customize your shop&apos;s admin workspace. Enable only the operational tools you need.
              </p>
            </div>

            {/* Always-on notice */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
              <span className="font-bold text-slate-900 dark:text-white">Always Enabled:</span> Products catalog
              (with low stock alerts at &le;5), Payouts ledger (gross, 5% platform fee, net), and Shop Settings.
            </div>

            {/* Module Options */}
            <div className="space-y-3">
              {[
                {
                  id: 'orders' as FeatureModuleId,
                  title: 'Order History',
                  icon: <ShoppingBag className="w-4 h-4 text-blue-500" />,
                  desc: 'View shop-specific line items inside unified multi-shop customer orders.',
                },
                {
                  id: 'analytics' as FeatureModuleId,
                  title: 'Customer Tracking & Analytics',
                  icon: <BarChart3 className="w-4 h-4 text-indigo-500" />,
                  desc: 'Lifetime spend, revenue by day, top products, returning customer rates.',
                },
                {
                  id: 'deliveries' as FeatureModuleId,
                  title: 'Delivery Processing',
                  icon: <Truck className="w-4 h-4 text-amber-500" />,
                  desc: 'State progression (pending dispatch → shipped → delivered) with customer receipt updates.',
                },
                {
                  id: 'quotations' as FeatureModuleId,
                  title: 'Quotations',
                  icon: <FileText className="w-4 h-4 text-emerald-500" />,
                  desc: 'Adds &quot;Request a quote&quot; button to your marketplace products for wholesale pricing.',
                },
                {
                  id: 'purchase_requests' as FeatureModuleId,
                  title: 'Purchase Requests',
                  icon: <ClipboardList className="w-4 h-4 text-purple-500" />,
                  desc: 'Submit and track restock requests directly to agricultural or equipment suppliers.',
                },
              ].map((m) => {
                const isChecked = enabledModules.includes(m.id);

                return (
                  <div
                    key={m.id}
                    onClick={() => toggleModule(m.id)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 select-none ${
                      isChecked
                        ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-500 shadow-sm'
                        : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="mt-0.5">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}} // Handled by div click
                        className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                      />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {m.icon}
                        <span className="font-bold text-sm text-slate-900 dark:text-white">{m.title}</span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                        {m.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Next: Gateways & Review</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* LIVE SIDEBAR PREVIEW */}
          <div className="lg:col-span-5 bg-slate-900 text-slate-300 rounded-3xl p-6 shadow-xl border border-slate-800">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
                Live Admin Sidebar Preview
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>

            <div className="space-y-1 text-xs">
              <div className="px-3 py-2 rounded-lg bg-blue-600 text-white font-bold flex items-center gap-2">
                <Store className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </div>
              <div className="px-3 py-2 rounded-lg text-slate-400 flex items-center gap-2">
                <Package className="w-3.5 h-3.5" />
                <span>Products (Always On)</span>
              </div>

              {enabledModules.includes('orders') && (
                <div className="px-3 py-2 rounded-lg text-slate-300 flex items-center gap-2">
                  <ShoppingBag className="w-3.5 h-3.5 text-blue-400" />
                  <span>Orders</span>
                </div>
              )}

              {enabledModules.includes('analytics') && (
                <>
                  <div className="px-3 py-2 rounded-lg text-slate-300 flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Customers</span>
                  </div>
                  <div className="px-3 py-2 rounded-lg text-slate-300 flex items-center gap-2">
                    <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Analytics</span>
                  </div>
                </>
              )}

              {enabledModules.includes('deliveries') && (
                <div className="px-3 py-2 rounded-lg text-slate-300 flex items-center gap-2">
                  <Truck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Deliveries</span>
                </div>
              )}

              {enabledModules.includes('quotations') && (
                <div className="px-3 py-2 rounded-lg text-slate-300 flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Quotations</span>
                </div>
              )}

              {enabledModules.includes('purchase_requests') && (
                <div className="px-3 py-2 rounded-lg text-slate-300 flex items-center gap-2">
                  <ClipboardList className="w-3.5 h-3.5 text-purple-400" />
                  <span>Purchase Requests</span>
                </div>
              )}

              <div className="px-3 py-2 rounded-lg text-slate-400 flex items-center gap-2">
                <CreditCard className="w-3.5 h-3.5" />
                <span>Payouts (Always On)</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-500 leading-relaxed">
              If an endpoint of an un-enabled module is called directly in the URL, the simulated backend refuses it with <strong>403 module_not_enabled</strong>.
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: PAYMENT GATEWAYS & REVIEW */}
      {step === 4 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Accepted Payment Gateways</h2>
            <p className="text-xs text-slate-500 mt-1">
              Select which payment providers your shop will accept. Soko Hub only offers gateways mutually accepted by all shops in a customer&apos;s cart.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { id: 'stripe' as PaymentGatewayId, name: 'Stripe-Style', desc: 'Credit / Debit Cards' },
              { id: 'paypal' as PaymentGatewayId, name: 'PayPal-Style', desc: 'Digital Wallet' },
              { id: 'flutterwave' as PaymentGatewayId, name: 'Flutterwave-Style', desc: 'MTN & Airtel MoMo' },
            ].map((gw) => {
              const isChecked = enabledGateways.includes(gw.id);

              return (
                <div
                  key={gw.id}
                  onClick={() => toggleGateway(gw.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                    isChecked
                      ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-500 shadow-sm'
                      : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">{gw.name}</span>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  <span className="text-xs text-slate-500">{gw.desc}</span>
                </div>
              );
            })}
          </div>

          {/* Review Summary */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-xs space-y-2">
            <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[10px]">
              Ready to Provision Tenant:
            </h3>
            <div className="grid sm:grid-cols-2 gap-2 text-slate-600 dark:text-slate-300">
              <div>Shop: <strong>{shopName}</strong> ({slug}.soko.rw)</div>
              <div>Admin: <strong>{email}</strong></div>
              <div>Modules: <strong>{enabledModules.length + 2}</strong> enabled</div>
              <div>Gateways: <strong>{enabledGateways.join(', ')}</strong></div>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Back
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={handleFinishOnboarding}
              className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{submitting ? 'Creating Shop...' : 'Create Shop & Open Dashboard'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
