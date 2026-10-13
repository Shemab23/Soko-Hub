import React, { useState } from 'react';
import { X, CheckCircle, ArrowRight, ShieldCheck, ShoppingCart, Terminal, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMonitorStore } from '../../sim/monitorStore';

interface DemoGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DemoGuideModal: React.FC<DemoGuideModalProps> = ({ isOpen, onClose }) => {
  const [activeStep, setActiveStep] = useState(0);
  const navigate = useNavigate();
  const { setOpen, setActiveTab } = useMonitorStore();

  if (!isOpen) return null;

  const steps = [
    {
      title: '1. Feature Gating & Tenant Isolation',
      instruction:
        'Log in as Umuco Electronics (has ONLY Order history enabled). Observe the sidebar has NO Analytics. Attempt to navigate directly to /t/umuco-electronics/admin/analytics. The backend engine refuses it with 403 module_not_enabled.',
      actionText: 'Go to Umuco Admin Analytics',
      action: () => {
        onClose();
        navigate('/t/umuco-electronics/admin/analytics');
      },
    },
    {
      title: '2. Multi-Shop Cart & Gateway Intersection Rule',
      instruction:
        'Add one item from Kigali Fresh (accepts Stripe, PayPal, Flutterwave) and one item from Umuco Electronics (accepts Stripe, PayPal only). At checkout, notice Mobile Money (Flutterwave) is hidden, with an explicit badge explaining Umuco does not accept it.',
      actionText: 'Go to Marketplace',
      action: () => {
        onClose();
        navigate('/');
      },
    },
    {
      title: '3. Webhook Latency Simulation',
      instruction:
        'Proceed to Stripe-style payment for any order. Select the condition "Success with 10 s webhook delay". Observe the receipt page polling with "Confirming your payment...", then automatically becoming paid once the webhook arrives.',
      actionText: 'Go to Cart',
      action: () => {
        onClose();
        navigate('/cart');
      },
    },
    {
      title: '4. Webhook Idempotency Check',
      instruction:
        'On a payment provider page, choose "Success with duplicate webhook". Check the Backend Monitor (press B): notice the initial webhook processes stock and payouts, while the duplicate is acknowledged with 200 and ignored without double-charging.',
      actionText: 'Open Backend Monitor',
      action: () => {
        setOpen(true);
        setActiveTab('events');
      },
    },
    {
      title: '5. Security Suite ("Try to break it")',
      instruction:
        'Open the Developer Tray (press B) and go to the "Security Tests" tab. Run all tests to see tenant cross-read block (404), feature gating (403), price tampering rejection, bad HMAC signature rejection (401), and session integrity protection pass.',
      actionText: 'Open Security Tests Tab',
      action: () => {
        setOpen(true);
        setActiveTab('security');
      },
    },
    {
      title: '6. Dynamic Feature Toggling in Settings',
      instruction:
        'Log in as Kigali Fresh, navigate to Settings, and toggle a module (like Quotations or Deliveries) off. Notice how the sidebar updates instantly, and the simulated engine immediately blocks corresponding endpoints.',
      actionText: 'Go to Kigali Fresh Settings',
      action: () => {
        onClose();
        navigate('/t/kigali-fresh/admin/settings');
      },
    },
  ];

  const current = steps[activeStep];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/10 text-blue-600 flex items-center justify-center font-bold">
              SH
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Soko Hub Interactive Demo Guide</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">6-Step evaluation walkthrough of engine security & multi-tenancy</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Navigation Dots */}
        <div className="px-6 pt-4 flex gap-1.5 justify-between">
          {steps.map((s, idx) => (
            <button
              key={idx}
              onClick={() => setActiveStep(idx)}
              className={`flex-1 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-all ${
                activeStep === idx
                  ? 'bg-blue-600 text-white shadow-sm'
                  : idx < activeStep
                  ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}
            >
              Step {idx + 1}
            </button>
          ))}
        </div>

        {/* Step Body */}
        <div className="p-6 flex-1">
          <div className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-2">
            Step {activeStep + 1} of {steps.length}
          </div>
          <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{current.title}</h4>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200/60 dark:border-slate-700/60 mb-6">
            {current.instruction}
          </p>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={current.action}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-md transition-all cursor-pointer"
            >
              <span>{current.actionText}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex gap-2">
              {activeStep > 0 && (
                <button
                  onClick={() => setActiveStep((prev) => prev - 1)}
                  className="px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                >
                  Previous
                </button>
              )}
              {activeStep < steps.length - 1 ? (
                <button
                  onClick={() => setActiveStep((prev) => prev + 1)}
                  className="px-3 py-2 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg cursor-pointer"
                >
                  Next Step →
                </button>
              ) : (
                <button
                  onClick={onClose}
                  className="px-3 py-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-lg cursor-pointer"
                >
                  Done
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Demo Credentials Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap gap-x-4 gap-y-1">
          <span className="font-semibold text-slate-700 dark:text-slate-300">Quick Logins (Password: Demo1234!):</span>
          <span>Kigali Fresh: <code className="font-mono text-blue-600 dark:text-blue-400">admin@kigalifresh.demo</code></span>
          <span>Umuco: <code className="font-mono text-blue-600 dark:text-blue-400">admin@umuco.demo</code></span>
          <span>Operator: <code className="font-mono text-emerald-600 dark:text-emerald-400">operator@soko.demo</code></span>
        </div>
      </div>
    </div>
  );
};
