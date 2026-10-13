import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  Settings, 
  Layers, 
  CreditCard, 
  Save, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw, 
  ShieldCheck, 
  Info 
} from 'lucide-react';
import { api } from '../../api/client';
import { Shop, FeatureModuleId, PaymentGatewayId } from '../../types';

export const AdminSettings: React.FC = () => {
  const { shop, reloadShop } = useOutletContext<{ shop: Shop; reloadShop: () => void }>();

  const [name, setName] = useState(shop.name);
  const [description, setDescription] = useState(shop.description);
  const [phone, setPhone] = useState(shop.phone);
  const [enabledModules, setEnabledModules] = useState<FeatureModuleId[]>(shop.enabledModules);
  const [enabledGateways, setEnabledGateways] = useState<PaymentGatewayId[]>(shop.enabledGateways);

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

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
        alert('You must accept at least one payment gateway.');
        return;
      }
      setEnabledGateways(enabledGateways.filter((g) => g !== gw));
    } else {
      setEnabledGateways([...enabledGateways, gw]);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      await api.admin.updateSettings(shop.slug, {
        name,
        description,
        phone,
        enabledModules,
        enabledGateways,
      });

      reloadShop();
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: unknown) {
      const e = err as { error?: string };
      alert(e.error || 'Failed to update shop settings');
    } finally {
      setSaving(false);
    }
  };

  const handleResetData = () => {
    if (window.confirm('Reset all demo data across Soko Hub to factory seed?')) {
      api.resetDatabase();
      window.location.reload();
    }
  };

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
          Shop Settings & Configuration
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          In production each shop would live at <code className="font-mono text-blue-600 font-bold">{shop.slug}.soko.rw</code>.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Settings updated successfully! Sidebar navigation and backend API gating reconfigured.</span>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-8">
        {/* Section 1: Shop Profile */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4">
          <h2 className="font-bold text-base text-slate-900 dark:text-white">
            Merchant Profile
          </h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Shop Display Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Contact Phone
              </label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Storefront Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Section 2: Modular Feature Toggles */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div>
            <h2 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>Feature Modules Configuration</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Turning a module off immediately hides its menu item AND the simulated server refuses its endpoints with 403. Historical data is preserved.
            </p>
          </div>

          <div className="space-y-3">
            {[
              {
                id: 'orders' as FeatureModuleId,
                title: 'Order History',
                desc: 'Only the shop&apos;s own line items, even inside mixed-shop orders. Detail drawer & status tracking.',
              },
              {
                id: 'analytics' as FeatureModuleId,
                title: 'Customer Tracking and Analytics',
                desc: 'Identified by email (lifetime spend, last purchase, new vs returning) and sales charts.',
              },
              {
                id: 'deliveries' as FeatureModuleId,
                title: 'Delivery Processing',
                desc: 'Line items advance pending dispatch → shipped → delivered with customer receipt updates.',
              },
              {
                id: 'quotations' as FeatureModuleId,
                title: 'Wholesale Quotations',
                desc: 'Enables "Request a quote" button on your products in marketplace for institutional buyers.',
              },
              {
                id: 'purchase_requests' as FeatureModuleId,
                title: 'Purchase Requests',
                desc: 'Restock procurement requests to suppliers with status approvals.',
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
                      : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}}
                    className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 mt-0.5"
                  />
                  <div>
                    <span className="font-bold text-sm text-slate-900 dark:text-white block">{m.title}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 block">{m.desc}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 3: Accepted Payment Gateways */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div>
            <h2 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-blue-600" />
              <span>Accepted Payment Gateways</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Select which gateways your shop supports. At checkout, customers are only offered gateways mutually accepted by all shops in their cart.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { id: 'stripe' as PaymentGatewayId, name: 'Stripe-Style', desc: 'Credit / Debit Cards' },
              { id: 'paypal' as PaymentGatewayId, name: 'PayPal-Style', desc: 'PayPal Wallet' },
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
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-between pt-4">
          <button
            type="button"
            onClick={handleResetData}
            className="px-4 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Demo Data</span>
          </button>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Applying...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
