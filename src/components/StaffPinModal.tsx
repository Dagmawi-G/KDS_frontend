import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Lock,
  UserCheck,
  ChefHat,
  CreditCard,
  Settings,
  BellRing,
  CheckCircle,
  Delete,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { StaffUser } from '../types';
import { useAuth } from '../context/AuthContext';

interface StaffPinModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StaffPinModal: React.FC<StaffPinModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { loginWithPin } = useAuth();

  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<number | undefined>(undefined);
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  // Fetch staff list for quick user switcher
  useEffect(() => {
    if (isOpen) {
      setPin('');
      setErrorMsg('');
      fetch('/api/auth/staff')
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            const activeStaff = data.filter((s: StaffUser) => s.status === 'ACTIVE');
            setStaffList(activeStaff);
            if (activeStaff.length > 0 && !selectedStaffId) {
              setSelectedStaffId(activeStaff[0].id);
            }
          }
        })
        .catch((err) => console.error('Failed to load staff list:', err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

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
      // Find logged in staff role to redirect intelligently
      const loggedUser = staffList.find((s) => s.id === selectedStaffId);
      if (loggedUser) {
        if (loggedUser.role === 'WAITER') navigate('/waiter');
        else if (loggedUser.role === 'CASHIER') navigate('/cashier');
        else if (loggedUser.role === 'KITCHEN') navigate('/kitchen');
        else if (loggedUser.role === 'ADMIN' || loggedUser.role === 'MANAGER') navigate('/admin');
      }
      onClose();
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
        return <Settings className="w-4 h-4 text-orange-500" />;
      case 'WAITER':
        return <BellRing className="w-4 h-4 text-purple-500" />;
      case 'CASHIER':
        return <CreditCard className="w-4 h-4 text-emerald-500" />;
      case 'KITCHEN':
        return <ChefHat className="w-4 h-4 text-rose-500" />;
      default:
        return <UserCheck className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      <div
        className={`relative bg-slate-900 text-white rounded-3xl max-w-sm w-full p-6 shadow-2xl z-10 border border-slate-800 transition-transform ${
          isShaking ? 'animate-bounce' : 'animate-in fade-in zoom-in-95'
        }`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center mx-auto mb-2.5 shadow-lg shadow-orange-600/30">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-xl font-extrabold font-['Outfit'] tracking-tight">
            Staff Terminal Unlock
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Select your staff profile & enter 4-digit PIN
          </p>
        </div>

        {/* Staff Profile Selector */}
        <div className="mb-4">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
            Select Staff User:
          </label>
          <div className="grid grid-cols-1 gap-1.5 max-h-36 overflow-y-auto pr-1">
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
                      ? 'border-orange-500 bg-orange-500/15 text-orange-300 ring-1 ring-orange-500/40'
                      : 'border-slate-800 bg-slate-800/60 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <div className="p-1 rounded-lg bg-slate-800">
                      {getRoleIcon(staff.role)}
                    </div>
                    <span>{staff.name}</span>
                  </div>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                    {staff.role}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* PIN Dots Indicator */}
        <div className="my-4 py-2 flex items-center justify-center space-x-3">
          {[0, 1, 2, 3].map((index) => {
            const isFilled = pin.length > index;
            return (
              <div
                key={index}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  isFilled
                    ? 'bg-orange-500 scale-125 shadow-md shadow-orange-500/50'
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

        {/* Numeric PIN Keypad */}
        <div className="grid grid-cols-3 gap-2.5 my-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigitPress(digit)}
              disabled={isSubmitting}
              className="h-12 rounded-2xl bg-slate-800/90 hover:bg-slate-700/90 active:bg-orange-600 active:text-white border border-slate-700/70 text-lg font-black font-mono transition-all flex items-center justify-center shadow-xs"
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
            className="h-12 rounded-2xl bg-slate-800/90 hover:bg-slate-700/90 active:bg-orange-600 active:text-white border border-slate-700/70 text-lg font-black font-mono transition-all flex items-center justify-center shadow-xs"
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

        {/* Demo PIN hints for testing */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 text-[10px] text-slate-400 text-center">
          <p className="font-bold text-slate-300 mb-1">Demo PINs for Quick Testing:</p>
          <div className="flex justify-around font-mono text-orange-400">
            <span>Alex: <strong>1234</strong></span>
            <span>Sarah: <strong>5678</strong></span>
            <span>Chef: <strong>9999</strong></span>
            <span>Admin: <strong>0000</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};
