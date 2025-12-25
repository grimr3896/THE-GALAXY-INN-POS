
import React, { useState, useMemo } from 'react';
import { Sale, AppSettings } from '../types';

interface ReportsProps {
  sales: Sale[];
  settings: AppSettings;
}

const Reports: React.FC<ReportsProps> = ({ sales, settings }) => {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  const filteredSales = useMemo(() => {
    const now = new Date();
    const startOfPeriod = new Date();
    
    if (period === 'daily') {
      startOfPeriod.setHours(0, 0, 0, 0);
    } else if (period === 'weekly') {
      startOfPeriod.setDate(now.getDate() - 7);
    } else if (period === 'monthly') {
      startOfPeriod.setMonth(now.getMonth() - 1);
    }
    
    return sales.filter(s => s.timestamp >= startOfPeriod.getTime());
  }, [sales, period]);

  const totalRevenue = filteredSales.reduce((acc, s) => acc + s.total, 0);
  const avgOrder = filteredSales.length > 0 ? totalRevenue / filteredSales.length : 0;

  const generateReportText = () => {
    let text = `${period.toUpperCase()} Report for Galaxy Inn - ${new Date().toLocaleDateString()}\n\n`;
    text += `Period: ${period}\n`;
    text += `Transactions: ${filteredSales.length}\n`;
    text += `Total Revenue: KES ${totalRevenue.toLocaleString()}\n`;
    text += `Average Sale: KES ${avgOrder.toLocaleString()}\n\n`;
    text += `Summary Table:\n`;
    filteredSales.slice(0, 20).forEach(s => {
      text += `- ${s.id}: KES ${s.total} (${s.paymentMethod})\n`;
    });
    if (filteredSales.length > 20) text += `... and ${filteredSales.length - 20} more.`;
    return encodeURIComponent(text);
  };

  const handleSendEmail = () => {
    const subject = `Galaxy Inn ${period.toUpperCase()} Report - ${new Date().toLocaleDateString()}`;
    const body = generateReportText();
    window.location.href = `mailto:${settings.bossEmail}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Financial Reports</h2>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">Exportable business intelligence</p>
        </div>
        <div className="flex space-x-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
          {(['daily', 'weekly', 'monthly'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition ${period === p ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 text-center">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Total Revenue ({period})</p>
          <h3 className="text-4xl font-black text-indigo-600">KES {totalRevenue.toLocaleString()}</h3>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 text-center">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Transactions</p>
          <h3 className="text-4xl font-black text-slate-800">{filteredSales.length}</h3>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 text-center">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Avg Ticket Size</p>
          <h3 className="text-4xl font-black text-emerald-600">KES {Math.round(avgOrder).toLocaleString()}</h3>
        </div>
      </div>

      <div className="bg-slate-900 p-10 rounded-[3rem] shadow-2xl text-white flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="space-y-2">
          <h4 className="text-2xl font-black uppercase tracking-tight">Need a hard copy?</h4>
          <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Send this report directly to the boss or download CSV</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <button 
            onClick={handleSendEmail}
            className="px-8 py-4 bg-indigo-600 text-white font-black rounded-2xl text-xs uppercase tracking-widest shadow-xl shadow-indigo-900/40 hover:bg-indigo-700 transition flex items-center justify-center space-x-3"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
            <span>Email PDF Summary</span>
          </button>
          <button 
            className="px-8 py-4 bg-slate-800 text-white font-black rounded-2xl text-xs uppercase tracking-widest hover:bg-slate-700 transition border border-slate-700 flex items-center justify-center space-x-3"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
            <span>Download CSV</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 bg-slate-50 border-b border-slate-200 font-black text-xs uppercase tracking-widest text-slate-400">Transaction Breakdown</div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-[10px] font-black text-slate-300 uppercase tracking-widest">
              <tr>
                <th className="px-8 py-4">Timestamp</th>
                <th className="px-8 py-4">Transaction ID</th>
                <th className="px-8 py-4">Net Value</th>
                <th className="px-8 py-4">Method</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredSales.map(s => (
                <tr key={s.id} className="text-sm font-bold group hover:bg-slate-50 transition">
                  <td className="px-8 py-4 text-slate-400">{new Date(s.timestamp).toLocaleTimeString()}</td>
                  <td className="px-8 py-4 text-slate-800 uppercase tracking-tighter">{s.id}</td>
                  <td className="px-8 py-4 text-indigo-600 font-black">KES {s.total.toLocaleString()}</td>
                  <td className="px-8 py-4">
                    <span className="capitalize text-[10px] px-2 py-1 bg-slate-100 rounded-lg text-slate-500 font-black uppercase tracking-widest">{s.paymentMethod}</span>
                  </td>
                </tr>
              ))}
              {filteredSales.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-slate-300 italic font-black uppercase tracking-widest">No data for selected period</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
