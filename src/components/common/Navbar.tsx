import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  ShoppingBag, 
  Search, 
  Store, 
  LogIn, 
  Sun, 
  Moon, 
  Compass, 
  User, 
  LogOut, 
  ShieldCheck, 
  Terminal,
  Menu,
  X
} from 'lucide-react';
import { useMonitorStore } from '../../sim/monitorStore';
import { api } from '../../api/client';
import { LoginSession } from '../../types';

interface NavbarProps {
  onOpenDemoGuide?: () => void;
  cartCount?: number;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  onOpenDemoGuide, 
  cartCount = 0,
  searchQuery = '',
  onSearchChange 
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme, toggleOpen } = useMonitorStore();
  const [session, setSession] = useState<LoginSession | null>(api.auth.getCurrentSession());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setSession(api.auth.getCurrentSession());
  }, [location.pathname]);

  const handleLogout = () => {
    api.auth.logout();
    setSession(null);
    navigate('/');
  };

  const isMarketplace = location.pathname === '/';

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo & Brand */}
        <div className="flex items-center gap-6 shrink-0">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-extrabold text-xl shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <span className="tracking-tighter">S</span>
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white flex items-center gap-1">
                Soko<span className="text-blue-600">Hub</span>
              </span>
              <span className="block text-[10px] uppercase font-mono tracking-wider text-slate-400 dark:text-slate-500 -mt-1">
                Rwanda Multi-Tenant
              </span>
            </div>
          </Link>
        </div>

        {/* Global Search Bar (Marketplace) */}
        {isMarketplace && onSearchChange ? (
          <div className="hidden md:flex flex-1 max-w-md mx-2">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search coffee, electronics, produce, books..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm rounded-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>
          </div>
        ) : (
          <div className="flex-1" />
        )}

        {/* Nav Actions */}
        <div className="hidden sm:flex items-center gap-2 sm:gap-3">
          {onOpenDemoGuide && (
            <button
              onClick={onOpenDemoGuide}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 flex items-center gap-1.5 transition-colors cursor-pointer border border-blue-200/50 dark:border-blue-800/50"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Demo Guide</span>
            </button>
          )}

          <button
            onClick={toggleOpen}
            className="p-2 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Toggle Developer Backend Monitor (Shortcut: B)"
          >
            <Terminal className="w-4 h-4" />
          </button>

          <button
            onClick={toggleTheme}
            className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Toggle Dark / Light Mode"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          <Link
            to="/cart"
            className="relative p-2 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="View Cart"
          >
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-blue-600 text-white font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center animate-scale shadow-sm">
                {cartCount}
              </span>
            )}
          </Link>

          <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

          {/* Sell on Soko / Onboarding */}
          <Link
            to="/onboarding"
            className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-center gap-1.5"
          >
            <Store className="w-3.5 h-3.5" />
            <span>Sell on Soko</span>
          </Link>

          {/* User / Login state */}
          {session ? (
            <div className="flex items-center gap-2">
              <Link
                to={session.role === 'operator' ? '/operator' : `/t/${session.shopSlug}/admin`}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-1.5 transition-colors"
              >
                {session.role === 'operator' ? (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Operator Panel</span>
                  </>
                ) : (
                  <>
                    <User className="w-3.5 h-3.5 text-blue-500" />
                    <span>{session.shopName || 'Shop Admin'}</span>
                  </>
                )}
              </Link>
              <button
                onClick={handleLogout}
                className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                title="Log out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Shop Login</span>
            </Link>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="flex sm:hidden items-center gap-2">
          <Link to="/cart" className="relative p-2 text-slate-700 dark:text-slate-300">
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-blue-600 text-white font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-600 dark:text-slate-400"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-slate-200 dark:border-slate-800 px-4 py-3 bg-white dark:bg-slate-900 space-y-2">
          {onOpenDemoGuide && (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenDemoGuide();
              }}
              className="w-full text-left py-2 text-sm font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-2"
            >
              <Compass className="w-4 h-4" />
              <span>Soko Hub Demo Guide</span>
            </button>
          )}
          <Link
            to="/onboarding"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Sell on Soko (Register Shop)
          </Link>
          <Link
            to="/login"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Merchant & Operator Login
          </Link>
          <Link
            to="/operator"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-medium text-emerald-600 dark:text-emerald-400"
          >
            Platform Operator Portal
          </Link>
          <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-500">Appearance</span>
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-medium flex items-center gap-1.5"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
              <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
