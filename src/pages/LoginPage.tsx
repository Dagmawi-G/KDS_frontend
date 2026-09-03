import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Lock,
  UserCheck,
  ChefHat,
  CreditCard,
  Settings,
  BellRing,
  Delete,
  ShieldCheck,
  Sparkles,
  ArrowLeft,
  Utensils,
} from 'lucide-react';
import { StaffUser } from '../types';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { loginWithPin, currentStaff, logout } = useAuth();

  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<number | undefined>(undefined);
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    fetch('/api/auth/staff')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const activeStaff = data.filter((s: StaffUser) => s.status === 'ACTIVE');
          setStaffList(activeStaff);
          if (activeStaff.length > 0) {
            setSelectedStaffId(activeStaff[0].id);
          }
        }
      })
      .catch((err) => console.error('Failed to load staff list:', err));
  }, []);

  const handleDigitPress = (digit: string) => {
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      setErrorMsg('');
      if (newPin.length === 4) {
        verifyPin(newPin);
      }
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setErrorMsg('');
  };

  const handleClear = () => {
    setPin('');
    setErrorMsg('');
  };

  const verifyPin = async (enteredPin: string) => {
    setIsSubmitting(true);
    const success = await loginWithPin(enteredPin, selectedStaffId);
    setIsSubmitting(false);

    if (success) {
      const loggedUser = staffList.find((s) => s.id === selectedStaffId);
      if (loggedUser) {
        if (loggedUser.role === 'WAITER') navigate('/waiter');
        else if (loggedUser.role === 'CASHIER') navigate('/cashier');
        else if (loggedUser.role === 'KITCHEN') navigate('/kitchen');
        else if (loggedUser.role === 'ADMIN' || loggedUser.role === 'MANAGER') navigate('/admin');
        else navigate('/cashier');
      } else {
        navigate('/cashier');
      }
    } else {
      setIsShaking(true);
      setErrorMsg('Incorrect 4-digit PIN. Please try again.');
      setPin('');
      setTimeout(() => setIsShaking(false), 500);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN':
      case 'MANAGER':
        return <Settings className="w-4 h-4 text-orange-400" />;
      case 'WAITER':
        return <BellRing className="w-4 h-4 text-purple-400" />;
      case 'CASHIER':
        return <CreditCard className="w-4 h-4 text-emerald-400" />;
      case 'KITCHEN':
        return <ChefHat className="w-4 h-4 text-rose-400" />;
      default:
        return <UserCheck className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 relative overflow-hidden selection:bg-orange-500">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-[130px]" />
        <div className="absolute bottom-1/4 right-1/3 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[130px]" />
      </div>

      {/* Top back button */}
      <div className="absolute top-6 left-6 z-10">
        <Link
          to="/"
          className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white transition-all shadow-md"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Portal Launchpad</span>
        </Link>
      </div>

      <div
        className={`relative bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl max-w-md w-full p-7 shadow-2xl z-10 transition-transform ${
          isShaking ? 'animate-bounce' : 'animate-in fade-in zoom-in-95'
        }`}
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center mx-auto mb-3 shadow-xl shadow-orange-600/30 ring-1 ring-orange-400/30">
            <Lock className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl font-black font-['Outfit'] tracking-tight">
            Staff Terminal Login
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Choose your profile and authenticate with your 4-digit PIN
          </p>
        </div>

        {/* Currently logged in alert if applicable */}
        {currentStaff && (
          <div className="mb-5 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-300">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Logged in as <strong>{currentStaff.name}</strong></span>
            </div>
            <button
              onClick={logout}
              className="text-[11px] underline font-bold hover:text-white"
            >
              Sign Out
            </button>
          </div>
        )}

        {/* Staff Profile Selection List */}
        <div className="mb-4">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
            Select Staff Account:
          </label>
          <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto pr-1">
            {staffList.map((staff) => {
              const isSelected = selectedStaffId === staff.id;
              return (
                <button
                  key={staff.id}
                  type="button"
                  onClick={() => {
                    setSelectedStaffId(staff.id);
                    setPin('');
                    setErrorMsg('');
                  }}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold transition-all ${
                    isSelected
                      ? 'border-orange-500 bg-orange-500/20 text-orange-300 ring-1 ring-orange-500/40'
                      : 'border-slate-800 bg-slate-800/60 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="p-1 rounded-lg bg-slate-800">
                      {getRoleIcon(staff.role)}
                    </div>
                    <span>{staff.name}</span>
                  </div>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                    {staff.role}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* PIN Indicator Dots */}
        <div className="my-4 py-2 flex items-center justify-center space-x-3.5">
          {[0, 1, 2, 3].map((index) => {
            const isFilled = pin.length > index;
            return (
              <div
                key={index}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  isFilled
                    ? 'bg-orange-500 scale-125 shadow-lg shadow-orange-500/60'
                    : 'bg-slate-800 border-2 border-slate-700'
                }`}
              />
            );
          })}
        </div>

        {/* Error message */}
        {errorMsg && (
          <p className="text-center text-xs font-bold text-rose-400 mb-3 animate-pulse">
            {errorMsg}
          </p>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-2.5 my-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigitPress(digit)}
              disabled={isSubmitting}
              className="h-12 rounded-2xl bg-slate-800 hover:bg-slate-700 active:bg-orange-600 active:text-white border border-slate-700/80 text-lg font-black font-mono transition-all flex items-center justify-center shadow-xs"
            >
              {digit}
            </button>
          ))}

          <button
            type="button"
            onClick={handleClear}
            className="h-12 rounded-2xl bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-rose-400 text-xs font-bold transition-all flex items-center justify-center"
          >
            Clear
          </button>

          <button
            type="button"
            onClick={() => handleDigitPress('0')}
            disabled={isSubmitting}
            className="h-12 rounded-2xl bg-slate-800 hover:bg-slate-700 active:bg-orange-600 active:text-white border border-slate-700/80 text-lg font-black font-mono transition-all flex items-center justify-center shadow-xs"
          >
            0
          </button>

          <button
            type="button"
            onClick={handleBackspace}
            className="h-12 rounded-2xl bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-white transition-all flex items-center justify-center"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Testing PIN cheat sheet */}
        <div className="mt-5 pt-3.5 border-t border-slate-800/80 text-[11px] text-slate-400 text-center">
          <p className="font-bold text-slate-300 mb-1.5">Preset Database PINs:</p>
          <div className="grid grid-cols-2 gap-1.5 font-mono text-orange-400 text-[10px]">
            <span className="p-1 rounded bg-slate-800/80 border border-slate-700/60">Admin: <strong>0000</strong></span>
            <span className="p-1 rounded bg-slate-800/80 border border-slate-700/60">Waiter: <strong>1234</strong></span>
            <span className="p-1 rounded bg-slate-800/80 border border-slate-700/60">Cashier: <strong>5678</strong></span>
            <span className="p-1 rounded bg-slate-800/80 border border-slate-700/60">Kitchen: <strong>9999</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};
export default LoginPage;
