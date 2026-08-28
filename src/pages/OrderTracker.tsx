import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Clock,
  ChefHat,
  CheckCircle2,
  BellRing,
  Receipt,
  PlusCircle,
  AlertCircle,
  ArrowLeft,
  Sparkles,
  Utensils,
} from 'lucide-react';
import { Order, OrderStatus, TableSession } from '../types';
import { useSocket } from '../context/SocketContext';
import { CallWaiterModal } from '../components/CallWaiterModal';
import { ReceiptModal } from '../components/ReceiptModal';

export const OrderTracker: React.FC = () => {
  const { tableNumber = '01' } = useParams<{ tableNumber: string }>();
  const navigate = useNavigate();
  const { socket, joinRoom } = useSocket();

  const [session, setSession] = useState<TableSession | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isCallWaiterOpen, setIsCallWaiterOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isRequestingBill, setIsRequestingBill] = useState(false);
  const [billRequestedMessage, setBillRequestedMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchSession = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/tables/${tableNumber}`);
      if (res.ok) {
        const data = await res.json();
        setSession(data.activeSession);
        setOrders(data.activeSession?.orders || []);
      }
    } catch (e) {
      console.error('Error fetching table session:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
    joinRoom(`table_${tableNumber}`);
  }, [tableNumber]);

  // Real-time updates
  useEffect(() => {
    if (!socket) return;

    const handleOrderCreated = ({ order, tableNumber: orderTable }: any) => {
      if (orderTable === tableNumber) {
        setOrders((prev) => [...prev, order]);
      }
    };

    const handleOrderStatusUpdated = ({ order, tableNumber: orderTable }: any) => {
      if (orderTable === tableNumber) {
        setOrders((prev) =>
          prev.map((o) => (o.id === order.id ? order : o))
        );
      }
    };

    const handleBillSettled = ({ tableNumber: settledTable }: any) => {
      if (settledTable === tableNumber) {
        navigate(`/table/${tableNumber}`);
      }
    };

    socket.on('order:created', handleOrderCreated);
    socket.on('order:status_updated', handleOrderStatusUpdated);
    socket.on('bill:settled', handleBillSettled);

    return () => {
      socket.off('order:created', handleOrderCreated);
      socket.off('order:status_updated', handleOrderStatusUpdated);
      socket.off('bill:settled', handleBillSettled);
    };
  }, [socket, tableNumber]);

  const handleRequestBill = async () => {
    setIsRequestingBill(true);
    try {
      const res = await fetch('/api/cashier/request-bill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableNumber }),
      });
      if (res.ok) {
        setBillRequestedMessage('Bill requested! Your server is bringing the check.');
      }
    } catch (e) {
      console.error('Failed to request bill:', e);
    } finally {
      setIsRequestingBill(false);
    }
  };

  const getStatusStepIndex = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
        return 0;
      case 'ACCEPTED':
      case 'PREPARING':
        return 1;
      case 'READY':
        return 2;
      case 'SERVED':
        return 3;
      default:
        return 0;
    }
  };

  const validOrders = orders.filter((o) => o.status !== 'CANCELLED');
  const subtotal = validOrders.reduce((sum, o) => sum + o.subtotal, 0);
  const tax = validOrders.reduce((sum, o) => sum + o.tax, 0);
  const grandTotal = validOrders.reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-slate-900 text-white py-6 px-4 sm:px-6 shadow-md border-b border-slate-800">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => navigate(`/table/${tableNumber}`)}
            className="text-xs text-orange-400 hover:text-orange-300 font-bold flex items-center gap-1 mb-3 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Digital Menu</span>
          </button>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30 font-mono">
                Table #{tableNumber}
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold font-['Outfit'] mt-1">
                Live Order Status
              </h1>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsCallWaiterOpen(true)}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <BellRing className="w-4 h-4 text-orange-400" />
                <span className="hidden sm:inline">Call Server</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Bill Requested Alert Banner */}
        {billRequestedMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center gap-3 text-emerald-800 text-xs font-bold shadow-xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{billRequestedMessage}</span>
          </div>
        )}

        {isLoading ? (
          <div className="py-20 text-center">
            <div className="w-10 h-10 border-3 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-bold text-slate-500">Retrieving live orders...</p>
          </div>
        ) : validOrders.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 shadow-xs">
            <Utensils className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No active orders yet</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Select dishes from the menu to start your order round.
            </p>
            <button
              onClick={() => navigate(`/table/${tableNumber}`)}
              className="mt-4 px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-600/30"
            >
              Explore Menu
            </button>
          </div>
        ) : (
          <>
            {/* Orders Timeline */}
            <div className="space-y-4">
              {validOrders.map((order, index) => {
                const step = getStatusStepIndex(order.status);
                const steps = [
                  { label: 'Received', icon: Clock, desc: 'Sent to kitchen' },
                  { label: 'Cooking', icon: ChefHat, desc: 'Chef preparing' },
                  { label: 'Ready', icon: Sparkles, desc: 'Plate ready' },
                  { label: 'Served', icon: CheckCircle2, desc: 'Delivered' },
                ];

                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                      <div>
                        <span className="text-xs font-extrabold text-orange-600 font-mono">
                          Round #{index + 1} ({order.orderNumber})
                        </span>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Placed at{' '}
                          {new Date(order.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>

                      <span
                        className={`px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider ${
                          order.status === 'PENDING'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200 animate-pulse'
                            : order.status === 'PREPARING'
                            ? 'bg-orange-100 text-orange-800 border border-orange-200'
                            : order.status === 'READY'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 animate-bounce-short'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>

                    {/* Progress Bar / Stepper */}
                    <div className="py-2 px-1">
                      <div className="grid grid-cols-4 gap-2 text-center relative">
                        {/* Connecting Line */}
                        <div className="absolute top-4 left-6 right-6 h-0.5 bg-slate-200 -z-0" />
                        <div
                          className="absolute top-4 left-6 h-0.5 bg-orange-600 -z-0 transition-all duration-500"
                          style={{ width: `${(step / 3) * 85}%` }}
                        />

                        {steps.map((s, sIdx) => {
                          const Icon = s.icon;
                          const isComplete = sIdx <= step;
                          const isCurrent = sIdx === step;

                          return (
                            <div key={s.label} className="relative z-10 flex flex-col items-center">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                                  isCurrent
                                    ? 'bg-orange-600 text-white ring-4 ring-orange-100 shadow-md scale-110'
                                    : isComplete
                                    ? 'bg-orange-600 text-white'
                                    : 'bg-slate-100 text-slate-400 border border-slate-300'
                                }`}
                              >
                                <Icon className="w-4 h-4" />
                              </div>
                              <span
                                className={`text-[11px] font-bold mt-1.5 ${
                                  isCurrent
                                    ? 'text-orange-600 font-extrabold'
                                    : isComplete
                                    ? 'text-slate-800'
                                    : 'text-slate-400'
                                }`}
                              >
                                {s.label}
                              </span>
                              <span className="text-[9px] text-slate-400 hidden sm:block">
                                {s.desc}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Ordered Items list */}
                    <div className="mt-5 pt-3 border-t border-slate-100 space-y-2">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Items in this round:
                      </p>
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex justify-between items-center text-xs text-slate-800 bg-slate-50 p-2.5 rounded-xl border border-slate-100"
                        >
                          <div>
                            <span className="font-bold">{item.quantity}x</span>{' '}
                            <span>{item.menuItem?.name}</span>
                            {item.notes && (
                              <span className="block text-[10px] text-slate-400 italic">
                                Note: {item.notes}
                              </span>
                            )}
                          </div>
                          <span className="font-mono font-bold text-slate-700">
                            ${(item.unitPrice * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bill Summary & Multi-Order Chaining Actions */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Table Running Balance</h3>
                  <p className="text-[11px] text-slate-500">
                    Aggregated across {validOrders.length}{' '}
                    {validOrders.length === 1 ? 'order' : 'orders'}
                  </p>
                </div>
                <button
                  onClick={() => setIsReceiptOpen(true)}
                  className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>Itemized Receipt</span>
                </button>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-mono font-medium">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Sales Tax (10%)</span>
                  <span className="font-mono font-medium">${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Current Balance</span>
                  <span className="font-mono text-orange-600">${grandTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => navigate(`/table/${tableNumber}`)}
                  className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                >
                  <PlusCircle className="w-4 h-4 text-orange-600" />
                  <span>Order More Food</span>
                </button>

                <button
                  onClick={handleRequestBill}
                  disabled={isRequestingBill}
                  className="py-3 px-4 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-orange-600/30 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                >
                  <Receipt className="w-4 h-4" />
                  <span>{isRequestingBill ? 'Requesting...' : 'Request Bill'}</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Call Waiter Modal */}
      <CallWaiterModal
        isOpen={isCallWaiterOpen}
        onClose={() => setIsCallWaiterOpen(false)}
        tableNumber={tableNumber}
      />

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        session={session}
        tableNumber={tableNumber}
      />
    </div>
  );
};
