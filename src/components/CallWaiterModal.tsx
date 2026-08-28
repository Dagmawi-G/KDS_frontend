import React, { useState } from 'react';
import {
  X,
  Droplets,
  Scroll,
  Utensils,
  UserCheck,
  Receipt,
  HelpCircle,
  CheckCircle2,
  Send,
} from 'lucide-react';
import { AssistanceType } from '../types';

interface CallWaiterModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableNumber: string;
  onRequestSubmitted?: (req: any) => void;
}

export const CallWaiterModal: React.FC<CallWaiterModalProps> = ({
  isOpen,
  onClose,
  tableNumber,
  onRequestSubmitted,
}) => {
  const [selectedType, setSelectedType] = useState<AssistanceType>('WATER');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const assistanceOptions: {
    type: AssistanceType;
    label: string;
    description: string;
    icon: any;
    color: string;
  }[] = [
    {
      type: 'WATER',
      label: 'Ice Water',
      description: 'Request fresh drinking water',
      icon: Droplets,
      color: 'bg-blue-50 text-blue-600 border-blue-200 hover:border-blue-400',
    },
    {
      type: 'NAPKINS',
      label: 'Extra Napkins',
      description: 'Paper or cloth napkins',
      icon: Scroll,
      color: 'bg-amber-50 text-amber-600 border-amber-200 hover:border-amber-400',
    },
    {
      type: 'CUTLERY',
      label: 'Plates & Cutlery',
      description: 'Forks, spoons, or share plates',
      icon: Utensils,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:border-emerald-400',
    },
    {
      type: 'WAITER',
      label: 'Call Server',
      description: 'Assistance from table waiter',
      icon: UserCheck,
      color: 'bg-purple-50 text-purple-600 border-purple-200 hover:border-purple-400',
    },
    {
      type: 'BILL',
      label: 'Request Bill',
      description: 'Prepare check & payment',
      icon: Receipt,
      color: 'bg-rose-50 text-rose-600 border-rose-200 hover:border-rose-400',
    },
    {
      type: 'OTHER',
      label: 'Special Request',
      description: 'Other inquiries or help',
      icon: HelpCircle,
      color: 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-400',
    },
  ];

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/assistance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableNumber,
          type: selectedType,
          message: message.trim() || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setIsSuccess(true);
        if (onRequestSubmitted) onRequestSubmitted(data);
        setTimeout(() => {
          setIsSuccess(false);
          setMessage('');
          onClose();
        }, 1800);
      }
    } catch (e) {
      console.error('Assistance request error:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl z-10 border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        {isSuccess ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1 font-['Outfit']">
              Server Notified!
            </h3>
            <p className="text-sm text-slate-500 max-w-xs mx-auto">
              Your server has received your request for Table #{tableNumber} and is on their way.
            </p>
          </div>
        ) : (
          <div>
            <div className="mb-5 text-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-orange-600 bg-orange-100 px-2.5 py-0.5 rounded-full">
                Table #{tableNumber} Service
              </span>
              <h3 className="text-xl font-extrabold text-slate-900 mt-2 font-['Outfit']">
                How Can We Help You?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Select an option below to page the floor staff immediately.
              </p>
            </div>

            {/* Assistance Grid */}
            <div className="grid grid-cols-2 gap-2.5 mb-4">
              {assistanceOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = selectedType === opt.type;
                return (
                  <button
                    key={opt.type}
                    type="button"
                    onClick={() => setSelectedType(opt.type)}
                    className={`flex items-start p-3 rounded-xl border-2 text-left transition-all ${
                      isSelected
                        ? 'border-orange-500 bg-orange-50/50 shadow-sm ring-2 ring-orange-500/20'
                        : opt.color
                    }`}
                  >
                    <Icon className={`w-5 h-5 mr-2.5 shrink-0 mt-0.5 ${isSelected ? 'text-orange-600' : ''}`} />
                    <div>
                      <p className={`text-xs font-bold ${isSelected ? 'text-orange-900' : 'text-slate-800'}`}>
                        {opt.label}
                      </p>
                      <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                        {opt.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Additional note input */}
            <div className="mb-4">
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Additional Details (Optional)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="e.g. 2 more waters with extra ice, please..."
                rows={2}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-slate-800 placeholder-slate-400"
              />
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full py-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-orange-600/30 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Call Waiter to Table #{tableNumber}</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
