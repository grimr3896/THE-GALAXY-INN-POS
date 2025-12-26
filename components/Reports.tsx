
import React, { useState, useMemo } from 'react';
import { Sale, AppSettings } from '../types';

interface ReportsProps {
  sales: Sale[];
  settings: AppSettings;
}

const Reports: React.FC<ReportsProps> = ({ sales, settings }) => {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'>('daily');
  const [customStart, setCustomStart] = useState(new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0]);
  const [customEnd, setCustomEnd] = useState(new Date().toISOString().split('T')[0]);
  
  // Receipt Viewer State
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [receiptSize, setReceiptSize] = useState<'xs' | 's' | 'm' | 'l'>('s');

  const sizeClasses = {
    xs: 'text-[8px]',
    s: 'text-[10px]',
    m: 'text-[12px]',
    l: 'text-[14px]'
  };

  const filteredSales = useMemo(() => {
    const now = new Date();
    const startOfPeriod = new Date();
    
    if (period === 'daily') {
      startOfPeriod.setHours(0, 0, 0, 0);
    } else if (period === 'weekly') {
      startOfPeriod.setDate(now.getDate() - 7);
    } else if (period === 'monthly') {
      startOfPeriod.setMonth(now.getMonth() - 1);
    } else if (period === 'yearly') {
      startOfPeriod.setFullYear(now.getFullYear() - 1);
    } else if (period === 'custom') {
      const start = new Date(customStart);
      start.setHours(0, 0, 0, 0);
      const end = new Date(customEnd);
      end.setHours(23, 59, 59, 999);
      return sales.filter(s => s.timestamp >= start.getTime() && s.timestamp <= end.getTime());
    }
    
    return sales.filter(s => s.timestamp >= startOfPeriod.getTime());
  }, [sales, period, customStart, customEnd]);

  const totalRevenue = filteredSales.reduce((acc, s) => acc + s.total, 0);
  const avgOrder = filteredSales.length > 0 ? totalRevenue / filteredSales.length : 0;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-8 space-y-8 text-black font-black">
      {/* Header - Hidden on Print */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 print:hidden">
        <div>
          <h2 className="text-3xl font-black text-black uppercase tracking-tighter">Business Intelligence</h2>
          <p className="text-black font-bold text-xs uppercase tracking-widest mt-1 opacity-60">Financial Velocity & Transaction Audit</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {period === 'custom' && (
            <div className="flex items-center space-x-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-right-4">
              <input 
                type="date" 
                value={customStart} 
                onChange={(e) => setCustomStart(e.target.value)}
                className="bg-transparent border-none text-[10px] font-black uppercase outline-none px-2"
              />
              <span className="text-[10px] opacity-20">TO</span>
              <input 
                type="date" 
                value={customEnd} 
                onChange={(e) => setCustomEnd(e.target.value)}
                className="bg-transparent border-none text-[10px] font-black uppercase outline-none px-2"
              />
            </div>
          )}
          <div className="flex space-x-1 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
            {(['daily', 'weekly', 'monthly', 'yearly', 'custom'] as const).map(p => (
              <button 
                key={p} 
                onClick={() => setPeriod(p)} 
                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${period === p ? 'bg-black text-white shadow-lg' : 'text-black opacity-30 hover:opacity-100 hover:bg-slate-50'}`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:grid-cols-3 print:gap-4">
        {[
          { l: `Gross Revenue`, v: `KSH ${totalRevenue.toLocaleString()}`, sub: period.toUpperCase() },
          { l: "Transaction Count", v: filteredSales.length, sub: "Total volume" },
          { l: "Average Pour", v: `KSH ${Math.round(avgOrder).toLocaleString()}`, sub: "Per Customer" }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 text-center relative overflow-hidden group hover:border-black transition-colors">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 2v20"/><path d="m17 5-5-3-5 3"/><path d="m17 19-5 3-5-3"/></svg>
            </div>
            <p className="text-[10px] font-black text-black opacity-40 uppercase tracking-[0.2em] mb-4">{stat.l}</p>
            <h3 className="text-3xl font-black text-black mb-1">{stat.v}</h3>
            <p className="text-[8px] font-black uppercase tracking-widest text-indigo-600">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Transaction Table */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden print:border-none print:shadow-none">
        <div className="p-8 bg-slate-50 border-b border-slate-200 text-black font-black flex justify-between items-center">
          <div>
            <h4 className="text-sm uppercase tracking-widest">Transaction Audit Trail</h4>
            <p className="text-[9px] opacity-40 uppercase tracking-widest font-bold mt-1">Detailed Log of all financial events</p>
          </div>
          <button 
            onClick={handlePrint} 
            className="text-[10px] bg-black text-white px-8 py-3 rounded-xl hover:bg-slate-800 transition font-black uppercase tracking-widest shadow-xl print:hidden"
          >
            Generate Print Report
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-black opacity-30 uppercase tracking-widest">
              <tr>
                <th className="px-8 py-4">Transaction ID</th>
                <th className="px-8 py-4">Financial Value</th>
                <th className="px-8 py-4">Method</th>
                <th className="px-8 py-4">Timestamp</th>
                <th className="px-8 py-4 text-right print:hidden">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-black font-bold text-xs">
              {filteredSales.map(s => (
                <tr key={s.id} className="hover:bg-slate-50 transition group">
                  <td className="px-8 py-5 uppercase font-black tracking-tight">{s.id}</td>
                  <td className="px-8 py-5 font-black text-sm">KSH {s.total.toLocaleString()}</td>
                  <td className="px-8 py-5">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${s.paymentMethod === 'm-pesa' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-100 text-black border-slate-200'}`}>
                        {s.paymentMethod}
                    </span>
                  </td>
                  <td className="px-8 py-5 opacity-40 font-black uppercase text-[10px] tracking-tighter">
                    {new Date(s.timestamp).toLocaleDateString()} {new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                  </td>
                  <td className="px-8 py-5 text-right print:hidden">
                    <button 
                      onClick={() => setSelectedSale(s)}
                      className="inline-flex items-center space-x-2 bg-black text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all hover:bg-indigo-600"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                      <span>Receipt</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receipt Modal */}
      {selectedSale && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-sm p-8 shadow-2xl animate-in zoom-in-95 print:shadow-none print:p-0">
            <div className="flex justify-center space-x-2 mb-8 print:hidden">
              {(['xs', 's', 'm', 'l'] as const).map(size => (
                <button
                  key={size}
                  onClick={() => setReceiptSize(size)}
                  className={`px-4 py-2 rounded-xl font-black text-[10px] uppercase border-2 transition-all ${receiptSize === size ? 'bg-black text-white border-black shadow-lg' : 'bg-white text-black border-slate-100 hover:border-black'}`}
                >
                  {size.toUpperCase()}
                </button>
              ))}
            </div>

            <div id="printable-customer-receipt" className={`border-4 border-dashed border-black p-8 rounded-[2rem] bg-white font-mono leading-tight text-black print:border-none print:p-4 ${sizeClasses[receiptSize]}`}>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-black uppercase tracking-tighter mb-1">{settings.storeName}</h2>
                <div className="border-t border-black border-dashed my-3"></div>
                <p className="font-black uppercase tracking-widest bg-black text-white px-2 py-1 inline-block text-[10px]">Audit Receipt</p>
              </div>
              
              <div className="space-y-1.5 mb-6 font-bold uppercase tracking-tight">
                <div className="flex justify-between"><span className="opacity-50">Trans ID:</span><span>{selectedSale.id}</span></div>
                <div className="flex justify-between"><span className="opacity-50">Date:</span><span>{new Date(selectedSale.timestamp).toLocaleDateString()}</span></div>
                <div className="flex justify-between"><span className="opacity-50">Cashier:</span><span>{selectedSale.cashierId}</span></div>
              </div>

              <div className="space-y-2 mb-6 border-y border-black border-dashed py-4">
                {selectedSale.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start">
                    <div className="flex-1 uppercase font-bold pr-4">
                        <span>{item.name}</span>
                        <div className="text-[8px] opacity-50">{item.quantity} x {item.price.toLocaleString()}</div>
                    </div>
                    <span className="font-black">{(item.quantity * item.price).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1.5 font-bold mb-6">
                <div className="flex justify-between font-black text-xl pt-2 mt-2 border-t border-black"><span>TOTAL:</span><span>KES {selectedSale.total.toLocaleString()}</span></div>
                <div className="flex justify-between text-[10px] mt-2 border-t border-black/10 pt-2 opacity-60"><span>VAT ({settings.vatRate}% Included):</span><span>KES {(selectedSale.vatAmount || 0).toLocaleString()}</span></div>
                <div className="flex justify-between text-[10px] opacity-60"><span>SUBTOTAL (Excl. VAT):</span><span>KES {(selectedSale.total - (selectedSale.vatAmount || 0)).toLocaleString()}</span></div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl space-y-1 text-[9px] uppercase font-black border border-slate-100">
                <div className="flex justify-between"><span>PAY METHOD:</span><span>{selectedSale.paymentMethod}</span></div>
                {selectedSale.paymentMethod === 'cash' && (
                  <>
                    <div className="flex justify-between border-t border-slate-200 mt-1 pt-1"><span>TENDERED:</span><span>KES {selectedSale.amountReceived?.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span>BALANCE:</span><span>KES {selectedSale.changeGiven?.toLocaleString()}</span></div>
                  </>
                )}
                <div className="flex justify-between border-t border-slate-200 mt-1 pt-1"><span>STATUS:</span><span className="text-emerald-700">AUTHORIZED</span></div>
              </div>

              <div className="text-center mt-8 pt-6 border-t border-black border-dashed font-black uppercase tracking-[0.2em] text-[8px] opacity-40 italic">
                Verified Electronic Transaction Record
              </div>
            </div>

            <div className="flex space-x-3 mt-10 print:hidden">
              <button 
                onClick={() => setSelectedSale(null)} 
                className="flex-1 py-5 bg-slate-100 text-black font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95"
              >
                Close
              </button>
              <button 
                onClick={() => window.print()} 
                className="flex-[2] py-5 bg-black text-white font-black rounded-2xl text-[10px] uppercase tracking-widest flex items-center justify-center space-x-2 shadow-2xl hover:bg-slate-800 transition-all active:scale-95"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>
                <span>Print Copy</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
