
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
  const [trendPeriod, setTrendPeriod] = useState<'7d' | '30d' | '1y' | 'all' | 'custom'>('7d');
  const [customStart, setCustomStart] = useState(new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0]);
  const [customEnd, setCustomEnd] = useState(new Date().toISOString().split('T')[0]);

  const todayDate = new Date().setHours(0, 0, 0, 0);
  const todaySales = sales.filter(s => s.timestamp >= todayDate);
  const todayRevenue = todaySales.reduce((acc, s) => acc + s.total, 0);
  
  const calculateCOGS = (batch: Sale[]) => batch.reduce((acc, s) => acc + s.items.reduce((ia, i) => {
    const p = products.find(pr => pr.id === i.productId);
    if (!p) return ia;
    return ia + (p.category === 'bottle' ? p.buyPrice * i.quantity : (p.buyPrice / (p.capacity || 1)) * (i.volume || 0) * i.quantity);
  }, 0), 0);

  const netProfitToday = todayRevenue - calculateCOGS(todaySales) - expenses.filter(e => e.date >= todayDate).reduce((acc, e) => acc + e.amount, 0);

  // Chart Data Preparation with Dynamic Aggregation
  const chartData = useMemo(() => {
    let startTimestamp: number;
    let endTimestamp: number = new Date().getTime();
    
    if (trendPeriod === '7d') {
      startTimestamp = new Date().setDate(new Date().getDate() - 7);
    } else if (trendPeriod === '30d') {
      startTimestamp = new Date().setDate(new Date().getDate() - 30);
    } else if (trendPeriod === '1y') {
      startTimestamp = new Date().setFullYear(new Date().getFullYear() - 1);
    } else if (trendPeriod === 'all') {
      startTimestamp = sales.length > 0 ? Math.min(...sales.map(s => s.timestamp)) : new Date().getTime();
    } else {
      startTimestamp = new Date(customStart).getTime();
      endTimestamp = new Date(customEnd).setHours(23, 59, 59, 999);
    }

    const diffDays = Math.ceil((endTimestamp - startTimestamp) / (1000 * 60 * 60 * 24));
    const data = [];

    // Aggregation Logic: If more than 60 days, group by Month instead of Day
    if (diffDays <= 60) {
      for (let i = 0; i <= diffDays; i++) {
        const d = new Date(startTimestamp);
        d.setDate(d.getDate() + i);
        const dayStart = new Date(d.setHours(0,0,0,0)).getTime();
        const dayEnd = new Date(d.setHours(23,59,59,999)).getTime();
        
        const daySales = sales.filter(s => s.timestamp >= dayStart && s.timestamp <= dayEnd);
        const revenue = daySales.reduce((sum, s) => sum + s.total, 0);
        
        data.push({
          name: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
          revenue
        });
      }
    } else {
      // Group by Month
      const current = new Date(startTimestamp);
      current.setDate(1); // Start at beginning of month
      const end = new Date(endTimestamp);
      
      while (current <= end) {
        const monthStart = new Date(current.getFullYear(), current.getMonth(), 1).getTime();
        const nextMonth = new Date(current.getFullYear(), current.getMonth() + 1, 1);
        const monthEnd = nextMonth.getTime() - 1;
        
        const monthSales = sales.filter(s => s.timestamp >= monthStart && s.timestamp <= monthEnd);
        const revenue = monthSales.reduce((sum, s) => sum + s.total, 0);
        
        data.push({
          name: current.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }),
          revenue
        });
        
        current.setMonth(current.getMonth() + 1);
      }
    }
    
    return data;
  }, [sales, trendPeriod, customStart, customEnd]);

  const categoryData = useMemo(() => {
    const categories: Record<string, number> = { 'BOTTLE': 0, 'DRUM': 0 };
    sales.forEach(s => {
      s.items.forEach(item => {
        const prod = products.find(p => p.id === item.productId);
        const cat = prod?.category.toUpperCase() || 'BOTTLE';
        categories[cat] += item.price * item.quantity;
      });
    });
    return Object.entries(categories).map(([name, value]) => ({ name, value }));
  }, [sales, products]);

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

      {/* Graphs Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h4 className="text-lg font-black text-black uppercase tracking-tight">Revenue Trend</h4>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">Financial Velocity Analytics</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {trendPeriod === 'custom' && (
                <div className="flex items-center space-x-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200 shadow-inner">
                  <input 
                    type="date" 
                    value={customStart} 
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="bg-transparent border-none text-[8px] font-black uppercase outline-none px-1"
                  />
                  <span className="text-[8px] opacity-20">TO</span>
                  <input 
                    type="date" 
                    value={customEnd} 
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="bg-transparent border-none text-[8px] font-black uppercase outline-none px-1"
                  />
                </div>
              )}
              <div className="flex space-x-1 bg-slate-100 p-1 rounded-xl">
                {(['7d', '30d', '1y', 'all', 'custom'] as const).map(p => (
                  <button 
                    key={p} 
                    onClick={() => setTrendPeriod(p)}
                    className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition ${trendPeriod === p ? 'bg-black text-white shadow-sm' : 'text-black opacity-40 hover:opacity-100'}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="h-[300px] w-full relative min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 8, fontWeight: 800, fill: '#000' }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 8, fontWeight: 800, fill: '#000' }}
                  tickFormatter={(val) => val >= 1000 ? `${val/1000}k` : val}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 900, fontSize: '10px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#4f46e5" 
                  strokeWidth={4} 
                  dot={chartData.length < 40 ? { r: 3, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' } : false} 
                  activeDot={{ r: 6, strokeWidth: 0 }}
                  animationDuration={800}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
          <h4 className="text-lg font-black text-black uppercase tracking-tight mb-2">Categories</h4>
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-8">Performance by Type</p>
          <div className="h-[300px] w-full relative min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart data={categoryData} layout="vertical">
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 9, fontWeight: 900, fill: '#000' }}
                  width={60}
                />
                <Tooltip 
                   cursor={{ fill: 'transparent' }}
                   contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 900, fontSize: '10px' }}
                />
                <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={24}>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#000000' : '#4f46e5'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <h4 className="text-lg font-black text-black uppercase tracking-tight mb-2">Audit Trail</h4>
          <p className="text-black text-[10px] font-bold uppercase tracking-widest mb-6 opacity-60">Recent system actions</p>
          <div className="space-y-3 overflow-y-auto max-h-80 pr-2">
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
