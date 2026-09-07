import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Lock,
  UserCheck,
  ChefHat,
  CreditCard,
  Settings,
  BellRing,
  Delete,
  ShieldCheck,
  Sparkles,
  Search,
  Eye,
  EyeOff,
  Mail,
  User,
  ChevronDown,
  ArrowRight,
  Check,
} from 'lucide-react';
import { StaffUser } from '../types';
import { useAuth } from '../context/AuthContext';

interface StaffPinModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StaffPinModal: React.FC<StaffPinModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { loginWithPin, closePinModal } = useAuth();

  const handleClose = useCallback(() => {
    if (onClose) onClose();
    closePinModal();
  }, [onClose, closePinModal]);

  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<StaffUser | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [showDemoPins, setShowDemoPins] = useState(false);

  const [isLoadingStaff, setIsLoadingStaff] = useState(false);

  const loadStaff = useCallback(async () => {
    setIsLoadingStaff(true);
    try {
      const res = await fetch('/api/auth/staff');
      if (!res.ok) throw new Error('Server returned ' + res.status);
      const text = await res.text();
      const data = text ? JSON.parse(text) : [];
      if (Array.isArray(data)) {
        const activeStaff = data.filter((s: StaffUser) => s.status === 'ACTIVE');
        setStaffList(activeStaff);
        if (activeStaff.length > 0) {
          setSelectedStaff((prev) => prev || activeStaff[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load staff list:', err);
    } finally {
      setIsLoadingStaff(false);
    }
  }, []);

  // Fetch staff list on open
  useEffect(() => {
    if (isOpen) {
      setPin('');
      setErrorMsg('');
      setIsDropdownOpen(false);
      loadStaff();
    }
  }, [isOpen, loadStaff]);

  const getRoleIcon = (role: string, className = 'w-4 h-4') => {
    switch (role) {
      case 'ADMIN':
      case 'MANAGER':
        return <Settings className={`${className} text-orange-400`} />;
      case 'WAITER':
        return <BellRing className={`${className} text-purple-400`} />;
      case 'CASHIER':
        return <CreditCard className={`${className} text-emerald-400`} />;
      case 'KITCHEN':
        return <ChefHat className={`${className} text-rose-400`} />;
      default:
        return <UserCheck className={`${className} text-slate-400`} />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
      case 'MANAGER':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/40';
      case 'WAITER':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'CASHIER':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'KITCHEN':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  const handleDigitPress = useCallback((digit: string) => {
    setPin((prev) => {
      if (prev.length < 4) {
        const next = prev + digit;
        setErrorMsg('');
        return next;
      }
      return prev;
    });
  }, []);

  const handleBackspace = useCallback(() => {
    setPin((prev) => prev.slice(0, -1));
    setErrorMsg('');
  }, []);

  const handleClear = useCallback(() => {
    setPin('');
    setErrorMsg('');
  }, []);

  const submitLogin = useCallback(
    async (enteredPin: string) => {
      if (enteredPin.length < 4) {
        setErrorMsg('Please enter a 4-digit PIN');
        return;
      }

      setIsSubmitting(true);
      setErrorMsg('');

      const result = await loginWithPin({
        pinCode: enteredPin,
        staffId: selectedStaff?.id,
        email: selectedStaff?.email,
      });

      setIsSubmitting(false);

      if (result.success) {
        if (selectedStaff) {
          if (selectedStaff.role === 'WAITER') navigate('/waiter');
          else if (selectedStaff.role === 'CASHIER') navigate('/cashier');
          else if (selectedStaff.role === 'KITCHEN') navigate('/kitchen');
          else if (selectedStaff.role === 'ADMIN' || selectedStaff.role === 'MANAGER') navigate('/admin');
          else navigate('/cashier');
        }
        handleClose();
      } else {
        setIsShaking(true);
        setErrorMsg(result.error || 'Incorrect PIN code. Please try again.');
        setPin('');
        setTimeout(() => setIsShaking(false), 500);
      }
    },
    [loginWithPin, selectedStaff, navigate, handleClose]
  );

  // Auto-verify when 4 digits reached
  useEffect(() => {
    if (pin.length === 4) {
      submitLogin(pin);
    }
  }, [pin, submitLogin]);

  // Physical Keyboard Listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // If typing in search input, don't capture as PIN
      if ((e.target as HTMLElement)?.tagName === 'INPUT' && (e.target as HTMLElement)?.id === 'staff-search') {
        return;
      }

      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        handleDigitPress(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      } else if (e.key === 'Enter' && pin.length > 0) {
        e.preventDefault();
        submitLogin(pin);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, pin, handleDigitPress, handleBackspace, handleClose, submitLogin]);

  if (!isOpen) return null;

  const filteredStaff = staffList.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 selection:bg-orange-500">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity cursor-pointer"
        onClick={handleClose}
      />

      {/* Modal Card */}
      <div
        className={`relative bg-slate-900/95 text-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl z-10 border border-slate-800 backdrop-blur-xl transition-all ${isShaking ? 'animate-bounce' : 'animate-in fade-in zoom-in-95'
          }`}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close Staff Terminal"
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center mx-auto mb-2.5 shadow-xl shadow-orange-600/30 ring-1 ring-orange-400/30">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black font-['Outfit'] tracking-tight">
            Staff Terminal Sign In
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Identify your staff account and enter your security PIN
          </p>
        </div>

        {/* Selected Staff Account Banner / Switcher */}
        <div className="mb-4">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 flex items-center justify-between">
            <span>Staff Account (Name & Email):</span>
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="text-orange-400 hover:text-orange-300 font-semibold lowercase text-[11px] flex items-center space-x-1"
            >
              <span>{isDropdownOpen ? 'Close Switcher' : 'Switch Account'}</span>
              <ChevronDown className={`w-3.5 h-3.5 transform transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
          </label>

          {/* Active Account Card */}
          {selectedStaff ? (
            <div
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="group cursor-pointer p-3 rounded-2xl bg-slate-800/80 border border-slate-700/80 hover:border-orange-500/50 hover:bg-slate-800 transition-all flex items-center justify-between shadow-sm"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center shadow-inner">
                  {getRoleIcon(selectedStaff.role, 'w-5 h-5')}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-white group-hover:text-orange-300 transition-colors">
                      {selectedStaff.name}
                    </span>
                    <span
                      className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-md font-bold border ${getRoleBadgeColor(
                        selectedStaff.role
                      )}`}
                    >
                      {selectedStaff.role}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-xs text-slate-400 mt-0.5">
                    <Mail className="w-3 h-3 text-slate-500" />
                    <span>{selectedStaff.email}</span>
                  </div>
                </div>
              </div>

              <div className="text-slate-400 group-hover:text-white p-1">
                <ChevronDown className={`w-4 h-4 transform transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-slate-800 border border-slate-700 text-xs text-slate-400 flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block" />
                <span>{isLoadingStaff ? 'Connecting to staff database...' : 'No active staff accounts loaded'}</span>
              </span>
              <button
                type="button"
                onClick={loadStaff}
                className="px-2.5 py-1 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-bold text-[11px] transition-colors cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {/* Dropdown Staff Account Selector */}
          {isDropdownOpen && (
            <div className="mt-2 p-2 bg-slate-950/95 border border-slate-700/80 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 max-h-56 overflow-y-auto">
              {/* Search input */}
              <div className="relative mb-2 px-1">
                <Search className="w-3.5 h-3.5 absolute left-3.5 top-2.5 text-slate-400" />
                <input
                  id="staff-search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, email or role..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="space-y-1">
                {filteredStaff.map((staff) => {
                  const isCurrent = selectedStaff?.id === staff.id;
                  return (
                    <button
                      key={staff.id}
                      type="button"
                      onClick={() => {
                        setSelectedStaff(staff);
                        setIsDropdownOpen(false);
                        setPin('');
                        setErrorMsg('');
                      }}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-xs text-left transition-all ${isCurrent
                          ? 'border-orange-500/80 bg-orange-500/15 text-white ring-1 ring-orange-500/30'
                          : 'border-slate-800/80 bg-slate-900/60 text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <div className="p-1.5 rounded-lg bg-slate-800">
                          {getRoleIcon(staff.role, 'w-3.5 h-3.5')}
                        </div>
                        <div>
                          <div className="font-bold">{staff.name}</div>
                          <div className="text-[11px] text-slate-400">{staff.email}</div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span
                          className={`text-[9px] uppercase font-mono px-1.5 py-0.5 rounded border font-bold ${getRoleBadgeColor(
                            staff.role
                          )}`}
                        >
                          {staff.role}
                        </span>
                        {isCurrent && <Check className="w-3.5 h-3.5 text-orange-400" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* PIN Entry Area */}
        <div className="my-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Enter 4-Digit Security PIN:
            </span>
            <button
              type="button"
              onClick={() => setShowPin(!showPin)}
              className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center space-x-1"
            >
              {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showPin ? 'Hide PIN' : 'Show PIN'}</span>
            </button>
          </div>

          {/* PIN Indicators Display */}
          <div className="py-2.5 px-4 bg-slate-950/70 border border-slate-800 rounded-2xl flex items-center justify-center space-x-4 shadow-inner">
            {[0, 1, 2, 3].map((index) => {
              const digit = pin[index];
              const isFilled = digit !== undefined;
              return (
                <div
                  key={index}
                  className={`w-11 h-12 rounded-xl flex items-center justify-center font-mono text-lg font-black transition-all duration-200 ${isFilled
                      ? 'bg-orange-500/20 border-2 border-orange-500 text-orange-400 shadow-md shadow-orange-500/20 scale-105'
                      : 'bg-slate-800/80 border border-slate-700 text-slate-500'
                    }`}
                >
                  {isFilled ? (showPin ? digit : '●') : ''}
                </div>
              );
            })}
          </div>

          {/* Keyboard prompt */}
          <p className="text-[10px] text-center text-slate-500 mt-1.5 font-medium">
            Type on keyboard or use keypad below • Press Enter to verify
          </p>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-center text-xs font-bold text-rose-400 mb-2.5 animate-pulse">
            {errorMsg}
          </div>
        )}

        {/* Numeric PIN Keypad */}
        <div className="grid grid-cols-3 gap-2 my-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigitPress(digit)}
              disabled={isSubmitting}
              className="h-11 rounded-2xl bg-slate-800/90 hover:bg-slate-700 active:bg-orange-600 active:text-white border border-slate-700/70 text-lg font-black font-mono transition-all flex items-center justify-center shadow-sm cursor-pointer"
            >
              {digit}
            </button>
          ))}

          <button
            type="button"
            onClick={handleClear}
            className="h-11 rounded-2xl bg-slate-800/40 hover:bg-slate-800 text-slate-400 hover:text-rose-400 text-xs font-bold transition-all flex items-center justify-center cursor-pointer"
          >
            Clear
          </button>

          <button
            type="button"
            onClick={() => handleDigitPress('0')}
            disabled={isSubmitting}
            className="h-11 rounded-2xl bg-slate-800/90 hover:bg-slate-700 active:bg-orange-600 active:text-white border border-slate-700/70 text-lg font-black font-mono transition-all flex items-center justify-center shadow-sm cursor-pointer"
          >
            0
          </button>

          <button
            type="button"
            onClick={handleBackspace}
            aria-label="Delete digit"
            className="h-11 rounded-2xl bg-slate-800/40 hover:bg-slate-800 text-slate-400 hover:text-white transition-all flex items-center justify-center cursor-pointer"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Submit Button */}
        <button
          type="button"
          onClick={() => submitLogin(pin)}
          disabled={isSubmitting || pin.length < 4}
          className={`w-full mt-3 py-3 rounded-2xl font-bold text-sm flex items-center justify-center space-x-2 transition-all shadow-lg ${pin.length === 4
              ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-orange-600/30 hover:scale-[1.01] cursor-pointer'
              : 'bg-slate-800 text-slate-500 border border-slate-700/60 cursor-not-allowed'
            }`}
        >
          {isSubmitting ? (
            <span>Authenticating...</span>
          ) : (
            <>
              <span>Sign In as {selectedStaff?.name || 'Staff'}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        {/* Quick Demo PIN Reference Helper */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 text-center">
          <button
            type="button"
            onClick={() => setShowDemoPins(!showDemoPins)}
            className="text-[11px] text-slate-400 hover:text-orange-400 font-semibold inline-flex items-center space-x-1"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-orange-400" />
            <span>{showDemoPins ? 'Hide Test PINs' : 'Need demo PINs? Click here'}</span>
          </button>

          {showDemoPins && (
            <div className="mt-2 p-2 rounded-xl bg-slate-950/80 border border-slate-800 grid grid-cols-2 gap-1.5 font-mono text-[10px] text-slate-300 animate-in fade-in">
              <button
                type="button"
                onClick={() => {
                  const s = staffList.find((x) => x.role === 'ADMIN');
                  if (s) setSelectedStaff(s);
                  setPin('0000');
                }}
                className="p-1 rounded bg-slate-800/80 hover:bg-orange-500/20 hover:text-orange-300 border border-slate-700/60 text-left transition-colors"
              >
                Admin: <strong>0000</strong>
              </button>
              <button
                type="button"
                onClick={() => {
                  const s = staffList.find((x) => x.role === 'WAITER');
                  if (s) setSelectedStaff(s);
                  setPin('1234');
                }}
                className="p-1 rounded bg-slate-800/80 hover:bg-orange-500/20 hover:text-orange-300 border border-slate-700/60 text-left transition-colors"
              >
                Waiter: <strong>1234</strong>
              </button>
              <button
                type="button"
                onClick={() => {
                  const s = staffList.find((x) => x.role === 'CASHIER');
                  if (s) setSelectedStaff(s);
                  setPin('5678');
                }}
                className="p-1 rounded bg-slate-800/80 hover:bg-orange-500/20 hover:text-orange-300 border border-slate-700/60 text-left transition-colors"
              >
                Cashier: <strong>5678</strong>
              </button>
              <button
                type="button"
                onClick={() => {
                  const s = staffList.find((x) => x.role === 'KITCHEN');
                  if (s) setSelectedStaff(s);
                  setPin('9999');
                }}
                className="p-1 rounded bg-slate-800/80 hover:bg-orange-500/20 hover:text-orange-300 border border-slate-700/60 text-left transition-colors"
              >
                Kitchen: <strong>9999</strong>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffPinModal;
