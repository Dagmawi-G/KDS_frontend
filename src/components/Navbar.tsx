import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Utensils,
  ChefHat,
  BellRing,
  CreditCard,
  Settings,
  QrCode,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  Smartphone,
  UserCheck,
  Lock,
  LogOut,
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { sounds } from '../utils/audio';
import { StaffPinModal } from './StaffPinModal';


export const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isConnected } = useSocket();
  const [isMuted, setIsMuted] = useState(sounds.getMuted());
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [selectedTable, setSelectedTable] = useState('03');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Update selectedTable if currently on a table page
  useEffect(() => {
    const match = location.pathname.match(/\/table\/([^\/]+)/);
    if (match && match[1]) {
      setSelectedTable(match[1]);
    }
  }, [location.pathname]);

  const toggleMute = () => {
    const newMuted = !isMuted;
    sounds.setMuted(newMuted);
    setIsMuted(newMuted);
  };

  const navLinks = [
    {
      to: `/table/${selectedTable}`,
      label: 'QR Table',
      icon: Smartphone,
      badge: `T-${selectedTable}`,
      activeMatch: (path: string) => path.startsWith('/table/'),
    },
    {
      to: '/kitchen',
      label: 'Kitchen KDS',
      icon: ChefHat,
      activeMatch: (path: string) => path === '/kitchen',
    },
    {
      to: '/waiter',
      label: 'Waiter Dispatch',
      icon: BellRing,
      activeMatch: (path: string) => path === '/waiter',
    },
    {
      to: '/cashier',
      label: 'Cashier POS',
      icon: CreditCard,
      activeMatch: (path: string) => path === '/cashier',
    },
    {
      to: '/admin',
      label: 'Admin & Reports',
      icon: Settings,
      activeMatch: (path: string) => path === '/admin',
    },
    {
      to: '/qr-print',
      label: 'QR Stands',
      icon: QrCode,
      activeMatch: (path: string) => path === '/qr-print',
    },
  ];

  const handleTableChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTable = e.target.value;
    setSelectedTable(newTable);
    if (location.pathname.startsWith('/table/')) {
      navigate(`/table/${newTable}`);
    }
  };

  const { currentStaff, isPinModalOpen, openPinModal, logout } = useAuth();

  return (
    <>
      <header className="no-print sticky top-0 z-50 bg-slate-900 text-white border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand */}
            <div className="flex items-center space-x-3">
              <Link to="/cashier" className="flex items-center space-x-2.5 group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:scale-105 transition-transform">
                  <Utensils className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="font-extrabold text-lg tracking-tight font-['Outfit',sans-serif] bg-gradient-to-r from-white via-orange-100 to-orange-300 bg-clip-text text-transparent">
                    Dine <span className="text-orange-500">OS</span>
                  </span>
                  <span className="hidden sm:inline-block ml-2 text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">
                    Smart POS & KDS
                  </span>
                </div>

              </Link>
            </div>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = link.activeMatch(location.pathname);
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{link.label}</span>
                    {link.badge && (
                      <span className="ml-1 px-1.5 py-0.2 text-[10px] rounded bg-orange-800/80 text-orange-200 font-mono font-bold">
                        {link.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Quick Controls & Status */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Staff Profile / Quick PIN Login */}
              {currentStaff ? (
                <div className="flex items-center space-x-1.5 bg-slate-800/90 border border-slate-700/80 rounded-xl px-2.5 py-1 text-xs">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="font-bold text-slate-200 hidden sm:inline">
                    {currentStaff.name.split(' ')[0]}
                  </span>
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-orange-500/20 text-orange-300 font-bold">
                    {currentStaff.role}
                  </span>
                  <button
                    onClick={openPinModal}
                    title="Switch Staff User"
                    className="text-slate-400 hover:text-white p-0.5 ml-1"
                  >
                    <Lock className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={openPinModal}
                  className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-orange-600/20 text-orange-300 border border-orange-500/40 text-xs font-bold hover:bg-orange-600/30 transition-colors shadow-xs"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Staff PIN Login</span>
                </button>
              )}

              {/* Table Quick Switcher */}
              <div className="flex items-center bg-slate-800 rounded-lg px-2 py-1 border border-slate-700 text-xs">
                <span className="text-slate-400 mr-1 hidden sm:inline text-[11px]">Table:</span>
                <select
                  value={selectedTable}
                  onChange={handleTableChange}
                  aria-label="Select Restaurant Table"
                  className="bg-transparent text-orange-400 font-bold font-mono focus:outline-none cursor-pointer"
                >
                  {Array.from({ length: 10 }, (_, i) => {
                    const num = String(i + 1).padStart(2, '0');
                    return (
                      <option key={num} value={num} className="bg-slate-900 text-white">
                        #{num}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Sound Toggle */}
              <button
                onClick={toggleMute}
                title={isMuted ? 'Unmute sound alerts' : 'Mute sound alerts'}
                className={`p-2 rounded-lg transition-colors text-xs flex items-center ${
                  isMuted
                    ? 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    : 'bg-orange-500/10 text-orange-400 border border-orange-500/30 hover:bg-orange-500/20'
                }`}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              {/* WebSocket Connection Status Indicator */}
              <div
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${
                  isConnected
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}
                title={isConnected ? 'Real-Time Sync Connected' : 'Connecting to Real-Time Server...'}
              >
                {isConnected ? (
                  <>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="hidden sm:inline">LIVE</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3 h-3 text-rose-400" />
                    <span className="hidden sm:inline">RECONNECTING</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Sub-Navigation Bar */}
          <div className="md:hidden flex items-center justify-around py-2 border-t border-slate-800 overflow-x-auto gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = link.activeMatch(location.pathname);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex flex-col items-center px-2 py-1 rounded text-[10px] font-semibold whitespace-nowrap ${
                    isActive ? 'text-orange-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4 mb-0.5" />
                  <span>{link.label.split(' ')[0]}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      {/* Staff Keypad PIN Modal */}
      <StaffPinModal isOpen={isPinModalOpen} onClose={() => {}} />
    </>
  );
};

