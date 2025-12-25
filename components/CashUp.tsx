import React, { useState, useMemo, useEffect } from 'react';
import { Sale, CashUp } from '../types';

interface CashUpProps {
  sales: Sale[];
  cashups: CashUp[];
  onAddCashUp: (c: CashUp) => void;
}

const CashUpView: React.FC<CashUpProps> = ({ sales, cashups, onAddCashUp }) => {
  const [denominations, setDenominations] = useState<Record<string, number>>({
    '1000': 0,
    '500': 0,
    '200': 0,
    '100': 0,
    '50': 0,
    '40': 0,
    '20': 0,
    '10': 0,
    '5': 0,
    '1': 0
  });

  const [actualMPesa, setActualMPesa] = useState(0);
  const [actualCard, setActualCard] = useState(0);
  const [notes, setNotes] = useState('');

  // Fixed arithmetic type error by explicitly typing the reduce accumulator and elements to ensure valid number operations
  const actualCash = useMemo(() => {
    return Object.entries(denominations).reduce((acc: number, [denom, count]: [string, number]) => acc + (Number(denom) * count), 0);
  }, [denominations]);

  // Expected values from sales that occurred after the last cash-up
  const lastCashUpTime = cashups.length > 0 ? cashups[0].timestamp : 0;
  
  const currentShiftSales = useMemo(() => 
    sales.filter(s => s.timestamp > lastCashUpTime),
  [sales, lastCashUpTime]);

  const expectedCash = useMemo(() => {
      return currentShiftSales.reduce((acc, s) => {
          if (s.paymentMethod === 'cash') return acc + s.total;
          if (s.paymentMethod === 'split') return acc + (s.splitBreakdown?.cash || 0);
          return acc;
      }, 0);
  }, [currentShiftSales]);

  const expectedMPesa = useMemo(() => {
      return currentShiftSales.reduce((acc, s) => {
          if (s.paymentMethod === 'm-pesa') return acc + s.total;
          if (s.paymentMethod === 'split') return acc + (s.splitBreakdown?.mpesa || 0);
          return acc;
      }, 0);
  }, [currentShiftSales]);

  const expectedCard = useMemo(() => {
      return currentShiftSales.reduce((acc, s) => {
          if (s.paymentMethod === 'card') return acc + s.total;
          if (s.paymentMethod === 'split') return acc + (s.splitBreakdown?.card || 0);
          return acc;
      }, 0);
  }, [currentShiftSales]);

  const totalExpected = expectedCash + expectedMPesa + expectedCard;
  const totalActual = actualCash + actualMPesa + actualCard;
  const variance = totalActual - totalExpected;

  const handleDenomChange = (denom: string, val: string) => {
      const num = parseInt(val) || 0;
      setDenominations(prev => ({ ...prev, [denom]: num }));
  };

  const handleReconcile = () => {
    if (confirm("Are you sure you want to finalize this Cash Up session?")) {
      const newCashUp: CashUp = {
        id: `CU-${Date.now()}`,
        timestamp: Date.now(),
        expectedCash,
        actualCash,
        expectedMPesa,
        actualMPesa,
        expectedCard,
        actualCard,
        variance,
        notes
      };
      onAddCashUp(newCashUp);
      setDenominations({
        '1000': 0, '500': 0, '200': 0, '100': 0, '50': 0, '40': 0, '20': 0, '10': 0, '5': 0, '1': 0
      });
      setActualMPesa(0);
      setActualCard(0);
      setNotes('');
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Shift Reconciliation</h2>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">Verify physical cash and mobile payments</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Cash Calculator */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
            <div className="flex justify-between items-center border-b border-slate-50 pb-4">
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Cash Denominations</h3>
                <span className="font-black text-slate-400 text-[10px] uppercase">Physical Count</span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-x-12 gap-y-4">
                {Object.keys(denominations).sort((a,b) => Number(b)-Number(a)).map(denom => (
                    <div key={denom} className="flex items-center space-x-4">
                        <div className="w-16 text-right font-black text-slate-400 text-xs uppercase tracking-widest">{denom}s</div>
                        <input 
                            type="number"
                            value={denominations[denom] || ''}
                            onChange={(e) => handleDenomChange(denom, e.target.value)}
                            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none font-black text-slate-700 text-sm focus:border-indigo-500 transition"
                            placeholder="0"
                        />
                        <div className="w-24 text-right font-black text-slate-900 text-xs">
                            {(Number(denom) * denominations[denom]).toLocaleString()}
                        </div>
                    </div>
                ))}
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-between items-center">
                <span className="text-sm font-black text-slate-400 uppercase tracking-widest">Total Physical Cash</span>
                <span className="text-2xl font-black text-slate-900">KES {actualCash.toLocaleString()}</span>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Digital & Notes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Confirmed M-Pesa Bal (Shift)</label>
                    <input 
                        type="number" 
                        value={actualMPesa || ''} 
                        onChange={(e) => setActualMPesa(Number(e.target.value))}
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-xl text-emerald-600"
                        placeholder="0"
                    />
                </div>
                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Confirmed Card Total</label>
                    <input 
                        type="number" 
                        value={actualCard || ''} 
                        onChange={(e) => setActualCard(Number(e.target.value))}
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-xl text-blue-600"
                        placeholder="0"
                    />
                </div>
            </div>
            <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Closing Notes</label>
                <textarea 
                    value={notes} 
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-600 text-sm h-24"
                    placeholder="Shortages, tip breakdowns, etc."
                />
            </div>
          </div>
        </div>

        {/* Right: Shift Summary Panel */}
        <div className="space-y-6">
          <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl space-y-8 sticky top-24">
            <div className="space-y-1">
                <h3 className="text-lg font-black uppercase tracking-tight text-indigo-400">Shift Finalization</h3>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">System Comparison</p>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between border-b border-slate-800 pb-3">
                <span className="text-slate-400 font-bold text-[10px] uppercase">Exp. Cash</span>
                <span className="font-black text-xs">KES {expectedCash.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-3">
                <span className="text-slate-400 font-bold text-[10px] uppercase">Exp. M-Pesa</span>
                <span className="font-black text-xs">KES {expectedMPesa.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-3">
                <span className="text-slate-400 font-bold text-[10px] uppercase">Exp. Card</span>
                <span className="font-black text-xs">KES {expectedCard.toLocaleString()}</span>
              </div>
              
              <div className="pt-4 space-y-2">
                <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Expected Total</span>
                    <span className="font-black text-lg">KES {totalExpected.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Actual Total</span>
                    <span className="font-black text-lg">KES {totalActual.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-6 border-t border-slate-800">
                <span className="text-indigo-400 font-black text-sm uppercase tracking-tight">Variance</span>
                <span className={`text-2xl font-black ${variance < 0 ? 'text-red-500' : variance > 0 ? 'text-emerald-500' : 'text-slate-500'}`}>
                  {variance > 0 ? '+' : ''}{variance.toLocaleString()}
                </span>
              </div>
            </div>

            <button 
              onClick={handleReconcile}
              disabled={totalActual === 0}
              className="w-full py-5 bg-indigo-600 text-white font-black rounded-2xl text-sm uppercase tracking-widest shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 transition active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reconcile & Close Shift
            </button>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest mb-6">Recent Closures</h3>
            <div className="space-y-4">
              {cashups.slice(0, 5).map(c => (
                <div key={c.id} className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center">
                  <div>
                    <p className="font-black text-slate-800 text-[10px] uppercase">{new Date(c.timestamp).toLocaleDateString()}</p>
                    <p className="text-[8px] text-slate-400 font-bold uppercase">{new Date(c.timestamp).toLocaleTimeString()}</p>
                  </div>
                  <div className={`text-xs font-black ${c.variance < 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                    {c.variance >= 0 ? '+' : ''}{c.variance.toLocaleString()}
                  </div>
                </div>
              ))}
              {cashups.length === 0 && <p className="text-center text-slate-300 text-[10px] font-black uppercase tracking-widest py-4">No History</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CashUpView;