import React, { useState, useEffect } from 'react';
import { Printer, ArrowLeft, UtensilsCrossed, Smartphone, Sparkles, QrCode } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';

interface TableQR {
  tableNumber: string;
  url: string;
  qrDataUrl: string;
}

export const QRPrintView: React.FC = () => {
  const navigate = useNavigate();
  const [tableQRs, setTableQRs] = useState<TableQR[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const generateAllQRs = async () => {
      setIsLoading(true);
      try {
        const origin = window.location.origin;
        const qrs: TableQR[] = [];

        for (let i = 1; i <= 10; i++) {
          const num = String(i).padStart(2, '0');
          const targetUrl = `${origin}/table/${num}`;
          const qrDataUrl = await QRCode.toDataURL(targetUrl, {
            width: 360,
            margin: 1,
            color: {
              dark: '#0f172a',
              light: '#ffffff',
            },
          });
          qrs.push({ tableNumber: num, url: targetUrl, qrDataUrl });
        }
        setTableQRs(qrs);
      } catch (e) {
        console.error('Error generating QR codes:', e);
      } finally {
        setIsLoading(false);
      }
    };

    generateAllQRs();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-8 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Non-Print Header Bar */}
      <div className="no-print max-w-6xl mx-auto flex items-center justify-between pb-6 mb-6 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/admin')}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black font-['Outfit'] text-slate-900">
              Printable Table QR Stands & Placards
            </h1>
            <p className="text-xs text-slate-500">
              Print high-resolution table tent cards ready for immediate guest scanning.
            </p>
          </div>
        </div>

        <button
          onClick={handlePrint}
          className="px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl font-extrabold text-sm shadow-lg shadow-orange-600/30 flex items-center gap-2 transition-all active:scale-[0.99]"
        >
          <Printer className="w-5 h-5" />
          <span>Print All Placards</span>
        </button>
      </div>

      {/* QR Cards Grid */}
      {isLoading ? (
        <div className="py-24 text-center">
          <div className="w-10 h-10 border-3 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold text-slate-500">Generating HD QR codes...</p>
        </div>
      ) : (
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-8">
          {tableQRs.map((item) => (
            <div
              key={item.tableNumber}
              className="bg-white rounded-3xl p-8 border-2 border-slate-900 shadow-xl flex flex-col items-center text-center relative overflow-hidden page-break"
            >
              {/* Top Accent Strip */}
              <div className="absolute top-0 inset-x-0 h-3 bg-gradient-to-r from-orange-600 via-amber-500 to-orange-600" />

              {/* Brand Logo & Header */}
              <div className="flex items-center space-x-2 mb-2 mt-2">
                <div className="w-8 h-8 rounded-xl bg-orange-600 text-white flex items-center justify-center shadow-md">
                  <UtensilsCrossed className="w-4 h-4" />
                </div>
                <span className="font-black text-xl font-['Outfit'] text-slate-900 tracking-tight">
                  Dine <span className="text-orange-600">OS</span>
                </span>
              </div>


              <div className="my-2">
                <span className="inline-block px-4 py-1 rounded-full bg-slate-900 text-white text-xs font-extrabold font-mono uppercase tracking-wider">
                  TABLE #{item.tableNumber}
                </span>
              </div>

              <h2 className="text-2xl font-extrabold text-slate-900 font-['Outfit'] mt-1">
                Scan to Order & Pay
              </h2>
              <p className="text-xs text-slate-500 max-w-xs mt-1">
                Point your phone camera at the QR code below to view our live digital menu, customize dishes & call your server.
              </p>

              {/* QR Code Frame */}
              <div className="mt-5 p-3 rounded-2xl bg-white border-2 border-slate-900 shadow-md">
                <img
                  src={item.qrDataUrl}
                  alt={`QR Code for Table ${item.tableNumber}`}
                  className="w-56 h-56 object-contain"
                />
              </div>

              {/* Instructions */}
              <div className="mt-5 grid grid-cols-3 gap-2 w-full text-center text-[10px] text-slate-600 pt-4 border-t border-slate-200">
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="font-extrabold text-slate-900 block">1. SCAN QR</span>
                  <span>Open phone camera</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="font-extrabold text-slate-900 block">2. ORDER</span>
                  <span>Select culinary dishes</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="font-extrabold text-slate-900 block">3. ENJOY</span>
                  <span>Kitchen cooks & serves</span>
                </div>
              </div>

              {/* Direct interactive preview link (hidden in print) */}
              <div className="no-print mt-5 pt-3 w-full border-t border-slate-100">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-bold text-orange-600 hover:text-orange-700 underline font-mono"
                >
                  Direct link: {item.url}
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
