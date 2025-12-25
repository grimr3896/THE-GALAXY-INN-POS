
import React, { useState } from 'react';
import { Expense } from '../types';

interface ExpensesProps {
  expenses: Expense[];
  onAddExpense: (e: Expense) => void;
  onDeleteExpense: (id: string) => void;
}

const Expenses: React.FC<ExpensesProps> = ({ expenses, onAddExpense, onDeleteExpense }) => {
  const [showModal, setShowModal] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState(0);
  const [category, setCategory] = useState('PURCHASE');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!description.trim() || Number(amount) <= 0) {
      alert("Please provide a description and a valid amount.");
      return;
    }
    
    const newExpense: Expense = {
      id: `EXP-${Date.now()}`,
      date: new Date(date).getTime(),
      description: description.trim(),
      amount: Number(amount),
      category: category.trim().toUpperCase()
    };
    onAddExpense(newExpense);
    setShowModal(false);
    resetForm();
  };

  const resetForm = () => {
    setDescription('');
    setAmount(0);
    setCategory('PURCHASE');
    setDate(new Date().toISOString().split('T')[0]);
  };

  const total = expenses.reduce((acc, e) => acc + e.amount, 0);

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Business Expenses</h2>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">Track overheads and purchases</p>
        </div>
        <button 
          type="button"
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition shadow-xl shadow-indigo-100"
        >
          Add New Expense
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-black text-[10px] uppercase tracking-widest">
            <tr>
              <th className="px-8 py-4">Date</th>
              <th className="px-8 py-4">Description</th>
              <th className="px-8 py-4">Category</th>
              <th className="px-8 py-4 text-right">Amount</th>
              <th className="px-8 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {expenses.map(e => (
              <tr key={e.id} className="hover:bg-slate-50 transition font-bold text-sm">
                <td className="px-8 py-5 text-slate-500">{new Date(e.date).toLocaleDateString()}</td>
                <td className="px-8 py-5 text-slate-800 uppercase">{e.description}</td>
                <td className="px-8 py-5">
                  <span className="bg-slate-100 text-slate-500 text-[9px] px-2 py-1 rounded-lg uppercase tracking-widest font-black">
                    {e.category}
                  </span>
                </td>
                <td className="px-8 py-5 text-right text-red-500 font-black">KSH {e.amount.toLocaleString()}</td>
                <td className="px-8 py-5 text-right">
                  <button type="button" onClick={() => onDeleteExpense(e.id)} className="text-slate-300 hover:text-red-500 transition">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                  </button>
                </td>
              </tr>
            ))}
            {expenses.length === 0 && (
              <tr>
                <td colSpan={5} className="p-20 text-center text-slate-300 italic font-black uppercase tracking-widest">
                  No expenses recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-10 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-2">ADD NEW EXPENSE</h3>
            <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mb-10">FILL IN THE DETAILS FOR THE NEW EXPENSE.</p>
            
            <div className="space-y-8">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">DESCRIPTION</label>
                <input 
                  type="text" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-black uppercase text-sm focus:border-indigo-200 transition"
                  placeholder="ELECTRICITY, RENT..."
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">AMOUNT (KSH)</label>
                <input 
                  type="number" 
                  value={amount === 0 ? '' : amount} 
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-black text-slate-400 text-2xl focus:border-indigo-200 transition"
                  placeholder="0"
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">CATEGORY</label>
                  <input 
                    type="text"
                    value={category} 
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-black text-black uppercase text-xs focus:border-indigo-200 transition"
                    placeholder="PURCHASE"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">DATE</label>
                  <input 
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-black text-black text-xs focus:border-indigo-200 transition"
                  />
                </div>
              </div>
              
              <div className="flex space-x-4 pt-6">
                <button 
                  type="button" 
                  onClick={() => { setShowModal(false); resetForm(); }} 
                  className="flex-1 py-5 bg-slate-50 text-slate-500 font-black rounded-2xl text-[11px] uppercase tracking-widest hover:bg-slate-100 transition"
                >
                  CANCEL
                </button>
                <button 
                  type="button" 
                  onClick={handleSubmit} 
                  className="flex-1 py-5 bg-indigo-600 text-white font-black rounded-2xl text-[11px] uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition"
                >
                  SAVE CHANGES
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;
