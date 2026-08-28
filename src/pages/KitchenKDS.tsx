import React, { useState, useEffect } from 'react';
import {
  ChefHat,
  Clock,
  CheckCircle,
  AlertTriangle,
  Play,
  Check,
  Volume2,
  VolumeX,
  Flame,
  ArrowRight,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { useSocket } from '../context/SocketContext';
import { sounds } from '../utils/audio';

export const KitchenKDS: React.FC = () => {
  const { socket, joinRoom } = useSocket();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Fetch active kitchen orders
  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(
        '/api/orders?status=PENDING,ACCEPTED,PREPARING,READY'
      );
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (e) {
      console.error('Error fetching kitchen orders:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    joinRoom('kitchen');

    // Update elapsed timer tick every second
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // WebSocket Listeners for real-time kitchen feed
  useEffect(() => {
    if (!socket) return;

    const handleOrderCreated = ({ order }: any) => {
      setOrders((prev) => {
        // Prevent duplicate
        if (prev.some((o) => o.id === order.id)) return prev;
        return [...prev, order];
      });
      if (soundEnabled) {
        sounds.playOrderChime();
      }
    };

    const handleOrderStatusUpdated = ({ order }: any) => {
      setOrders((prev) => {
        if (order.status === 'SERVED' || order.status === 'CANCELLED') {
          return prev.filter((o) => o.id !== order.id);
        }
        return prev.map((o) => (o.id === order.id ? order : o));
      });
    };

    const handleBillSettled = () => {
      fetchOrders();
    };

    socket.on('order:created', handleOrderCreated);
    socket.on('order:status_updated', handleOrderStatusUpdated);
    socket.on('bill:settled', handleBillSettled);

    return () => {
      socket.off('order:created', handleOrderCreated);
      socket.off('order:status_updated', handleOrderStatusUpdated);
      socket.off('bill:settled', handleBillSettled);
    };
  }, [socket, soundEnabled]);

  // Update order status action
  const handleUpdateStatus = async (orderId: number, nextStatus: OrderStatus) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setOrders((prev) => {
          if (nextStatus === 'SERVED' || nextStatus === 'CANCELLED') {
            return prev.filter((o) => o.id !== orderId);
          }
          return prev.map((o) => (o.id === orderId ? updated : o));
        });
      }
    } catch (e) {
      console.error('Failed to update order status:', e);
    }
  };

  // Helper to calculate elapsed time and color
  const getElapsedInfo = (createdAt: string) => {
    const elapsedMs = currentTime - new Date(createdAt).getTime();
    const minutes = Math.floor(elapsedMs / 60000);
    const seconds = Math.floor((elapsedMs % 60000) / 1000);
    const formatted = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

    let badgeColor = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
    let isUrgent = false;

    if (minutes >= 15) {
      badgeColor = 'bg-rose-500/20 text-rose-400 border-rose-500/50 animate-pulse';
      isUrgent = true;
    } else if (minutes >= 8) {
      badgeColor = 'bg-amber-500/20 text-amber-400 border-amber-500/40';
    }

    return { formatted, minutes, badgeColor, isUrgent };
  };

  // Categorize orders into Kanban columns
  const newOrders = orders.filter(
    (o) => o.status === 'PENDING' || o.status === 'ACCEPTED'
  );
  const prepOrders = orders.filter((o) => o.status === 'PREPARING');
  const readyOrders = orders.filter((o) => o.status === 'READY');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* KDS Header Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-600 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20 border border-orange-400/30">
            <ChefHat className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 font-mono">
                Kitchen Display System
              </span>
              <span className="text-[10px] font-bold text-slate-400">
                {orders.length} Active Tickets
              </span>
            </div>
            <h1 className="text-2xl font-black font-['Outfit'] tracking-tight mt-0.5">
              Live Cooking Station
            </h1>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3 w-full md:w-auto justify-between md:justify-end">
          <button
            onClick={() => sounds.playOrderChime()}
            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Test Chime</span>
          </button>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 border ${
              soundEnabled
                ? 'bg-orange-500/20 text-orange-400 border-orange-500/40'
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span>{soundEnabled ? 'Alerts On' : 'Muted'}</span>
          </button>

          <button
            onClick={fetchOrders}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-extrabold shadow-md shadow-orange-600/30 transition-all flex items-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Kanban Board Columns */}
      {isLoading ? (
        <div className="py-28 text-center">
          <div className="w-12 h-12 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-bold text-slate-400">Syncing kitchen queue...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-6 items-start">
          {/* Column 1: NEW ORDERS */}
          <div className="bg-slate-900/60 rounded-3xl p-4 border border-slate-800/80 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4 px-1">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
                <h2 className="font-extrabold text-sm uppercase tracking-wider text-rose-400 font-['Outfit']">
                  New Incoming
                </h2>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-black bg-rose-500/20 text-rose-300 border border-rose-500/30">
                {newOrders.length}
              </span>
            </div>

            <div className="space-y-4">
              {newOrders.length === 0 ? (
                <div className="py-12 text-center text-slate-600 text-xs font-medium border-2 border-dashed border-slate-800/60 rounded-2xl">
                  No new orders waiting
                </div>
              ) : (
                newOrders.map((order) => {
                  const elapsed = getElapsedInfo(order.createdAt);
                  const tableNumber = order.session?.table?.tableNumber || '??';

                  return (
                    <div
                      key={order.id}
                      className="bg-slate-900 rounded-2xl p-4 border-2 border-rose-500/40 shadow-lg shadow-rose-950/20 animate-in fade-in slide-in-from-top-2"
                    >
                      {/* Ticket Header */}
                      <div className="flex items-center justify-between pb-2.5 border-b border-slate-800 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-black font-['Outfit'] text-white">
                            Table #{tableNumber}
                          </span>
                          <span className="text-xs font-mono font-bold text-slate-400">
                            {order.orderNumber}
                          </span>
                        </div>

                        <div
                          className={`px-2.5 py-1 rounded-lg border font-mono text-xs font-bold flex items-center gap-1 ${elapsed.badgeColor}`}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>{elapsed.formatted}</span>
                        </div>
                      </div>

                      {/* Dietary / Special Notes */}
                      {order.specialNotes && (
                        <div className="mb-3 p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-start gap-1.5">
                          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                          <span>Note: {order.specialNotes}</span>
                        </div>
                      )}

                      {/* Items */}
                      <div className="space-y-2 mb-4">
                        {order.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-start justify-between text-xs py-1 border-b border-slate-800/50"
                          >
                            <div className="flex-1">
                              <span className="font-black text-amber-400 text-sm font-mono mr-2">
                                {item.quantity}x
                              </span>
                              <span className="font-extrabold text-slate-200">
                                {item.menuItem?.name}
                              </span>
                              {item.notes && (
                                <span className="block text-[11px] text-amber-300/80 font-medium pl-6">
                                  ↳ {item.notes}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Action */}
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'PREPARING')}
                        className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-orange-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                      >
                        <Play className="w-4 h-4 fill-current" />
                        <span>Accept & Start Cooking</span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Column 2: IN PREPARATION */}
          <div className="bg-slate-900/60 rounded-3xl p-4 border border-slate-800/80 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4 px-1">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-amber-500" />
                <h2 className="font-extrabold text-sm uppercase tracking-wider text-amber-400 font-['Outfit']">
                  Cooking / In Prep
                </h2>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {prepOrders.length}
              </span>
            </div>

            <div className="space-y-4">
              {prepOrders.length === 0 ? (
                <div className="py-12 text-center text-slate-600 text-xs font-medium border-2 border-dashed border-slate-800/60 rounded-2xl">
                  No orders currently cooking
                </div>
              ) : (
                prepOrders.map((order) => {
                  const elapsed = getElapsedInfo(order.createdAt);
                  const tableNumber = order.session?.table?.tableNumber || '??';

                  return (
                    <div
                      key={order.id}
                      className="bg-slate-900 rounded-2xl p-4 border border-amber-500/40 shadow-lg shadow-amber-950/20"
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between pb-2.5 border-b border-slate-800 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-black font-['Outfit'] text-white">
                            Table #{tableNumber}
                          </span>
                          <span className="text-xs font-mono font-bold text-slate-400">
                            {order.orderNumber}
                          </span>
                        </div>

                        <div
                          className={`px-2.5 py-1 rounded-lg border font-mono text-xs font-bold flex items-center gap-1 ${elapsed.badgeColor}`}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>{elapsed.formatted}</span>
                        </div>
                      </div>

                      {/* Dietary / Special Notes */}
                      {order.specialNotes && (
                        <div className="mb-3 p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-start gap-1.5">
                          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                          <span>Note: {order.specialNotes}</span>
                        </div>
                      )}

                      {/* Items */}
                      <div className="space-y-2 mb-4">
                        {order.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-start justify-between text-xs py-1 border-b border-slate-800/50"
                          >
                            <div className="flex-1">
                              <span className="font-black text-amber-400 text-sm font-mono mr-2">
                                {item.quantity}x
                              </span>
                              <span className="font-extrabold text-slate-200">
                                {item.menuItem?.name}
                              </span>
                              {item.notes && (
                                <span className="block text-[11px] text-amber-300/80 font-medium pl-6">
                                  ↳ {item.notes}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Action */}
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'READY')}
                        className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>Mark Order Ready (Ping Waiter)</span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Column 3: READY TO SERVE */}
          <div className="bg-slate-900/60 rounded-3xl p-4 border border-slate-800/80 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4 px-1">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                <h2 className="font-extrabold text-sm uppercase tracking-wider text-emerald-400 font-['Outfit']">
                  Ready for Pickup
                </h2>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {readyOrders.length}
              </span>
            </div>

            <div className="space-y-4">
              {readyOrders.length === 0 ? (
                <div className="py-12 text-center text-slate-600 text-xs font-medium border-2 border-dashed border-slate-800/60 rounded-2xl">
                  No plates ready for pickup
                </div>
              ) : (
                readyOrders.map((order) => {
                  const elapsed = getElapsedInfo(order.createdAt);
                  const tableNumber = order.session?.table?.tableNumber || '??';

                  return (
                    <div
                      key={order.id}
                      className="bg-slate-900 rounded-2xl p-4 border-2 border-emerald-500/50 shadow-lg shadow-emerald-950/20"
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between pb-2.5 border-b border-slate-800 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-black font-['Outfit'] text-emerald-400">
                            Table #{tableNumber}
                          </span>
                          <span className="text-xs font-mono font-bold text-slate-400">
                            {order.orderNumber}
                          </span>
                        </div>

                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold uppercase">
                          Ready
                        </span>
                      </div>

                      {/* Items */}
                      <div className="space-y-1.5 mb-4 text-xs">
                        {order.items.map((item) => (
                          <div key={item.id} className="text-slate-300">
                            <span className="font-bold text-emerald-400 font-mono">
                              {item.quantity}x
                            </span>{' '}
                            <span>{item.menuItem?.name}</span>
                          </div>
                        ))}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'PREPARING')}
                          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition-colors"
                          title="Recall to cooking"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleUpdateStatus(order.id, 'SERVED')}
                          className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 border border-slate-700"
                        >
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                          <span>Bump to Served</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
