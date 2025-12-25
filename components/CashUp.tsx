
import React, { useState, useMemo } from 'react';
import { Sale, CashUp } from '../types';

interface CashUpProps {
  sales: Sale[];
  cashups: CashUp[];
  onAddCashUp: (c: CashUp) => void;
}

const CashUpView: React.FC<CashUpProps> = ({ sales, cashups, onAddCashUp }) => {
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

  const handleReconcile = () => {
    if (confirm("Are you sure you want to finalize this Cash Up session?")) {
      onAddCashUp({
        id: `CU-${Date.now()}`,
        timestamp: Date.now(),
        expectedCash, actualCash,
        expectedMPesa, actualMPesa,
        expectedCard, actualCard,
        variance, notes
      });
      setDenominations({ '1000': 0, '500': 0, '200': 0, '100': 0, '50': 0, '40': 0, '20': 0, '10': 0, '5': 0, '1': 0 });
      setActualMPesa(0); setActualCard(0); setNotes('');
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto text-black font-black">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-black uppercase tracking-tight">Shift Reconciliation</h2>
          <p className="text-black font-bold text-xs uppercase tracking-widest mt-1 opacity-60">Verify physical cash and mobile payments</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
            <h3 className="text-lg font-black text-black uppercase tracking-tight">Cash Denominations</h3>
            <div className="grid grid-cols-2 gap-x-12 gap-y-4">
                {Object.keys(denominations).sort((a,b) => Number(b)-Number(a)).map(denom => (
                    <div key={denom} className="flex items-center space-x-4">
                        <div className="w-16 text-right font-black text-black opacity-40 text-xs uppercase tracking-widest">{denom}s</div>
                        <input type="number" value={denominations[denom] || ''} onChange={(e) => handleDenomChange(denom, e.target.value)} className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-black text-black text-sm focus:border-black transition" placeholder="0" />
                        <div className="w-24 text-right font-black text-black text-xs">{(Number(denom) * denominations[denom]).toLocaleString()}</div>
                    </div>
                ))}
            </div>
            <div className="pt-6 border-t border-slate-100 flex justify-between items-center font-black">
                <span className="text-sm uppercase tracking-widest opacity-40">Total Physical Cash</span>
                <span className="text-2xl">KES {actualCash.toLocaleString()}</span>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
            <h3 className="text-lg font-black text-black uppercase tracking-tight">Digital Totals</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-2 opacity-60">Confirmed M-Pesa Bal</label>
                    <input type="number" value={actualMPesa || ''} onChange={(e) => setActualMPesa(Number(e.target.value))} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-xl text-emerald-800" />
                </div>
                <div>
                    <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-2 opacity-60">Confirmed Card Total</label>
                    <input type="number" value={actualCard || ''} onChange={(e) => setActualCard(Number(e.target.value))} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-xl text-indigo-800" />
                </div>
            </div>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-black text-sm h-24" placeholder="Closing notes..." />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-black text-white p-8 rounded-[2.5rem] shadow-xl space-y-8 sticky top-24">
            <h3 className="text-lg font-black uppercase tracking-tight text-white">Shift Finalization</h3>
            <div className="space-y-4 text-white font-black">
              {[
                { l: "Exp. Cash", v: expectedCash },
                { l: "Exp. M-Pesa", v: expectedMPesa },
                { l: "Exp. Card", v: expectedCard }
              ].map((row, i) => (
                <div key={i} className="flex justify-between border-b border-white/10 pb-3">
                  <span className="opacity-60 text-[10px] uppercase">{row.l}</span>
                  <span className="text-xs">KES {row.v.toLocaleString()}</span>
                </div>
              ))}
              <div className="pt-4 flex justify-between items-center text-lg">
                <span className="opacity-60 uppercase text-[10px]">Expected Total</span>
                <span>KES {totalExpected.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center pt-6 border-t border-white/10">
                <span className="text-white font-black text-sm uppercase tracking-tight">Variance</span>
                <span className={`text-2xl font-black ${variance < 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                  {variance > 0 ? '+' : ''}{variance.toLocaleString()}
                </span>
              </div>
            </div>
            <button onClick={handleReconcile} disabled={totalActual === 0} className="w-full py-5 bg-white text-black font-black rounded-2xl text-sm uppercase tracking-widest hover:bg-slate-100 transition disabled:opacity-30">Reconcile & Close Shift</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CashUpView;