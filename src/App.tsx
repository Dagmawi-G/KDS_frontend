import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SocketProvider } from './context/SocketContext';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { CustomerMenu } from './pages/CustomerMenu';
import { OrderTracker } from './pages/OrderTracker';
import { KitchenKDS } from './pages/KitchenKDS';
import { WaiterPaging } from './pages/WaiterPaging';
import { CashierPOS } from './pages/CashierPOS';
import { AdminManager } from './pages/AdminManager';
import { QRPrintView } from './pages/QRPrintView';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
            <Navbar />

          <main className="flex-1">
            <Routes>
              {/* Customer QR Ordering & Tracker */}
              <Route path="/table/:tableNumber" element={<CustomerMenu />} />
              <Route path="/table/:tableNumber/orders" element={<OrderTracker />} />

              {/* Kitchen Display System */}
              <Route path="/kitchen" element={<KitchenKDS />} />

              {/* Waiter Dispatch */}
              <Route path="/waiter" element={<WaiterPaging />} />

              {/* Cashier & POS */}
              <Route path="/cashier" element={<CashierPOS />} />

              {/* Admin & Reports */}
              <Route path="/admin" element={<AdminManager />} />

              {/* Printable Table QR Placards */}
              <Route path="/qr-print" element={<QRPrintView />} />

              {/* Default fallback route */}
              <Route path="/" element={<Navigate to="/cashier" replace />} />
              <Route path="*" element={<Navigate to="/cashier" replace />} />
            </Routes>
          </main>
        </div>
      </Router>
    </SocketProvider>
  </AuthProvider>
  );
};

export default App;

