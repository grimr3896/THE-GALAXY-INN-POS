
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
    if (period === 'daily') startOfPeriod.setHours(0, 0, 0, 0);
    else if (period === 'weekly') startOfPeriod.setDate(now.getDate() - 7);
    else if (period === 'monthly') startOfPeriod.setMonth(now.getMonth() - 1);
    return sales.filter(s => s.timestamp >= startOfPeriod.getTime());
  }, [sales, period]);

  const totalRevenue = filteredSales.reduce((acc, s) => acc + s.total, 0);
  const avgOrder = filteredSales.length > 0 ? totalRevenue / filteredSales.length : 0;

  return (
    <div className="p-8 space-y-8 text-black font-black">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-2xl font-black text-black uppercase tracking-tight">Financial Reports</h2>
          <p className="text-black font-bold text-xs uppercase tracking-widest mt-1 opacity-60">Exportable business intelligence</p>
        </div>
        <div className="flex space-x-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
          {(['daily', 'weekly', 'monthly'] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition ${period === p ? 'bg-black text-white shadow-md' : 'text-black opacity-40 hover:opacity-100'}`}>{p}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { l: `Revenue (${period})`, v: `KES ${totalRevenue.toLocaleString()}`, c: 'text-indigo-800' },
          { l: "Transactions", v: filteredSales.length, c: 'text-black' },
          { l: "Avg Ticket Size", v: `KES ${Math.round(avgOrder).toLocaleString()}`, c: 'text-emerald-800' }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 text-center">
            <p className="text-[10px] font-black text-black opacity-40 uppercase tracking-[0.2em] mb-3">{stat.l}</p>
            <h3 className={`text-3xl font-black ${stat.c}`}>{stat.v}</h3>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 bg-slate-50 border-b border-slate-200 text-black font-black text-xs uppercase tracking-widest">Transaction Breakdown</div>
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 text-[10px] font-black text-black opacity-30 uppercase tracking-widest">
            <tr>
              <th className="px-8 py-4">ID</th>
              <th className="px-8 py-4">Value</th>
              <th className="px-8 py-4">Method</th>
              <th className="px-8 py-4">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-black font-bold text-xs">
            {filteredSales.map(s => (
              <tr key={s.id} className="hover:bg-slate-50 transition">
                <td className="px-8 py-4 uppercase">{s.id}</td>
                <td className="px-8 py-4 font-black">KES {s.total.toLocaleString()}</td>
                <td className="px-8 py-4 opacity-60 uppercase">{s.paymentMethod}</td>
                <td className="px-8 py-4 opacity-40">{new Date(s.timestamp).toLocaleTimeString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Reports;