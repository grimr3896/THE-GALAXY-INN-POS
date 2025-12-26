
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

  const settledSales = useMemo(() => filteredSales.filter(s => s.status === 'settled'), [filteredSales]);
  const issuedSales = useMemo(() => filteredSales.filter(s => s.status === 'issued'), [filteredSales]);

  const totalRevenue = settledSales.reduce((acc, s) => acc + s.total, 0);
  const potentialRevenue = issuedSales.reduce((acc, s) => acc + s.total, 0);
  const avgOrder = settledSales.length > 0 ? totalRevenue / settledSales.length : 0;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-8 space-y-8 text-black font-black">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 print:hidden">
        <div>
          <h2 className="text-3xl font-black text-black uppercase tracking-tighter">Performance Audit</h2>
          <p className="text-black font-bold text-xs uppercase tracking-widest mt-1 opacity-60">Inventory Issued vs Revenue Settled</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {period === 'custom' && (
            <div className="flex items-center space-x-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:grid-cols-3 print:gap-4">
        {[
          { l: `Revenue (Settled)`, v: `KSH ${totalRevenue.toLocaleString()}`, sub: "Actual Cash" },
          { l: "Outstanding (Issued)", v: `KSH ${potentialRevenue.toLocaleString()}`, sub: "In Waiter Hands" },
          { l: "Average Pour", v: `KSH ${Math.round(avgOrder).toLocaleString()}`, sub: "Settle Rate" }
        ].map((stat, i) => (
          <div key={i} className={`p-8 rounded-[2.5rem] shadow-sm border text-center relative overflow-hidden group hover:border-black transition-colors ${i === 1 && potentialRevenue > 0 ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-100'}`}>
            <p className="text-[10px] font-black text-black opacity-40 uppercase tracking-[0.2em] mb-4">{stat.l}</p>
            <h3 className="text-3xl font-black text-black mb-1">{stat.v}</h3>
            <p className="text-[8px] font-black uppercase tracking-widest text-indigo-600">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden print:border-none print:shadow-none">
        <div className="p-8 bg-slate-50 border-b border-slate-200 text-black font-black flex justify-between items-center">
          <div>
            <h4 className="text-sm uppercase tracking-widest">Global Audit Trail</h4>
          </div>
          <button 
            onClick={handlePrint} 
            className="text-[10px] bg-black text-white px-8 py-3 rounded-xl hover:bg-slate-800 transition font-black uppercase tracking-widest shadow-xl print:hidden"
          >
            Export PDF
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-black opacity-30 uppercase tracking-widest">
              <tr>
                <th className="px-8 py-4">Status</th>
                <th className="px-8 py-4">Order ID</th>
                <th className="px-8 py-4">Financial Value</th>
                <th className="px-8 py-4">Timestamp</th>
                <th className="px-8 py-4 text-right print:hidden">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-black font-bold text-xs">
              {filteredSales.map(s => (
                <tr key={s.id} className="hover:bg-slate-50 transition group">
                  <td className="px-8 py-5">
                    <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase ${s.status === 'settled' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {s.status}
                    </span>
                  </td>
                  <td className="px-8 py-5 uppercase font-black tracking-tight">{s.id}</td>
                  <td className="px-8 py-5 font-black text-sm">KSH {s.total.toLocaleString()}</td>
                  <td className="px-8 py-5 opacity-40 font-black uppercase text-[10px] tracking-tighter">
                    {new Date(s.timestamp).toLocaleDateString()}
                  </td>
                  <td className="px-8 py-5 text-right print:hidden">
                    <button onClick={() => setSelectedSale(s)} className="bg-black text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
