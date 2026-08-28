import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard,
  Users,
  Utensils,
  Receipt,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronRight,
  RefreshCw,
  PlusCircle,
  DollarSign,
} from 'lucide-react';
import { Table, TableStatus, TableSession } from '../types';
import { useSocket } from '../context/SocketContext';
import { ReceiptModal } from '../components/ReceiptModal';

export const CashierPOS: React.FC = () => {
  const navigate = useNavigate();
  const { socket, joinRoom } = useSocket();

  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [activeSession, setActiveSession] = useState<TableSession | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const fetchTables = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/tables');
      if (res.ok) {
        const data = await res.json();
        setTables(data);
        if (selectedTable) {
          const updated = data.find((t: Table) => t.id === selectedTable.id);
          if (updated) {
            setSelectedTable(updated);
            setActiveSession(updated.activeSession || null);
          }
        }
      }
    } catch (e) {
      console.error('Error fetching tables:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
    joinRoom('cashier');
  }, []);

  // WebSocket listeners
  useEffect(() => {
    if (!socket) return;

    const handleTableStatusChanged = () => {
      fetchTables();
    };

    const handleOrderCreated = () => {
      fetchTables();
    };

    const handleOrderStatusUpdated = () => {
      fetchTables();
    };

    const handleBillRequested = () => {
      fetchTables();
    };

    const handleBillSettled = () => {
      fetchTables();
    };

    socket.on('table:status_changed', handleTableStatusChanged);
    socket.on('order:created', handleOrderCreated);
    socket.on('order:status_updated', handleOrderStatusUpdated);
    socket.on('bill:requested', handleBillRequested);
    socket.on('bill:settled', handleBillSettled);

    return () => {
      socket.off('table:status_changed', handleTableStatusChanged);
      socket.off('order:created', handleOrderCreated);
      socket.off('order:status_updated', handleOrderStatusUpdated);
      socket.off('bill:requested', handleBillRequested);
      socket.off('bill:settled', handleBillSettled);
    };
  }, [socket]);

  // Select Table for detail drawer
  const handleSelectTable = (table: Table) => {
    setSelectedTable(table);
    setActiveSession(table.activeSession || null);
  };

  // Payment Settlement handler
  const handleSettlePayment = async (sessionId: string, method: string) => {
    try {
      const res = await fetch('/api/cashier/settle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, paymentMethod: method }),
      });
      if (res.ok) {
        await fetchTables();
        setSelectedTable(null);
        setActiveSession(null);
      }
    } catch (e) {
      console.error('Failed to settle bill:', e);
    }
  };

  // Manual Table Status Change
  const handleChangeStatus = async (tableNumber: string, newStatus: TableStatus) => {
    try {
      await fetch(`/api/tables/${tableNumber}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchTables();
    } catch (e) {
      console.error('Error changing table status:', e);
    }
  };

  // Force Clear / Reset Table
  const handleResetTable = async (tableNumber: string) => {
    if (!window.confirm(`Are you sure you want to reset Table #${tableNumber} to Available?`)) return;
    try {
      await fetch(`/api/cashier/reset-table/${tableNumber}`, {
        method: 'POST',
      });
      fetchTables();
      setSelectedTable(null);
      setActiveSession(null);
    } catch (e) {
      console.error('Error resetting table:', e);
    }
  };

  // Status color badge map
  const getTableVisuals = (status: TableStatus) => {
    switch (status) {
      case 'AVAILABLE':
        return {
          bg: 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-700',
          dot: 'bg-emerald-500',
          badge: 'Available',
          badgeStyle: 'bg-emerald-100 text-emerald-800',
        };
      case 'OCCUPIED':
        return {
          bg: 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/40 text-amber-700',
          dot: 'bg-amber-500',
          badge: 'Occupied / Browsing',
          badgeStyle: 'bg-amber-100 text-amber-800',
        };
      case 'WAITING_FOOD':
        return {
          bg: 'bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/40 text-blue-700',
          dot: 'bg-blue-500',
          badge: 'Waiting for Food',
          badgeStyle: 'bg-blue-100 text-blue-800',
        };
      case 'EATING':
        return {
          bg: 'bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/40 text-orange-700',
          dot: 'bg-orange-500',
          badge: 'Eating & Drinking',
          badgeStyle: 'bg-orange-100 text-orange-800',
        };
      case 'BILL_REQUESTED':
        return {
          bg: 'bg-rose-500/15 hover:bg-rose-500/25 border-rose-500 text-rose-800 ring-2 ring-rose-500/50 animate-pulse',
          dot: 'bg-rose-600',
          badge: 'Bill Requested 🧾',
          badgeStyle: 'bg-rose-600 text-white font-extrabold shadow-sm',
        };
      default:
        return {
          bg: 'bg-slate-100 border-slate-200 text-slate-700',
          dot: 'bg-slate-400',
          badge: status,
          badgeStyle: 'bg-slate-100 text-slate-700',
        };
    }
  };

  const activeTablesCount = tables.filter((t) => t.status !== 'AVAILABLE').length;
  const billRequestedCount = tables.filter((t) => t.status === 'BILL_REQUESTED').length;
  const totalFloorRevenue = tables.reduce((sum, t) => sum + (t.totalAmount || 0), 0);

  const filteredTables = tables.filter((t) => {
    if (filterStatus === 'ALL') return true;
    if (filterStatus === 'ACTIVE') return t.status !== 'AVAILABLE';
    return t.status === filterStatus;
  });

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-6 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Header */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/20 text-white">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-orange-100 text-orange-700 font-mono">
                Smart POS & Cashier
              </span>
              <span className="text-xs text-slate-500 font-bold">
                {tables.length} Tables Registered
              </span>
            </div>
            <h1 className="text-2xl font-black font-['Outfit'] text-slate-900 mt-0.5">
              Live Table Floor Matrix
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/admin')}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <span>Admin Center</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={fetchTables}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Occupied Tables
            </p>
            <p className="text-2xl font-black font-['Outfit'] text-slate-900 mt-0.5">
              {activeTablesCount} / {tables.length}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Bill Requests
            </p>
            <p className="text-2xl font-black font-['Outfit'] text-rose-600 mt-0.5">
              {billRequestedCount}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <Receipt className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Active Floor Balance
            </p>
            <p className="text-2xl font-black font-['Outfit'] text-slate-900 mt-0.5">
              ${totalFloorRevenue.toFixed(2)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Available Tables
            </p>
            <p className="text-2xl font-black font-['Outfit'] text-emerald-600 mt-0.5">
              {tables.length - activeTablesCount}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="max-w-7xl mx-auto flex items-center gap-2 mt-6 overflow-x-auto pb-2">
        {[
          { id: 'ALL', label: 'All Tables' },
          { id: 'ACTIVE', label: 'Active Sessions' },
          { id: 'BILL_REQUESTED', label: '🔴 Bill Requested' },
          { id: 'WAITING_FOOD', label: '🔵 Waiting Food' },
          { id: 'AVAILABLE', label: '🟢 Available' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilterStatus(f.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
              filterStatus === f.id
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table Grid & Detail Section */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
        {/* Table Matrix (2 Columns on Desktop) */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-4">
          {filteredTables.map((table) => {
            const visual = getTableVisuals(table.status);
            const isSelected = selectedTable?.id === table.id;

            return (
              <div
                key={table.id}
                onClick={() => handleSelectTable(table)}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer shadow-xs hover:shadow-md flex flex-col justify-between min-h-[160px] ${
                  visual.bg
                } ${isSelected ? 'ring-3 ring-orange-500 scale-[1.02]' : ''}`}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-black font-['Outfit']">
                      Table #{table.tableNumber}
                    </span>
                    <span className="flex items-center text-[10px] font-bold text-slate-500">
                      <Users className="w-3 h-3 mr-1" />
                      {table.capacity}p
                    </span>
                  </div>

                  {/* Status Badge */}
                  <div className="mt-2">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${visual.badgeStyle}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${visual.dot} mr-1.5`} />
                      {visual.badge}
                    </span>
                  </div>
                </div>

                {/* Card Footer: Running Total / Orders */}
                <div className="mt-4 pt-2.5 border-t border-slate-900/10 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 block font-medium">Balance</span>
                    <span className="font-extrabold text-sm font-mono text-slate-900">
                      ${(table.totalAmount || 0).toFixed(2)}
                    </span>
                  </div>

                  {table.activeOrdersCount ? (
                    <span className="px-2 py-0.5 rounded bg-slate-900 text-white text-[10px] font-mono font-bold">
                      {table.activeOrdersCount} in prep
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Table Inspection & Settlement Panel */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-lg h-fit sticky top-20">
          {selectedTable ? (
            <div className="space-y-5">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black font-['Outfit'] text-slate-900">
                      Table #{selectedTable.tableNumber}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase ${
                        getTableVisuals(selectedTable.status).badgeStyle
                      }`}
                    >
                      {selectedTable.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Capacity: {selectedTable.capacity} Seats ·{' '}
                    {selectedTable.activeSession ? 'Session Active' : 'No Active Session'}
                  </p>
                </div>

                <button
                  onClick={() => navigate(`/table/${selectedTable.tableNumber}`)}
                  className="p-2 rounded-xl bg-orange-50 text-orange-600 hover:bg-orange-100 text-xs font-bold flex items-center gap-1"
                  title="Open Customer QR View for this table"
                >
                  <span>QR View</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Status Override */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Change Floor Status:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      'AVAILABLE',
                      'OCCUPIED',
                      'WAITING_FOOD',
                      'EATING',
                      'BILL_REQUESTED',
                    ] as TableStatus[]
                  ).map((st) => (
                    <button
                      key={st}
                      onClick={() => handleChangeStatus(selectedTable.tableNumber, st)}
                      className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all text-left border ${
                        selectedTable.status === st
                          ? 'border-orange-500 bg-orange-50 text-orange-900 font-extrabold'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Order Rounds Summary */}
              {activeSession && activeSession.orders?.length ? (
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Active Orders ({activeSession.orders.length})
                    </h4>
                    <span className="text-xs font-mono font-extrabold text-orange-600">
                      ${(selectedTable.totalAmount || 0).toFixed(2)}
                    </span>
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                    {activeSession.orders.map((order, idx) => (
                      <div
                        key={order.id}
                        className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 text-xs"
                      >
                        <div className="flex justify-between font-bold text-slate-700 mb-1">
                          <span className="font-mono text-orange-600">
                            Round #{idx + 1} ({order.orderNumber})
                          </span>
                          <span className="text-[10px] font-bold uppercase px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">
                            {order.status}
                          </span>
                        </div>
                        <div className="space-y-0.5 text-[11px] text-slate-600">
                          {order.items.map((item) => (
                            <div key={item.id} className="flex justify-between">
                              <span>{item.quantity}x {item.menuItem?.name}</span>
                              <span className="font-mono">
                                ${(item.unitPrice * item.quantity).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Settle Action */}
                  <button
                    onClick={() => setIsReceiptModalOpen(true)}
                    className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>
                      Settle Bill (${(selectedTable.totalAmount || 0).toFixed(2)})
                    </span>
                  </button>
                </div>
              ) : (
                <div className="py-6 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl">
                  No active orders on this table.
                </div>
              )}

              {/* Force Clear Action */}
              <div className="pt-3 border-t border-slate-100">
                <button
                  onClick={() => handleResetTable(selectedTable.tableNumber)}
                  className="w-full py-2.5 border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Force Reset / Clear Table</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="py-20 text-center text-slate-400">
              <Utensils className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">No Table Selected</p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Click any table on the left matrix to inspect active orders, override status, or settle payments.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Receipt & Payment Settlement Modal */}
      {selectedTable && (
        <ReceiptModal
          isOpen={isReceiptModalOpen}
          onClose={() => setIsReceiptModalOpen(false)}
          session={activeSession}
          tableNumber={selectedTable.tableNumber}
          onSettlePayment={handleSettlePayment}
          isCashierView={true}
        />
      )}
    </div>
  );
};
