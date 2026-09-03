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
  ShieldCheck,
  Activity,
  Layers,
  Clock,
  Users,
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isConnected } = useSocket();
  const { currentStaff, openPinModal } = useAuth();
  const [selectedTable, setSelectedTable] = useState('03');
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const portals = [
    {
      title: 'Customer QR Menu & Order',
      description: 'Interactive digital dining menu with live order placement, bill estimation & waiter assistance calls.',
      icon: Smartphone,
      gradient: 'from-amber-500 to-orange-600',
      shadow: 'shadow-orange-500/20',
      border: 'hover:border-orange-500/50',
      badge: `Table #${selectedTable}`,
      link: `/table/${selectedTable}`,
      tag: 'Customer Station',
    },
    {
      title: 'Kitchen Display System (KDS)',
      description: 'Real-time order ticket board with prep countdown timers, item checklist & status synchronization.',
      icon: ChefHat,
      gradient: 'from-rose-500 to-red-600',
      shadow: 'shadow-rose-500/20',
      border: 'hover:border-rose-500/50',
      badge: 'Live Kitchen Tickets',
      link: '/kitchen',
      tag: 'Chefs & Kitchen',
    },
    {
      title: 'Waiter Service & Paging',
      description: 'Floor plan overview, table occupancy monitoring, call bell alerts, and food delivery status.',
      icon: BellRing,
      gradient: 'from-purple-500 to-indigo-600',
      shadow: 'shadow-purple-500/20',
      border: 'hover:border-purple-500/50',
      badge: 'Floor Dispatch',
      link: '/waiter',
      tag: 'Service Staff',
    },
    {
      title: 'Cashier & POS Checkout',
      description: 'Live table billing, order review, payment settlement (Cash/Card/QR) and instant invoice generation.',
      icon: CreditCard,
      gradient: 'from-emerald-500 to-teal-600',
      shadow: 'shadow-emerald-500/20',
      border: 'hover:border-emerald-500/50',
      badge: 'Billing & POS',
      link: '/cashier',
      tag: 'Front Desk & Cashier',
    },
    {
      title: 'Executive Admin & Reports',
      description: 'Live revenue analytics, top-selling items, menu catalog editing & staff PIN security management.',
      icon: Settings,
      gradient: 'from-blue-500 to-cyan-600',
      shadow: 'shadow-blue-500/20',
      border: 'hover:border-blue-500/50',
      badge: 'PIN: 0000',
      link: '/admin',
      tag: 'Management',
    },
    {
      title: 'Table QR Stands & Placards',
      description: 'Generate high-resolution printable table tent cards with direct camera QR scan links.',
      icon: QrCode,
      gradient: 'from-violet-500 to-purple-600',
      shadow: 'shadow-violet-500/20',
      border: 'hover:border-violet-500/50',
      badge: 'Print Ready',
      link: '/qr-print',
      tag: 'Table Setup',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-orange-500 selection:text-white">
      {/* Background Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[10%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[140px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 flex flex-col justify-between">
        {/* Top Header / Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-8 border-b border-slate-800/80">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center shadow-xl shadow-orange-600/30 ring-1 ring-orange-400/30">
              <Utensils className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-black font-['Outfit'] tracking-tight bg-gradient-to-r from-white via-orange-100 to-orange-400 bg-clip-text text-transparent">
                  Dine <span className="text-orange-500">OS</span>
                </h1>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  v1.0 Pro
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Restaurant Kitchen Display System & Real-Time POS Suite
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Live System Clock */}
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
              <Clock className="w-3.5 h-3.5 text-orange-400" />
              <span>{currentTime}</span>
            </div>

            {/* Socket Status */}
            <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border text-xs font-semibold ${
              isConnected
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
            }`}>
              <Activity className="w-3.5 h-3.5 animate-pulse" />
              <span>{isConnected ? 'Database Synced' : 'Offline'}</span>
            </div>

            {/* Login / Auth Button */}
            {currentStaff ? (
              <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200">
                <Users className="w-3.5 h-3.5 text-orange-400" />
                <span>{currentStaff.name} ({currentStaff.role})</span>
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 text-white text-xs font-bold hover:shadow-lg hover:shadow-orange-600/30 transition-all"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Staff Terminal Login</span>
              </Link>
            )}
          </div>
        </div>

        {/* Hero Section */}
        <div className="text-center my-10 max-w-3xl mx-auto">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-300 text-xs font-bold mb-4 animate-fade-in">
            <Sparkles className="w-3.5 h-3.5 text-orange-400" />
            <span>SQLite + Prisma + WebSocket Synchronized Architecture</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black font-['Outfit'] tracking-tight text-white leading-tight">
            Next-Gen Dining Experience & <br />
            <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500 bg-clip-text text-transparent">
              Kitchen Automation Engine
            </span>
          </h2>
          <p className="mt-4 text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
            Select a station below to launch its interface. All devices and tabs sync instantly with the local SQLite database.
          </p>

          {/* Table Selector Helper */}
          <div className="mt-6 inline-flex items-center bg-slate-900/90 border border-slate-800 rounded-2xl p-1.5 shadow-xl">
            <span className="text-xs text-slate-400 px-3 font-semibold">Simulate Customer at:</span>
            <select
              value={selectedTable}
              onChange={(e) => setSelectedTable(e.target.value)}
              aria-label="Simulate Customer Table"
              className="bg-slate-800 text-orange-400 font-mono font-bold text-xs px-3 py-1.5 rounded-xl border border-slate-700 focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer"
            >
              {Array.from({ length: 10 }, (_, i) => {
                const num = String(i + 1).padStart(2, '0');
                return (
                  <option key={num} value={num}>
                    Table #{num}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Station Launchpad Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 my-6">
          {portals.map((portal) => {
            const Icon = portal.icon;
            return (
              <Link
                key={portal.title}
                to={portal.link}
                className={`group relative bg-slate-900/80 backdrop-blur-sm border border-slate-800/90 rounded-3xl p-6 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 hover:bg-slate-900 ${portal.border} shadow-xl ${portal.shadow} flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${portal.gradient} flex items-center justify-center shadow-lg text-white group-hover:rotate-6 transition-transform`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
                      {portal.badge}
                    </span>
                  </div>

                  <span className="text-[11px] font-bold text-orange-400 uppercase tracking-wider block mb-1">
                    {portal.tag}
                  </span>
                  <h3 className="text-lg font-bold text-white font-['Outfit'] group-hover:text-orange-300 transition-colors">
                    {portal.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    {portal.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-slate-300 group-hover:text-white">
                  <span>Launch Station</span>
                  <ArrowRight className="w-4 h-4 text-orange-400 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Bottom Status / Credentials Footer */}
        <div className="mt-8 p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Pre-configured Staff PINs:</span>
            <div className="flex flex-wrap gap-2 font-mono text-slate-200">
              <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">Admin: <strong>0000</strong></span>
              <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">Waiter: <strong>1234</strong></span>
              <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">Cashier: <strong>5678</strong></span>
              <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">Kitchen: <strong>9999</strong></span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Link to="/login" className="hover:text-orange-400 transition-colors font-bold">
              Dedicated Login Page →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
export default LandingPage;
