import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Store, 
  Lock, 
  Mail, 
  ArrowRight, 
  AlertCircle, 
  ShieldCheck, 
  KeyRound, 
  Sparkles,
  Search
} from 'lucide-react';
import { api } from '../../api/client';
import { simDb } from '../../sim/db';
import { Shop } from '../../types';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShopSlug, setSelectedShopSlug] = useState<string>('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rateLimitSeconds, setRateLimitSeconds] = useState<number | null>(null);
  const [shopFilter, setShopFilter] = useState('');

  useEffect(() => {
    const list = simDb.getShops();
    setShops(list);
  }, []);

  // Cooldown countdown timer for 429 rate limit
  useEffect(() => {
    if (rateLimitSeconds && rateLimitSeconds > 0) {
      const timer = setInterval(() => {
        setRateLimitSeconds((prev) => (prev && prev > 1 ? prev - 1 : null));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [rateLimitSeconds]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const session = await api.auth.login({
        email,
        password,
        shopSlug: selectedShopSlug || undefined,
      });

      if (session.role === 'operator') {
        navigate('/operator');
      } else if (session.shopSlug) {
        navigate(`/t/${session.shopSlug}/admin`);
      } else {
        navigate('/');
      }
    } catch (err: unknown) {
      const e = err as { status?: number; error?: string; code?: string };
      if (e.status === 429) {
        setError('429 Too Many Requests: Rate limit active. 60-second security cooldown applied.');
        setRateLimitSeconds(60);
      } else if (e.status === 403 && e.code === 'shop_suspended') {
        setError('403 Forbidden: Access revoked: shop suspended.');
      } else {
        setError(e.error || 'Invalid credentials. Please verify your email and password.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoFill = (demoEmail: string, slug?: string) => {
    setEmail(demoEmail);
    setPassword('Demo1234!');
    setSelectedShopSlug(slug || '');
    setError(null);
  };

  const filteredShops = shops.filter((s) =>
    s.name.toLowerCase().includes(shopFilter.toLowerCase()) ||
    s.slug.toLowerCase().includes(shopFilter.toLowerCase())
  );

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-extrabold text-xl mx-auto shadow-md shadow-blue-500/20">
            S
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Sign In to Soko Hub
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Enter your merchant credentials or platform operator account
          </p>
        </div>

        {/* Demo Quick Logins Helper */}
        <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/60 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900 dark:text-blue-300">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            <span>One-Click Demo Logins (Pass: Demo1234!)</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <button
              type="button"
              onClick={() => handleQuickDemoFill('admin@kigalifresh.demo', 'kigali-fresh')}
              className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-blue-200 dark:border-slate-700 hover:border-blue-500 text-left cursor-pointer transition-colors"
            >
              <div className="font-bold text-slate-800 dark:text-slate-200">Kigali Fresh</div>
              <div className="text-slate-400 text-[10px]">All Modules</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemoFill('admin@umuco.demo', 'umuco-electronics')}
              className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-blue-200 dark:border-slate-700 hover:border-blue-500 text-left cursor-pointer transition-colors"
            >
              <div className="font-bold text-slate-800 dark:text-slate-200">Umuco Electronics</div>
              <div className="text-slate-400 text-[10px]">Order History Only</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemoFill('admin@gisenyibooks.demo', 'gisenyi-books')}
              className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-blue-200 dark:border-slate-700 hover:border-blue-500 text-left cursor-pointer transition-colors"
            >
              <div className="font-bold text-slate-800 dark:text-slate-200">Gisenyi Books</div>
              <div className="text-slate-400 text-[10px]">Delivery + Analytics</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemoFill('operator@soko.demo')}
              className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 hover:border-emerald-500 text-left cursor-pointer transition-colors"
            >
              <div className="font-bold text-emerald-800 dark:text-emerald-300">Platform Operator</div>
              <div className="text-emerald-600 dark:text-emerald-400 text-[10px]">Full Super Admin</div>
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div>{error}</div>
              {rateLimitSeconds && (
                <div className="font-mono text-[11px] text-rose-700 dark:text-rose-300">
                  Rate limit cooldown: <strong>{rateLimitSeconds}s</strong> remaining
                </div>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          {/* Optional Shop Picker */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Target Tenant (Optional for Operator)
            </label>
            <select
              value={selectedShopSlug}
              onChange={(e) => setSelectedShopSlug(e.target.value)}
              className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="">Auto-detect from email or Operator</option>
              {shops.map((s) => (
                <option key={s.id} value={s.slug}>
                  {s.name} ({s.slug}.soko.rw) {s.isSuspended ? '[SUSPENDED]' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@kigalifresh.demo"
                className="w-full text-xs p-3 pl-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full text-xs p-3 pl-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !!rateLimitSeconds}
            className={`w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
              loading || !!rateLimitSeconds ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <span>{loading ? 'Authenticating...' : 'Sign In to Dashboard'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
          <span>Want to open a new shop? </span>
          <Link to="/onboarding" className="text-blue-600 dark:text-blue-400 font-bold hover:underline">
            Register your shop
          </Link>
        </div>
      </div>
    </div>
  );
};
