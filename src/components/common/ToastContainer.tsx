import React, { useEffect } from 'react';
import { useMonitorStore } from '../../sim/monitorStore';
import { CheckCircle2, AlertCircle, ShoppingBag, DollarSign, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { notifications, dismissNotification } = useMonitorStore();

  useEffect(() => {
    // Auto dismiss after 6 seconds
    if (notifications.length > 0) {
      const timer = setTimeout(() => {
        dismissNotification(notifications[notifications.length - 1].id);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [notifications, dismissNotification]);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-14 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {notifications.map((n) => {
        const isShop = n.recipient === 'shop';
        const isOperator = n.recipient === 'operator';

        return (
          <div
            key={n.id}
            className={`pointer-events-auto p-4 rounded-xl shadow-xl border text-sm transition-all duration-300 transform translate-y-0 backdrop-blur-md flex items-start gap-3 ${
              isShop
                ? 'bg-blue-900/90 border-blue-500/40 text-blue-50'
                : isOperator
                ? 'bg-emerald-900/90 border-emerald-500/40 text-emerald-50'
                : 'bg-slate-900/90 border-slate-700 text-slate-100'
            }`}
          >
            <div className="mt-0.5 shrink-0">
              {isShop && <ShoppingBag className="w-5 h-5 text-blue-400" />}
              {isOperator && <DollarSign className="w-5 h-5 text-emerald-400" />}
              {!isShop && !isOperator && <CheckCircle2 className="w-5 h-5 text-blue-400" />}
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs tracking-wide uppercase opacity-80">
                  {isShop ? 'Merchant Alert' : isOperator ? 'Operator Notice' : 'Order Update'}
                </span>
                <span className="text-[10px] opacity-60">{n.timestamp}</span>
              </div>
              <div className="font-bold text-sm mt-0.5">{n.title}</div>
              <div className="text-xs opacity-90 mt-0.5 leading-relaxed">{n.message}</div>
            </div>

            <button
              onClick={() => dismissNotification(n.id)}
              className="opacity-60 hover:opacity-100 p-0.5 cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
