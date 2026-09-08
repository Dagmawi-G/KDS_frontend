import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Utensils,
  ChefHat,
  BellRing,
  CreditCard,
  Settings,
  QrCode,
  Smartphone,
  Lock,
  ArrowRight,
  Sparkles,
  Activity,
  Clock,
  Users,
  LogOut,
  LayoutDashboard,
  CheckCircle2,
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { StaffPinModal } from '../components/StaffPinModal';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isConnected } = useSocket();
  const { currentStaff, isPinModalOpen, openPinModal, closePinModal, logout } = useAuth();
  const { settings } = useSettings();
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getStaffDashboardRoute = (role?: string) => {
    switch (role) {
      case 'WAITER':
        return '/waiter';
      case 'CASHIER':
        return '/cashier';
      case 'KITCHEN':
        return '/kitchen';
      case 'ADMIN':
      case 'MANAGER':
        return '/admin';
      default:
        return '/cashier';
    }
  };

  const allFeatures = [
    {
      key: 'customerMenu',
      title: 'Digital Table QR Ordering',
      description: 'Customers scan table QR codes to browse the menu, customize orders, and request service in real time.',
      icon: Smartphone,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      enabled: settings.modules.customerMenu,
    },
    {
      key: 'kds',
      title: 'Kitchen Display System (KDS)',
      description: 'Instant ticket routing to prep stations with live countdown timers and status synchronization.',
      icon: ChefHat,
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
      enabled: settings.modules.kds,
    },
    {
      key: 'waiter',
      title: 'Floor Service & Waiter Dispatch',
      description: 'Live table paging alerts, call-bell requests, and food delivery tracking for floor staff.',
      icon: BellRing,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
      enabled: settings.modules.waiter,
    },
    {
      key: 'cashier',
      title: 'Point of Sale & Billing',
      description: 'Seamless checkouts with cash, card, and QR payments, instant invoicing, and management analytics.',
      icon: CreditCard,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      enabled: settings.modules.cashier,
    },
  ];

  const coreFeatures = allFeatures.filter((f) => f.enabled);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-orange-500 selection:text-white relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-15%] left-[25%] w-[600px] h-[600px] bg-orange-600/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[15%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[140px]" />
      </div>

      {/* Top Header Navigation */}
      <header className="relative z-10 border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-600/30 ring-1 ring-orange-400/30">
              <Utensils className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight font-['Outfit'] bg-gradient-to-r from-white via-orange-100 to-orange-400 bg-clip-text text-transparent">
                {settings.branding.name || 'Dine OS'}
              </span>
              <span className="hidden sm:inline-block ml-2.5 text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/30 font-mono">
                {settings.preset === 'CAFE_MERGED' ? 'Cafe Mode' : settings.preset === 'QUICK_SERVICE' ? 'Quick POS' : 'Pro Suite'}
              </span>
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center space-x-3">
            {/* Live Status Indicator */}
            <div
              className={`hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-xl border text-xs font-semibold ${
                isConnected
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
              }`}
            >
              <Activity className="w-3.5 h-3.5 animate-pulse" />
              <span>{isConnected ? 'System Live' : 'Connecting...'}</span>
            </div>

            {/* Auth CTA */}
            {currentStaff ? (
              <div className="flex items-center space-x-2">
                <Link
                  to={getStaffDashboardRoute(currentStaff.role)}
                  className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-white transition-all shadow-sm"
                >
                  <Users className="w-3.5 h-3.5 text-orange-400" />
                  <span>
                    {currentStaff.name} ({currentStaff.role})
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </Link>
                <button
                  onClick={logout}
                  title="Sign Out"
                  className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-rose-400 transition-colors border border-slate-700/80"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={openPinModal}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-bold shadow-lg shadow-orange-600/30 transition-all hover:scale-105 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Staff Sign In</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Hero & Description */}
      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16 flex-1 flex flex-col justify-center items-center text-center">
        {/* System Tag */}
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-300 text-xs font-bold mb-6 animate-fade-in shadow-inner">
          <Sparkles className="w-3.5 h-3.5 text-orange-400" />
          <span>All-In-One Smart Restaurant Platform</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black font-['Outfit'] tracking-tight text-white leading-tight max-w-3xl">
          Intelligent Dining, <br />
          <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500 bg-clip-text text-transparent">
            Kitchen Display & POS System
          </span>
        </h1>

        {/* What the system is (Clear Description) */}
        <p className="mt-5 text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
          <strong>DineOS</strong> is a modern restaurant operations system connecting{' '}
          <span className="text-orange-300 font-semibold">QR table ordering</span>,{' '}
          <span className="text-orange-300 font-semibold">kitchen display screens (KDS)</span>,{' '}
          <span className="text-orange-300 font-semibold">waiter dispatch</span>, and{' '}
          <span className="text-orange-300 font-semibold">cashier billing</span> into a unified, real-time workflow.
        </p>

        {/* Primary Call to Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          {currentStaff ? (
            <Link
              to={getStaffDashboardRoute(currentStaff.role)}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-extrabold text-sm shadow-xl shadow-orange-600/30 flex items-center justify-center space-x-2 transition-all hover:scale-105"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Go to {currentStaff.role} Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <button
              onClick={openPinModal}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-extrabold text-sm shadow-xl shadow-orange-600/30 flex items-center justify-center space-x-2 transition-all hover:scale-105 cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>Sign In to Terminal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          <Link
            to="/table/03"
            className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white font-bold text-sm flex items-center justify-center space-x-2 transition-all shadow-md"
          >
            <Smartphone className="w-4 h-4 text-orange-400" />
            <span>Customer QR Menu Demo</span>
          </Link>
        </div>

        {/* Core System Highlights Grid */}
        <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full text-left">
          {coreFeatures.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.title}
                className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800/90 backdrop-blur-sm hover:border-slate-700 transition-all"
              >
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-3.5 ${feat.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h2 className="text-sm font-bold text-white font-['Outfit'] mb-1.5">{feat.title}</h2>
                <p className="text-xs text-slate-400 leading-relaxed">{feat.description}</p>
              </div>
            );
          })}
        </div>
      </main>

      {/* Simplified Footer */}
      <footer className="relative z-10 border-t border-slate-800/60 py-6 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-400">DineOS Platform</span>
            <span>•</span>
            <span>Real-Time Restaurant Architecture</span>
          </div>

          <div className="flex items-center space-x-4">
            <Link to="/login" className="hover:text-orange-400 transition-colors font-medium">
              Direct Login Page
            </Link>
            <span>•</span>
            <Link to="/table/03" className="hover:text-orange-400 transition-colors font-medium">
              Table #03 Menu
            </Link>
          </div>
        </div>
      </footer>

      {/* Staff Login Modal */}
      <StaffPinModal isOpen={isPinModalOpen} onClose={closePinModal} />
    </div>
  );
};

export default LandingPage;

