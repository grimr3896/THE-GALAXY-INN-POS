
import React, { useState, useMemo } from 'react';
import { Sale, Product, Expense, AuditLog } from '../types';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';

interface DashboardProps {
  sales: Sale[];
  products: Product[];
  expenses: Expense[];
  audits: AuditLog[];
  isDayClosed: boolean;
  onToggleShift: (isClosed: boolean) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ sales, products, expenses, audits, isDayClosed, onToggleShift }) => {
  const [trendPeriod, setTrendPeriod] = useState<'7d' | '30d'>('7d');
  const todayDate = new Date().setHours(0, 0, 0, 0);
  const todaySales = sales.filter(s => s.timestamp >= todayDate);
  const todayRevenue = todaySales.reduce((acc, s) => acc + s.total, 0);
  
  const calculateCOGS = (batch: Sale[]) => batch.reduce((acc, s) => acc + s.items.reduce((ia, i) => {
    const p = products.find(pr => pr.id === i.productId);
    if (!p) return ia;
    return ia + (p.category === 'bottle' ? p.buyPrice * i.quantity : (p.buyPrice / (p.capacity || 1)) * (i.volume || 0) * i.quantity);
  }, 0), 0);

  const netProfitToday = todayRevenue - calculateCOGS(todaySales) - expenses.filter(e => e.date >= todayDate).reduce((acc, e) => acc + e.amount, 0);

  return (
    <div className="p-8 space-y-8 bg-slate-50 min-h-full text-black">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-black uppercase tracking-tight">System Integrity</h2>
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mt-2 border ${isDayClosed ? 'bg-red-100 text-red-600 border-red-200' : 'bg-emerald-100 text-emerald-600 border-emerald-200'}`}>
            <span className={`w-1.5 h-1.5 rounded-full mr-2 ${isDayClosed ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}></span>
            {isDayClosed ? 'Business Day Closed' : 'Business Day Open'}
          </div>
        </div>
        <button onClick={() => onToggleShift(!isDayClosed)} className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition flex items-center space-x-2 ${isDayClosed ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-red-600 text-white hover:bg-red-700'}`}>
          {isDayClosed ? 'Reopen Day (Audit Req)' : 'End Day & Secure Backup'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: "Today's Revenue", val: todayRevenue, color: 'text-black' },
          { label: "Net Profit", val: netProfitToday, color: 'text-emerald-700' },
          { label: "Audit Warnings", val: audits.filter(a => a.severity === 'critical').length, isCurrency: false, color: 'text-red-700' },
          { label: "Stock alerts", val: products.filter(p => (p.category === 'bottle' ? p.stock : (p.currentLevel || 0)) <= p.minThreshold).length, isCurrency: false, color: 'text-amber-800' }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <p className="text-black font-black uppercase tracking-widest text-[10px] opacity-70">{stat.label}</p>
            <h3 className={`text-2xl font-black mt-1 ${stat.color}`}>{stat.isCurrency === false ? stat.val : `KSH ${stat.val.toLocaleString()}`}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <h4 className="text-lg font-black text-black uppercase tracking-tight mb-2">Audit Trail</h4>
          <p className="text-black text-[10px] font-bold uppercase tracking-widest mb-6 opacity-60">Recent system actions</p>
          <div className="space-y-3 overflow-y-auto max-h-80">
            {audits.map(log => (
              <div key={log.id} className={`p-4 rounded-2xl border ${log.severity === 'critical' ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'}`}>
                <div className="flex justify-between items-start">
                  <span className={`font-black uppercase text-[9px] ${log.severity === 'critical' ? 'text-red-700' : 'text-indigo-700'}`}>{log.action}</span>
                  <span className="text-[8px] text-black font-bold opacity-60">{new Date(log.timestamp).toLocaleTimeString()}</span>
                </div>
                <p className="text-xs font-bold text-black mt-1 uppercase leading-tight">{log.details}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <h4 className="text-lg font-black text-black uppercase tracking-tight mb-2">Low Stock Prevention</h4>
          <p className="text-black text-[10px] font-bold uppercase tracking-widest mb-6 opacity-60">Action required items</p>
          <div className="space-y-4">
            {products.filter(p => (p.category === 'bottle' ? p.stock : (p.currentLevel || 0)) <= p.minThreshold).map((p, idx) => (
              <div key={idx} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                <span className="font-black text-black uppercase text-xs">{p.name}</span>
                <span className="font-black text-red-700 text-[10px] uppercase">{p.category === 'bottle' ? `${p.stock} units` : `${Math.round((p.currentLevel || 0)/1000)}L left`}</span>
              </div>
            ))}
            {products.filter(p => (p.category === 'bottle' ? p.stock : (p.currentLevel || 0)) <= p.minThreshold).length === 0 && (
                <div className="text-center py-10">
                    <p className="text-black font-black uppercase text-[10px] opacity-30 italic">No inventory alerts</p>
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;