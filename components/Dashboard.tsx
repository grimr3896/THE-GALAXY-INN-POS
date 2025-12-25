
import React, { useState, useMemo } from 'react';
import { Sale, Product, Expense } from '../types';
import { 
  BarChart, 
  Bar, 
  LineChart,
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell 
} from 'recharts';

interface DashboardProps {
  sales: Sale[];
  products: Product[];
  expenses: Expense[];
}

type PeriodType = '7d' | '30d' | '6m' | '1y' | 'custom';
type ChartType = 'bar' | 'line';

const Dashboard: React.FC<DashboardProps> = ({ sales, products, expenses }) => {
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [trendPeriod, setTrendPeriod] = useState<PeriodType>('7d');
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [customStart, setCustomStart] = useState<string>(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [customEnd, setCustomEnd] = useState<string>(new Date().toISOString().split('T')[0]);

  const todayKey = new Date().toISOString().split('T')[0];
  const todayDate = new Date().setHours(0, 0, 0, 0);
  const todaySales = sales.filter(s => s.timestamp >= todayDate);
  const todayExpenses = expenses.filter(e => e.date >= todayDate);
  const [isDayClosed, setIsDayClosed] = useState(localStorage.getItem(`dayClosed_${todayKey}`) === 'true');

  const todayRevenue = todaySales.reduce((acc, s) => acc + s.total, 0);
  const totalExpenses = todayExpenses.reduce((acc, e) => acc + e.amount, 0);

  const calculateCOGS = (salesBatch: Sale[]) => {
    return salesBatch.reduce((acc, sale) => {
      return acc + sale.items.reduce((itemAcc, item) => {
        const product = products.find(p => p.id === item.productId);
        if (!product) return itemAcc;
        let cost = 0;
        if (product.category === 'bottle') {
          cost = product.buyPrice * item.quantity;
        } else {
          cost = (product.buyPrice / (product.capacity || 1)) * (item.volume || 0) * item.quantity;
        }
        return itemAcc + cost;
      }, 0);
    }, 0);
  };

  const todayCOGS = calculateCOGS(todaySales);
  const grossProfit = todayRevenue - todayCOGS;
  const netProfit = grossProfit - totalExpenses;

  const chartData = useMemo(() => {
    const data = [];
    const now = new Date();
    let startDate: Date;
    let endDate = new Date();
    let isMonthly = false;

    if (trendPeriod === '7d') {
      startDate = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
    } else if (trendPeriod === '30d') {
      startDate = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
    } else if (trendPeriod === '6m') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      isMonthly = true;
    } else if (trendPeriod === '1y') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
      isMonthly = true;
    } else {
      startDate = new Date(customStart);
      endDate = new Date(customEnd);
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 62) isMonthly = true;
    }

    if (isMonthly) {
      const current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
      while (current <= endDate) {
        const monthStart = new Date(current.getFullYear(), current.getMonth(), 1).getTime();
        const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
        const label = current.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });

        const periodSales = sales.filter(s => s.timestamp >= monthStart && s.timestamp <= monthEnd);
        const periodExpenses = expenses.filter(e => e.date >= monthStart && e.date <= monthEnd);
        const rev = periodSales.reduce((acc, s) => acc + s.total, 0);
        const cogs = calculateCOGS(periodSales);
        const exp = periodExpenses.reduce((acc, e) => acc + e.amount, 0);

        data.push({ name: label, profit: rev - cogs - exp, revenue: rev });
        current.setMonth(current.getMonth() + 1);
      }
    } else {
      const current = new Date(startDate.setHours(0,0,0,0));
      while (current <= endDate) {
        const dayStart = current.getTime();
        const dayEnd = dayStart + (24 * 60 * 60 * 1000) - 1;
        const label = current.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

        const periodSales = sales.filter(s => s.timestamp >= dayStart && s.timestamp <= dayEnd);
        const periodExpenses = expenses.filter(e => e.date >= dayStart && e.date <= dayEnd);
        const rev = periodSales.reduce((acc, s) => acc + s.total, 0);
        const cogs = calculateCOGS(periodSales);
        const exp = periodExpenses.reduce((acc, e) => acc + e.amount, 0);

        data.push({ name: label, profit: rev - cogs - exp, revenue: rev });
        current.setDate(current.getDate() + 1);
      }
    }
    return data;
  }, [sales, expenses, products, trendPeriod, customStart, customEnd]);

  const productStats = todaySales.flatMap(s => s.items).reduce((acc: any, item) => {
    if (!acc[item.productId]) {
      acc[item.productId] = { name: item.name, revenue: 0, count: 0, profit: 0 };
    }
    const product = products.find(p => p.id === item.productId);
    let cost = 0;
    if (product) {
      if (product.category === 'bottle') {
        cost = product.buyPrice * item.quantity;
      } else {
        cost = (product.buyPrice / (product.capacity || 1)) * (item.volume || 0) * item.quantity;
      }
    }
    acc[item.productId].revenue += (item.price * item.quantity);
    acc[item.productId].count += item.quantity;
    acc[item.productId].profit += (item.price * item.quantity) - cost;
    return acc;
  }, {});

  const topSellers = Object.values(productStats)
    .sort((a: any, b: any) => b.revenue - a.revenue)
    .slice(0, 5);

  const handleCloseDay = () => {
    if (confirm("Are you sure you want to CLOSE THE DAY? This will lock the POS system until tomorrow.")) {
      localStorage.setItem(`dayClosed_${todayKey}`, 'true');
      setIsDayClosed(true);
      setShowPrintModal(true);
    }
  };

  const handlePrint = () => window.print();

  return (
    <div className="p-8 space-y-8 bg-slate-50 min-h-full">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">System Status</h2>
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mt-2 border ${isDayClosed ? 'bg-red-100 text-red-600 border-red-200' : 'bg-emerald-100 text-emerald-600 border-emerald-200'}`}>
            <span className={`w-1.5 h-1.5 rounded-full mr-2 ${isDayClosed ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}></span>
            {isDayClosed ? 'Business Day Closed' : 'Business Day Open'}
          </div>
        </div>
        <div className="flex space-x-3">
          {isDayClosed ? (
            <button onClick={() => setShowPrintModal(true)} className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-black transition flex items-center space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>
              <span>Reprint Daily Report</span>
            </button>
          ) : (
            <button onClick={handleCloseDay} className="bg-red-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-red-700 transition flex items-center space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
              <span>End Day & Close POS</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: "Today's Revenue", val: todayRevenue, color: 'text-slate-900' },
          { label: "Today's Profit", val: netProfit, color: 'text-emerald-600' },
          { label: "Transactions", val: todaySales.length, isCurrency: false, color: 'text-slate-900' },
          { label: "Expenses", val: totalExpenses, color: 'text-red-600' }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{stat.label}</p>
            <h3 className={`text-2xl font-black mt-1 ${stat.color}`}>{stat.isCurrency === false ? stat.val : `KSH ${stat.val.toLocaleString()}`}</h3>
          </div>
        ))}
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
          <div className="flex items-center space-x-4">
            <div>
              <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight">Financial Trends</h4>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Growth & Profitability Analysis</p>
            </div>
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button 
                onClick={() => setChartType('bar')}
                className={`p-1.5 rounded-lg transition-all ${chartType === 'bar' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M7 16v-4"/><path d="M11 16V9"/><path d="M15 16V5"/><path d="M19 16v-7"/></svg>
              </button>
              <button 
                onClick={() => setChartType('line')}
                className={`p-1.5 rounded-lg transition-all ${chartType === 'line' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center space-x-1 bg-slate-100/60 p-1 rounded-[1.5rem] border border-slate-200/50">
              {[
                { id: '7d', label: '7D' },
                { id: '30d', label: '30D' },
                { id: '6m', label: '6M' },
                { id: '1y', label: '1Y' },
                { id: 'custom', label: 'CUSTOM' }
              ].map(p => (
                <button
                  key={p.id}
                  onClick={() => setTrendPeriod(p.id as PeriodType)}
                  className={`px-5 py-2.5 rounded-[1.25rem] text-[10px] font-black uppercase transition-all duration-200 ${trendPeriod === p.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {trendPeriod === 'custom' && (
              <div className="flex items-center space-x-4 animate-in slide-in-from-right-2">
                <div className="relative">
                  <input 
                    type="date" 
                    value={customStart} 
                    onChange={e => setCustomStart(e.target.value)}
                    className="bg-white border-2 border-slate-200 rounded-[1rem] px-4 py-2.5 text-xs font-black text-black uppercase outline-none focus:border-indigo-500 transition-all cursor-pointer"
                  />
                </div>
                <span className="text-slate-300 font-black text-[10px] uppercase tracking-widest">TO</span>
                <div className="relative">
                  <input 
                    type="date" 
                    value={customEnd} 
                    onChange={e => setCustomEnd(e.target.value)}
                    className="bg-white border-2 border-slate-200 rounded-[1rem] px-4 py-2.5 text-xs font-black text-black uppercase outline-none focus:border-indigo-500 transition-all cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'bar' ? (
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} tickFormatter={v => `K${v/1000}k`} />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '16px', padding: '12px' }} itemStyle={{ color: '#fff', fontSize: '11px', fontWeight: 900 }} labelStyle={{ color: '#6366f1', marginBottom: '4px', fontSize: '9px', fontWeight: 900 }} />
                <Bar dataKey="profit" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={entry.profit >= 0 ? '#10b981' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            ) : (
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} tickFormatter={v => `K${v/1000}k`} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '16px', padding: '12px' }} itemStyle={{ color: '#fff', fontSize: '11px', fontWeight: 900 }} labelStyle={{ color: '#6366f1', marginBottom: '4px', fontSize: '9px', fontWeight: 900 }} />
                <Line type="monotone" dataKey="profit" stroke="#6366f1" strokeWidth={4} dot={{ fill: '#6366f1', strokeWidth: 2, r: 4 }} activeDot={{ r: 6, strokeWidth: 0 }} />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-2">Top 5 Sellers</h4>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-6">Revenue Leaders Today</p>
          <div className="space-y-4">
            {topSellers.map((s: any, idx) => (
              <div key={idx} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                <span className="font-black text-slate-700 uppercase text-xs">{s.name}</span>
                <span className="font-black text-indigo-600">KSH {s.revenue.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-2">Inventory Alerts</h4>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-6">Items Below Min Threshold</p>
          <div className="space-y-4">
            {products.filter(p => (p.category === 'bottle' ? p.stock : (p.currentLevel || 0)) <= p.minThreshold).slice(0, 5).map((p, idx) => (
              <div key={idx} className="flex justify-between items-center p-4 bg-red-50 rounded-2xl border border-red-100">
                <span className="font-black text-red-900 uppercase text-xs">{p.name}</span>
                <span className="font-black text-red-600 text-[10px] uppercase">Low Stock</span>
              </div>
            ))}
            {products.filter(p => (p.category === 'bottle' ? p.stock : (p.currentLevel || 0)) <= p.minThreshold).length === 0 && (
              <p className="text-slate-400 italic text-sm text-center py-4">All stock levels healthy.</p>
            )}
          </div>
        </div>
      </div>

      {showPrintModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 print:shadow-none print:p-0">
            <div className="flex justify-between items-center mb-6 print:hidden">
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Business Day Closure</h3>
              <button onClick={() => setShowPrintModal(false)} className="text-slate-400 hover:text-slate-600 transition">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div id="printable-receipt" className="border-2 border-dashed border-black p-8 rounded-3xl bg-white font-mono text-[11px] leading-relaxed text-black print:border-none print:p-4">
              <div className="text-center mb-6">
                <h1 className="text-2xl font-black uppercase tracking-tighter">GALAXY INN</h1>
                <p className="text-[10px] font-bold uppercase tracking-widest">Daily Business Summary</p>
                <div className="border-t border-black my-4"></div>
                <p className="text-[10px] font-bold">DATE: {new Date().toLocaleDateString('en-GB')}</p>
              </div>
              <div className="space-y-2 mb-6 border-b border-black pb-4">
                <div className="flex justify-between uppercase"><span>Total Revenue:</span><span className="font-black">KES {todayRevenue.toLocaleString()}</span></div>
                <div className="flex justify-between uppercase"><span>Net Profit:</span><span className="font-black text-lg">KES {netProfit.toLocaleString()}</span></div>
              </div>
              <div className="text-center mt-8 space-y-4">
                <p className="text-[9px] font-black uppercase tracking-widest bg-black text-white py-1">Day Closed & Reconciled</p>
              </div>
            </div>
            <div className="flex space-x-3 mt-8 print:hidden">
              <button onClick={() => setShowPrintModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-slate-200 transition">Close</button>
              <button onClick={handlePrint} className="flex-[2] py-4 bg-slate-900 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-xl hover:bg-black transition flex items-center justify-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>
                <span>Print Daily Summary</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
