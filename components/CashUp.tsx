
import React, { useState, useMemo } from 'react';
import { Sale, CashUp, DaySnapshot } from '../types';
import { useStore } from '../store';

interface CashUpProps {
  sales: Sale[];
  cashups: CashUp[];
  onAddCashUp: (c: CashUp) => void;
}

const CashUpView: React.FC<CashUpProps> = ({ sales, cashups, onAddCashUp }) => {
  const store = useStore();
  const [denominations, setDenominations] = useState<Record<string, number>>({
    '1000': 0, '500': 0, '200': 0, '100': 0, '50': 0, '40': 0, '20': 0, '10': 0, '5': 0, '1': 0
  });

  const [actualMPesa, setActualMPesa] = useState(0);
  const [actualCard, setActualCard] = useState(0);
  const [notes, setNotes] = useState('');

  const actualCash = useMemo(() => {
    return Object.entries(denominations).reduce((acc: number, [denom, count]: [string, number]) => acc + (Number(denom) * count), 0);
  }, [denominations]);

  const lastCashUpTime = cashups.length > 0 ? cashups[0].timestamp : 0;
  const currentShiftSales = useMemo(() => sales.filter(s => s.timestamp > lastCashUpTime), [sales, lastCashUpTime]);

  const expectedCash = useMemo(() => currentShiftSales.reduce((acc, s) => s.paymentMethod === 'cash' ? acc + s.total : (s.paymentMethod === 'split' ? acc + (s.splitBreakdown?.cash || 0) : acc), 0), [currentShiftSales]);
  const expectedMPesa = useMemo(() => currentShiftSales.reduce((acc, s) => s.paymentMethod === 'm-pesa' ? acc + s.total : (s.paymentMethod === 'split' ? acc + (s.splitBreakdown?.mpesa || 0) : acc), 0), [currentShiftSales]);
  const expectedCard = useMemo(() => currentShiftSales.reduce((acc, s) => s.paymentMethod === 'card' ? acc + s.total : (s.paymentMethod === 'split' ? acc + (s.splitBreakdown?.card || 0) : acc), 0), [currentShiftSales]);

  const totalExpected = expectedCash + expectedMPesa + expectedCard;
  const totalActual = actualCash + actualMPesa + actualCard;
  const variance = totalActual - totalExpected;

  const handleDenomChange = (denom: string, val: string) => {
      const num = parseInt(val) || 0;
      setDenominations(prev => ({ ...prev, [denom]: num }));
  };

  const handleReconcile = async () => {
    if (confirm("FINALIZE DAY: This will lock today's sales and create an immutable record. Proceed?")) {
      const timestamp = Date.now();
      const dateId = new Date().toISOString().split('T')[0];

      const cashUpRecord: CashUp = {
        id: `CU-${timestamp}`,
        timestamp,
        expectedCash, actualCash,
        expectedMPesa, actualMPesa,
        expectedCard, actualCard,
        variance, notes
      };

      const snapshot: DaySnapshot = {
        id: dateId,
        timestamp,
        totalSales: totalExpected,
        paymentBreakdown: { cash: expectedCash, mpesa: expectedMPesa, card: expectedCard },
        totalExpenses: 0,
        variance: variance,
        isLocked: true
      };

      await store.saveCashUp(cashUpRecord);
      await store.saveSnapshot(snapshot);
      
      onAddCashUp(cashUpRecord);
      
      setDenominations({ '1000': 0, '500': 0, '200': 0, '100': 0, '50': 0, '40': 0, '20': 0, '10': 0, '5': 0, '1': 0 });
      setActualMPesa(0); setActualCard(0); setNotes('');
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto text-black font-black">
      <div className="flex justify-between items-center border-b border-slate-200 pb-8">
        <div>
          <h2 className="text-3xl font-black text-black uppercase tracking-tighter">Shift Verification</h2>
          <p className="text-black font-bold text-xs uppercase tracking-widest mt-1 opacity-60">Physical Tally & Electronic Reconciliation</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Physical Cash Count */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
            <h3 className="text-lg font-black text-black uppercase tracking-tight">Physical Cash Count</h3>
            <div className="grid grid-cols-2 gap-x-12 gap-y-4">
                {Object.keys(denominations).sort((a,b) => Number(b)-Number(a)).map(denom => (
                    <div key={denom} className="flex items-center space-x-4">
                        <div className="w-16 text-right font-black text-black opacity-30 text-[10px] uppercase tracking-widest">{denom}S</div>
                        <input 
                          type="number" 
                          value={denominations[denom] || ''} 
                          onChange={(e) => handleDenomChange(denom, e.target.value)} 
                          className="flex-1 px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-black text-sm focus:border-black transition" 
                          placeholder="0" 
                        />
                        <div className="w-24 text-right font-black text-black text-xs">{(Number(denom) * denominations[denom]).toLocaleString()}</div>
                    </div>
                ))}
            </div>
          </div>

          {/* Electronic Totals Input */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
              <h3 className="text-sm font-black text-black uppercase tracking-tight">M-Pesa Verification</h3>
              <div className="relative">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-xs opacity-20">KES</div>
                <input 
                  type="number" 
                  value={actualMPesa || ''} 
                  onChange={(e) => setActualMPesa(Number(e.target.value))} 
                  className="w-full pl-16 pr-6 py-6 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-2xl text-emerald-800 focus:border-black transition" 
                  placeholder="0"
                />
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
              <h3 className="text-sm font-black text-black uppercase tracking-tight">Card/PDQ Tally</h3>
              <div className="relative">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-xs opacity-20">KES</div>
                <input 
                  type="number" 
                  value={actualCard || ''} 
                  onChange={(e) => setActualCard(Number(e.target.value))} 
                  className="w-full pl-16 pr-6 py-6 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-2xl text-indigo-800 focus:border-black transition" 
                  placeholder="0"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* RECONCILIATION CARD - HIGH FIDELITY */}
          <div className="bg-black text-white p-10 rounded-[3rem] shadow-2xl space-y-10 sticky top-24 border border-slate-800">
            <h3 className="text-2xl font-black uppercase tracking-tight">RECONCILIATION</h3>
            
            <div className="space-y-6">
              <div className="flex justify-between items-center pb-5 border-b border-white/10">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">SYSTEM SALES</span>
                <span className="text-sm font-black">KES {totalExpected.toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between items-center pb-5 border-b border-white/10">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">CASH COUNT</span>
                <span className="text-sm font-black">KES {actualCash.toLocaleString()}</span>
              </div>

              <div className="flex justify-between items-center pb-5 border-b border-white/10">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">MPESA COUNT</span>
                <span className="text-sm font-black">KES {actualMPesa.toLocaleString()}</span>
              </div>

              <div className="pt-6 flex justify-between items-end">
                <span className="text-lg font-black uppercase tracking-tight">VARIANCE</span>
                <span className={`text-6xl font-black leading-none tracking-tighter ${variance < 0 ? 'text-red-500' : (variance === 0 ? 'text-emerald-500' : 'text-blue-500')}`}>
                  {variance.toLocaleString()}
                </span>
              </div>
            </div>

            <button 
              onClick={handleReconcile} 
              disabled={totalActual === 0} 
              className="w-full py-7 bg-white/5 border border-white/10 text-white font-black rounded-[2rem] text-[11px] uppercase tracking-[0.3em] hover:bg-white/10 disabled:opacity-20 transition-all shadow-lg active:scale-95 mt-4"
            >
              LOCK DAY & ARCHIVE
            </button>
          </div>

          <div className="p-8 bg-amber-50 rounded-[2.5rem] border border-amber-100">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-800 mb-2">Audit Note</h4>
            <textarea 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-transparent border-none font-bold text-xs outline-none text-amber-900 h-24 placeholder:text-amber-200"
              placeholder="Record any discrepancies here..."
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CashUpView;
