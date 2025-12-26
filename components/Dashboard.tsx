
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

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-6 rounded-[1.5rem] shadow-2xl border border-slate-100">
        <p className="text-[10px] font-black text-black uppercase tracking-widest mb-4 border-b border-slate-50 pb-2">{label}</p>
        <div className="space-y-2">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex justify-between items-center space-x-6">
              <span className="text-[9px] font-black uppercase tracking-widest opacity-40">{entry.name} :</span>
              <span className={`text-xs font-black ${entry.dataKey === 'expense' ? 'text-red-500' : (entry.dataKey === 'profit' ? 'text-emerald-600' : 'text-black')}`}>
                {entry.value.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const Dashboard: React.FC<DashboardProps> = ({ sales, products, expenses, audits, isDayClosed, onToggleShift }) => {
  const [trendPeriod, setTrendPeriod] = useState<'7d' | '30d' | '1y' | 'all' | 'custom'>('7d');
  const [customStart, setCustomStart] = useState(new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0]);
  const [customEnd, setCustomEnd] = useState(new Date().toISOString().split('T')[0]);

  const todayDate = new Date().setHours(0, 0, 0, 0);
  const todaySales = sales.filter(s => s.timestamp >= todayDate);
  const todayRevenue = todaySales.reduce((acc, s) => acc + s.total, 0);
  const todayExpenses = expenses.filter(e => e.date >= todayDate).reduce((acc, e) => acc + e.amount, 0);
  
  const calculateCOGS = (batch: Sale[]) => batch.reduce((acc, s) => acc + s.items.reduce((ia, i) => {
    const p = products.find(pr => pr.id === i.productId);
    if (!p) return ia;
    return ia + (p.category === 'bottle' ? p.buyPrice * i.quantity : (p.buyPrice / (p.capacity || 1)) * (i.volume || 0) * i.quantity);
  }, 0), 0);

  const netProfitToday = todayRevenue - calculateCOGS(todaySales) - todayExpenses;

  const periodBoundaries = useMemo(() => {
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
    return { start: startTimestamp, end: endTimestamp };
  }, [sales, trendPeriod, customStart, customEnd]);

  const periodExpenses = useMemo(() => {
    return expenses.filter(e => e.date >= periodBoundaries.start && e.date <= periodBoundaries.end);
  }, [expenses, periodBoundaries]);

  const totalPeriodExpenses = useMemo(() => {
    return periodExpenses.reduce((acc, e) => acc + e.amount, 0);
  }, [periodExpenses]);

  const expenseCategoryData = useMemo(() => {
    const categories: Record<string, number> = {};
    periodExpenses.forEach(e => {
      const cat = e.category || 'GENERAL';
      categories[cat] = (categories[cat] || 0) + e.amount;
    });
    return Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [periodExpenses]);

  const chartData = useMemo(() => {
    const diffDays = Math.ceil((periodBoundaries.end - periodBoundaries.start) / (1000 * 60 * 60 * 24));
    const data = [];

    if (diffDays <= 60) {
      for (let i = 0; i <= diffDays; i++) {
        const d = new Date(periodBoundaries.start);
        d.setDate(d.getDate() + i);
        const dayStart = new Date(d.setHours(0,0,0,0)).getTime();
        const dayEnd = new Date(d.setHours(23,59,59,999)).getTime();
        const daySales = sales.filter(s => s.timestamp >= dayStart && s.timestamp <= dayEnd);
        const dayExp = expenses.filter(e => e.date >= dayStart && e.date <= dayEnd);
        
        const revenue = daySales.reduce((sum, s) => sum + s.total, 0);
        const expense = dayExp.reduce((sum, e) => sum + e.amount, 0);
        const cogs = calculateCOGS(daySales);
        const profit = revenue - cogs - expense;
        
        data.push({
          name: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
          revenue,
          expense,
          profit
        });
      }
    } else {
      const current = new Date(periodBoundaries.start);
      current.setDate(1);
      const end = new Date(periodBoundaries.end);
      while (current <= end) {
        const monthStart = new Date(current.getFullYear(), current.getMonth(), 1).getTime();
        const nextMonth = new Date(current.getFullYear(), current.getMonth() + 1, 1);
        const monthEnd = nextMonth.getTime() - 1;
        
        const monthSales = sales.filter(s => s.timestamp >= monthStart && s.timestamp <= monthEnd);
        const monthExp = expenses.filter(e => e.date >= monthStart && e.date <= monthEnd);
        
        const revenue = monthSales.reduce((sum, s) => sum + s.total, 0);
        const expense = monthExp.reduce((sum, e) => sum + e.amount, 0);
        const cogs = calculateCOGS(monthSales);
        const profit = revenue - cogs - expense;
        
        data.push({
          name: current.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }),
          revenue,
          expense,
          profit
        });
        current.setMonth(current.getMonth() + 1);
      }
    }
    return data;
  }, [sales, expenses, products, periodBoundaries]);

  // Profit Leaderboard
  const productProfitability = useMemo(() => {
    const perf: Record<string, { name: string, profit: number, quantity: number }> = {};
    sales.forEach(sale => {
      sale.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (!product) return;
        const key = item.productId;
        if (!perf[key]) perf[key] = { name: item.name, profit: 0, quantity: 0 };
        const itemRevenue = item.price * item.quantity;
        let itemCost = 0;
        if (product.category === 'bottle') {
          itemCost = product.buyPrice * item.quantity;
        } else {
          itemCost = (product.buyPrice / (product.capacity || 1)) * (item.volume || 0) * item.quantity;
        }
        perf[key].profit += (itemRevenue - itemCost);
        perf[key].quantity += item.quantity;
      });
    });
    return Object.values(perf).sort((a, b) => b.profit - a.profit);
  }, [sales, products]);

  return (
    <div className="p-8 space-y-8 bg-slate-50 min-h-full text-black">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-black uppercase tracking-tight">Financial Velocity Dashboard</h2>
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mt-2 border ${isDayClosed ? 'bg-red-100 text-red-600 border-red-200' : 'bg-emerald-100 text-emerald-600 border-emerald-200'}`}>
            <span className={`w-1.5 h-1.5 rounded-full mr-2 ${isDayClosed ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}></span>
            {isDayClosed ? 'Day Closed' : 'Day Active'}
          </div>
        </div>
        <div className="flex space-x-2">
          <div className="flex space-x-1 bg-slate-100 p-1 rounded-xl">
            {(['7d', '30d', '1y', 'all', 'custom'] as const).map(p => (
              <button key={p} onClick={() => setTrendPeriod(p)}
                className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition ${trendPeriod === p ? 'bg-black text-white shadow-sm' : 'text-black opacity-40 hover:opacity-100'}`}>
                {p}
              </button>
            ))}
          </div>
          <button onClick={() => onToggleShift(!isDayClosed)} className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition flex items-center space-x-2 ${isDayClosed ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-red-600 text-white hover:bg-red-700'}`}>
            {isDayClosed ? 'Open Shift' : 'End Day'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: "Today's Revenue", val: todayRevenue, color: 'text-black' },
          { label: "Today's Expense", val: todayExpenses, color: 'text-red-700' },
          { label: "Net Profit (Today)", val: netProfitToday, color: 'text-emerald-700' },
          { label: "Period Expenses", val: totalPeriodExpenses, color: 'text-indigo-800' }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 bg-slate-50 rounded-bl-[3rem] -mr-4 -mt-4 transition-all group-hover:scale-110"></div>
            <p className="text-black font-black uppercase tracking-widest text-[9px] opacity-40 relative z-10">{stat.label}</p>
            <h3 className={`text-2xl font-black mt-1 relative z-10 ${stat.color}`}>KSH {stat.val.toLocaleString()}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
          <div className="mb-6">
            <h4 className="text-lg font-black text-black uppercase tracking-tight">Financial Performance Trend</h4>
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">Revenue, Expenses, and Net Profit comparison</p>
          </div>
          <div className="h-[400px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#000' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#000' }} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#000000" strokeWidth={4} dot={false} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="expense" name="Expenses" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                <Line type="monotone" dataKey="profit" name="Net Profit" stroke="#10b981" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <h4 className="text-lg font-black text-black uppercase tracking-tight mb-2">Expense Analysis</h4>
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-8">Category Distribution</p>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={expenseCategoryData} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#000' }} width={80} />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '16px', border: 'none', fontWeight: 900, fontSize: '10px' }} />
                <Bar dataKey="value" name="Amount" radius={[0, 10, 10, 0]} barSize={20}>
                  {expenseCategoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="#ef4444" opacity={1 - (index * 0.15)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 text-center">
             <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40">Period Total Expenses</p>
             <p className="text-xl font-black text-red-600">KSH {totalPeriodExpenses.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-10">
        <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm">
          <h4 className="text-lg font-black text-black uppercase tracking-tight mb-2">Profit Leaders</h4>
          <p className="text-black text-[10px] font-bold uppercase tracking-widest mb-6 opacity-40">Top Performing SKUs</p>
          <div className="space-y-4 overflow-y-auto max-h-80 pr-2 scrollbar-hide">
            {productProfitability.slice(0, 10).map((p, idx) => (
              <div key={idx} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl group hover:bg-black transition-all">
                <div className="flex flex-col">
                    <span className="font-black text-black group-hover:text-white uppercase text-xs truncate max-w-[140px]">{p.name}</span>
                    <span className="text-[8px] font-black uppercase text-slate-400">Vol: {p.quantity} units</span>
                </div>
                <span className="font-black text-emerald-700 text-xs uppercase group-hover:text-emerald-400">KSH {Math.round(p.profit).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm">
          <h4 className="text-lg font-black text-black uppercase tracking-tight mb-2">Inventory Alerts</h4>
          <p className="text-black text-[10px] font-bold uppercase tracking-widest mb-6 opacity-40">Stock Replenishment Queue</p>
          <div className="space-y-4 overflow-y-auto max-h-80 pr-2 scrollbar-hide">
            {products.filter(p => (p.category === 'bottle' ? p.stock : (p.currentLevel || 0)) <= p.minThreshold).map((p, idx) => (
              <div key={idx} className="flex justify-between items-center p-4 bg-red-50 border border-red-100 rounded-2xl">
                <span className="font-black text-red-900 uppercase text-xs">{p.name}</span>
                <span className="font-black text-red-700 text-[10px] uppercase">{p.category === 'bottle' ? `${p.stock} units` : `${Math.round((p.currentLevel || 0)/1000)}L`}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm">
          <h4 className="text-lg font-black text-black uppercase tracking-tight mb-2">System Audit</h4>
          <p className="text-black text-[10px] font-bold uppercase tracking-widest mb-6 opacity-40">Recent Activity Log</p>
          <div className="space-y-3 overflow-y-auto max-h-80 pr-2 scrollbar-hide">
            {audits.map(log => (
              <div key={log.id} className={`p-4 rounded-2xl border ${log.severity === 'critical' ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'}`}>
                <div className="flex justify-between items-start mb-1">
                  <span className={`font-black uppercase text-[8px] tracking-widest ${log.severity === 'critical' ? 'text-red-700' : 'text-indigo-700'}`}>{log.action}</span>
                  <span className="text-[8px] text-black font-bold opacity-30">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p className="text-[10px] font-bold text-black uppercase leading-tight">{log.details}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
