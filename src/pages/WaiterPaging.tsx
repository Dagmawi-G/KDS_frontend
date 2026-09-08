import React, { useState, useEffect } from 'react';
import {
  BellRing,
  CheckCircle2,
  Clock,
  Sparkles,
  Droplets,
  Scroll,
  Utensils,
  UserCheck,
  Receipt,
  HelpCircle,
  Check,
  RotateCcw,
  ChefHat,
  Flame,
  Layers,
  CheckSquare,
  Square,
  AlertCircle,
} from 'lucide-react';
import { Order, AssistanceRequest, Table, OrderStatus } from '../types';
import { useSocket } from '../context/SocketContext';
import { useSettings } from '../context/SettingsContext';
import { sounds } from '../utils/audio';
import { apiUrl } from '../utils/api';

export const WaiterPaging: React.FC = () => {
  const { socket, joinRoom } = useSocket();
  const { settings } = useSettings();

  const [waiterTab, setWaiterTab] = useState<'FLOOR' | 'KITCHEN_TICKETS'>('FLOOR');
  const [readyOrders, setReadyOrders] = useState<Order[]>([]);
  const [kitchenOrders, setKitchenOrders] = useState<Order[]>([]);
  const [assistanceRequests, setAssistanceRequests] = useState<AssistanceRequest[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [checkedItems, setCheckedItems] = useState<{ [orderItemId: number]: boolean }>({});
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  // Update timer every second for kitchen elapsed clocks
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch all waiter & kitchen data
  const fetchData = async () => {
    try {
      setIsLoading(true);
      // 1. Fetch ready orders
      const readyRes = await fetch(apiUrl('/api/orders?status=READY'));
      if (readyRes.ok) {
        setReadyOrders(await readyRes.json());
      }

      // 2. Fetch all active kitchen orders (Pending, Preparing, Ready)
      const kitchenRes = await fetch(apiUrl('/api/orders?status=PENDING,ACCEPTED,PREPARING,READY'));
      if (kitchenRes.ok) {
        setKitchenOrders(await kitchenRes.json());
      }

      // 3. Fetch open assistance requests
      const assistRes = await fetch(apiUrl('/api/assistance?status=OPEN'));
      if (assistRes.ok) {
        setAssistanceRequests(await assistRes.json());
      }

      // 4. Fetch tables
      const tablesRes = await fetch(apiUrl('/api/tables'));
      if (tablesRes.ok) {
        setTables(await tablesRes.json());
      }
    } catch (e) {
      console.error('Error fetching waiter dashboard data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    joinRoom('waiter');
    joinRoom('kitchen');
  }, []);

  // WebSocket listeners
  useEffect(() => {
    if (!socket) return;

    const handleOrderCreated = ({ order }: any) => {
      setKitchenOrders((prev) => {
        if (prev.some((o) => o.id === order.id)) return prev;
        return [...prev, order];
      });
      if (settings.workflow.soundAlerts) {
        sounds.playOrderChime();
      }
    };

    const handleOrderStatusUpdated = ({ order }: any) => {
      // Update ready orders list
      if (order.status === 'READY') {
        setReadyOrders((prev) => {
          if (prev.some((o) => o.id === order.id)) return prev;
          return [order, ...prev];
        });
        if (settings.workflow.soundAlerts) {
          sounds.playReadyBell();
        }
      } else {
        setReadyOrders((prev) => prev.filter((o) => o.id !== order.id));
      }

      // Update kitchen orders list
      if (order.status === 'SERVED' || order.status === 'CANCELLED') {
        setKitchenOrders((prev) => prev.filter((o) => o.id !== order.id));
      } else {
        setKitchenOrders((prev) => {
          const exists = prev.some((o) => o.id === order.id);
          if (exists) return prev.map((o) => (o.id === order.id ? order : o));
          return [...prev, order];
        });
      }
    };

    const handleAssistanceRequested = ({ request }: any) => {
      setAssistanceRequests((prev) => {
        if (prev.some((r) => r.id === request.id)) return prev;
        return [request, ...prev];
      });
      if (settings.workflow.soundAlerts) {
        sounds.playAssistancePing();
      }
    };

    const handleAssistanceUpdated = ({ request }: any) => {
      if (request.status === 'RESOLVED') {
        setAssistanceRequests((prev) => prev.filter((r) => r.id !== request.id));
      } else {
        setAssistanceRequests((prev) =>
          prev.map((r) => (r.id === request.id ? request : r))
        );
      }
    };

    const handleTableStatusChanged = (table: Table) => {
      setTables((prev) => prev.map((t) => (t.id === table.id ? { ...t, ...table } : t)));
    };

    socket.on('order:created', handleOrderCreated);
    socket.on('order:status_updated', handleOrderStatusUpdated);
    socket.on('assistance:requested', handleAssistanceRequested);
    socket.on('assistance:updated', handleAssistanceUpdated);
    socket.on('table:status_changed', handleTableStatusChanged);

    return () => {
      socket.off('order:created', handleOrderCreated);
      socket.off('order:status_updated', handleOrderStatusUpdated);
      socket.off('assistance:requested', handleAssistanceRequested);
      socket.off('assistance:updated', handleAssistanceUpdated);
      socket.off('table:status_changed', handleTableStatusChanged);
    };
  }, [socket, settings.workflow.soundAlerts]);

  // Update Order Status (Fulfill, Cook, Ready, Served)
  const handleUpdateOrderStatus = async (orderId: number, nextStatus: OrderStatus) => {
    try {
      const res = await fetch(apiUrl(`/api/orders/${orderId}/status`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        if (nextStatus === 'SERVED' || nextStatus === 'CANCELLED') {
          setKitchenOrders((prev) => prev.filter((o) => o.id !== orderId));
          setReadyOrders((prev) => prev.filter((o) => o.id !== orderId));
        } else {
          setKitchenOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
          if (nextStatus === 'READY') {
            setReadyOrders((prev) => {
              if (prev.some((o) => o.id === orderId)) return prev;
              return [updated, ...prev];
            });
          }
        }
      }
    } catch (e) {
      console.error('Error updating order status:', e);
    }
  };

  // Resolve Assistance Request
  const handleResolveAssistance = async (id: number) => {
    try {
      const res = await fetch(apiUrl(`/api/assistance/${id}/resolve`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'RESOLVED' }),
      });
      if (res.ok) {
        setAssistanceRequests((prev) => prev.filter((r) => r.id !== id));
      }
    } catch (e) {
      console.error('Error resolving assistance:', e);
    }
  };

  const toggleItemChecked = (itemId: number) => {
    setCheckedItems((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const getElapsedTime = (createdDateStr: string) => {
    const elapsedSeconds = Math.floor((currentTime - new Date(createdDateStr).getTime()) / 1000);
    const mins = Math.floor(elapsedSeconds / 60);
    const secs = elapsedSeconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const getAssistanceIcon = (type: string) => {
    switch (type) {
      case 'WATER':
        return <Droplets className="w-5 h-5 text-blue-500" />;
      case 'NAPKINS':
        return <Scroll className="w-5 h-5 text-amber-500" />;
      case 'CUTLERY':
        return <Utensils className="w-5 h-5 text-emerald-500" />;
      case 'WAITER':
        return <UserCheck className="w-5 h-5 text-purple-500" />;
      case 'BILL':
        return <Receipt className="w-5 h-5 text-rose-500" />;
      default:
        return <HelpCircle className="w-5 h-5 text-slate-500" />;
    }
  };

  const isMerged = settings.workflow.mergeKitchenIntoWaiter;

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-6 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Header */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-600/20 text-white">
            <BellRing className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-purple-100 text-purple-700 font-mono">
                {isMerged ? 'Unified Waiter & Kitchen Hub' : 'Floor Service & Dispatch'}
              </span>
              {isMerged && (
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-orange-100 text-orange-700 font-mono">
                  Merged KDS Mode
                </span>
              )}
            </div>
            <h1 className="text-2xl font-black font-['Outfit'] text-slate-900 mt-0.5">
              {settings.branding.name} Waiter Station
            </h1>
          </div>
        </div>

        {/* View Switcher (When Kitchen Merged) or Quick Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          {isMerged && (
            <div className="flex items-center bg-white p-1 rounded-2xl border border-slate-200 shadow-xs">
              <button
                type="button"
                onClick={() => setWaiterTab('FLOOR')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  waiterTab === 'FLOOR'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <BellRing className="w-3.5 h-3.5" />
                <span>Floor & Calls</span>
                {assistanceRequests.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-mono">
                    {assistanceRequests.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setWaiterTab('KITCHEN_TICKETS')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  waiterTab === 'KITCHEN_TICKETS'
                    ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <ChefHat className="w-3.5 h-3.5" />
                <span>Kitchen Queue</span>
                {kitchenOrders.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full bg-orange-500 text-white text-[10px] font-mono">
                    {kitchenOrders.length}
                  </span>
                )}
              </button>
            </div>
          )}

          <button
            onClick={fetchData}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Refresh Feed</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: FLOOR & ASSISTANCE CALLS */}
      {waiterTab === 'FLOOR' && (
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Left: READY TO DELIVER DISPATCH QUEUE */}
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                <h2 className="text-base font-extrabold text-slate-900 font-['Outfit']">
                  Ready for Table Delivery
                </h2>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 font-mono">
                {readyOrders.length} Pickups
              </span>
            </div>

            {isLoading ? (
              <div className="py-16 text-center text-slate-400 text-xs font-semibold">
                Loading pickups...
              </div>
            ) : readyOrders.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center border border-slate-200 text-slate-400 text-xs font-medium">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2 opacity-50" />
                All prepared food has been delivered to tables!
              </div>
            ) : (
              readyOrders.map((order) => {
                const tableNumber = order.session?.table?.tableNumber || '??';

                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-2xl p-5 border-2 border-emerald-500 shadow-md shadow-emerald-500/10 animate-in fade-in"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl font-black font-['Outfit'] text-emerald-600">
                          Table #{tableNumber}
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-400">
                          {order.orderNumber}
                        </span>
                      </div>

                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-extrabold rounded-lg font-mono flex items-center gap-1 border border-emerald-200">
                        <Sparkles className="w-3.5 h-3.5" />
                        Ready to Serve
                      </span>
                    </div>

                    {/* Items List */}
                    <div className="space-y-1.5 mb-4">
                      {order.items.map((item) => (
                        <div key={item.id} className="text-xs text-slate-800 font-medium">
                          <span className="font-mono font-black text-emerald-600 mr-2">
                            {item.quantity}x
                          </span>
                          <span>{item.menuItem?.name}</span>
                          {item.notes && (
                            <span className="block text-[10px] text-slate-400 italic pl-6">
                              "{item.notes}"
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Mark Delivered Button */}
                    <button
                      onClick={() => handleUpdateOrderStatus(order.id, 'SERVED')}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Mark Delivered to Table #{tableNumber}</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Right: ASSISTANCE REQUESTS FEED */}
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-rose-500 animate-pulse" />
                <h2 className="text-base font-extrabold text-slate-900 font-['Outfit']">
                  Customer Calls & Assistance
                </h2>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-800 font-mono">
                {assistanceRequests.length} Pending
              </span>
            </div>

            {isLoading ? (
              <div className="py-16 text-center text-slate-400 text-xs font-semibold">
                Loading requests...
              </div>
            ) : assistanceRequests.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center border border-slate-200 text-slate-400 text-xs font-medium">
                <BellRing className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                No pending customer calls. Floor is serene.
              </div>
            ) : (
              assistanceRequests.map((req) => (
                <div
                  key={req.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                        {getAssistanceIcon(req.type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-extrabold font-['Outfit'] text-slate-900">
                            Table #{req.tableNumber}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-orange-100 text-orange-700">
                            {req.type}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono">
                          Paging at{' '}
                          {new Date(req.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {req.message && (
                    <div className="mb-4 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium">
                      "{req.message}"
                    </div>
                  )}

                  <button
                    onClick={() => handleResolveAssistance(req.id)}
                    className="w-full py-2.5 bg-slate-900 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>Acknowledge & Mark Resolved</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: INTEGRATED KITCHEN TICKETS (When KDS is Merged) */}
      {waiterTab === 'KITCHEN_TICKETS' && (
        <div className="max-w-7xl mx-auto space-y-6 mt-6">
          <div className="bg-white rounded-3xl p-5 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center">
                <ChefHat className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900 font-['Outfit']">
                  Active Kitchen Preparation Line
                </h2>
                <p className="text-xs text-slate-500">
                  Accept incoming orders, begin cooking, and bump dishes straight to Ready for delivery.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-slate-600 font-mono">
              <span className="px-3 py-1 rounded-xl bg-amber-100 text-amber-800">
                {kitchenOrders.filter((o) => o.status === 'PENDING').length} Pending
              </span>
              <span className="px-3 py-1 rounded-xl bg-blue-100 text-blue-800">
                {kitchenOrders.filter((o) => o.status === 'PREPARING').length} Cooking
              </span>
              <span className="px-3 py-1 rounded-xl bg-emerald-100 text-emerald-800">
                {kitchenOrders.filter((o) => o.status === 'READY').length} Ready
              </span>
            </div>
          </div>

          {kitchenOrders.length === 0 ? (
            <div className="bg-white rounded-3xl p-16 text-center border border-slate-200 text-slate-400 space-y-3">
              <Utensils className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-700 font-['Outfit']">
                Kitchen ticket queue is completely clear!
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Incoming orders from QR table menus or cashiers will automatically chime and appear here in real time.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {kitchenOrders.map((order) => {
                const tableNumber = order.session?.table?.tableNumber || '??';
                const isPending = order.status === 'PENDING';
                const isPreparing = order.status === 'PREPARING';
                const isReady = order.status === 'READY';

                return (
                  <div
                    key={order.id}
                    className={`bg-white rounded-3xl border-2 flex flex-col justify-between shadow-md transition-all ${
                      isReady
                        ? 'border-emerald-500 shadow-emerald-500/10'
                        : isPreparing
                        ? 'border-blue-500 shadow-blue-500/10'
                        : 'border-amber-400 shadow-amber-500/10'
                    }`}
                  >
                    <div>
                      {/* Ticket Top Banner */}
                      <div
                        className={`p-4 rounded-t-2xl flex items-center justify-between text-xs font-bold ${
                          isReady
                            ? 'bg-emerald-50 text-emerald-900 border-b border-emerald-100'
                            : isPreparing
                            ? 'bg-blue-50 text-blue-900 border-b border-blue-100'
                            : 'bg-amber-50 text-amber-900 border-b border-amber-100'
                        }`}
                      >
                        <div>
                          <span className="text-xl font-black font-['Outfit'] block">
                            Table #{tableNumber}
                          </span>
                          <span className="text-[11px] font-mono opacity-70">
                            {order.orderNumber}
                          </span>
                        </div>

                        <div className="text-right">
                          <div className="flex items-center gap-1 font-mono font-extrabold text-sm">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{getElapsedTime(order.createdAt)}</span>
                          </div>
                          <span className="text-[10px] uppercase font-mono tracking-wider font-extrabold px-2 py-0.5 rounded bg-white/80 shadow-2xs">
                            {order.status}
                          </span>
                        </div>
                      </div>

                      {/* Items Checklist */}
                      <div className="p-5 space-y-3">
                        <div className="space-y-2">
                          {order.items.map((item) => {
                            const isChecked = checkedItems[item.id];
                            return (
                              <div
                                key={item.id}
                                onClick={() => toggleItemChecked(item.id)}
                                className={`p-2.5 rounded-xl border flex items-start justify-between cursor-pointer transition-all ${
                                  isChecked
                                    ? 'bg-slate-50 border-slate-200 opacity-50 line-through'
                                    : 'bg-white border-slate-200/80 hover:border-slate-300'
                                }`}
                              >
                                <div className="flex items-start space-x-2.5">
                                  <button
                                    type="button"
                                    className="mt-0.5 text-slate-400 hover:text-slate-600"
                                  >
                                    {isChecked ? (
                                      <CheckSquare className="w-4 h-4 text-emerald-600" />
                                    ) : (
                                      <Square className="w-4 h-4" />
                                    )}
                                  </button>
                                  <div>
                                    <span className="text-xs font-bold text-slate-900">
                                      <span className="font-mono text-orange-600 mr-1.5 font-black">
                                        {item.quantity}x
                                      </span>
                                      {item.menuItem?.name}
                                    </span>
                                    {item.notes && (
                                      <p className="text-[11px] text-amber-600 font-medium italic mt-0.5">
                                        Note: "{item.notes}"
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {order.specialNotes && (
                          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start gap-1.5">
                            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                            <span>Special Request: {order.specialNotes}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Status Flow Buttons */}
                    <div className="p-4 pt-0">
                      {isPending && (
                        <button
                          type="button"
                          onClick={() => handleUpdateOrderStatus(order.id, 'PREPARING')}
                          className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
                        >
                          <Flame className="w-4 h-4" />
                          <span>Start Cooking</span>
                        </button>
                      )}

                      {isPreparing && (
                        <button
                          type="button"
                          onClick={() => handleUpdateOrderStatus(order.id, 'READY')}
                          className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
                        >
                          <Sparkles className="w-4 h-4" />
                          <span>Food Cooked & Ready</span>
                        </button>
                      )}

                      {isReady && (
                        <button
                          type="button"
                          onClick={() => handleUpdateOrderStatus(order.id, 'SERVED')}
                          className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
                        >
                          <Check className="w-4 h-4 stroke-[3]" />
                          <span>Delivered to Table #{tableNumber}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WaiterPaging;
