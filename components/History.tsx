
import React, { useState } from 'react';
import { Sale, Employee, Product } from '../types';

interface HistoryProps {
  sales: Sale[];
  employees: Employee[];
  products: Product[];
}

const History: React.FC<HistoryProps> = ({ sales, employees, products }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEmployee, setFilterEmployee] = useState<string>('all');
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [receiptSize, setReceiptSize] = useState<'xs' | 's' | 'm' | 'l'>('s');

  const sizeClasses = {
    xs: 'text-[8px]',
    s: 'text-[10px]',
    m: 'text-[12px]',
    l: 'text-[14px]'
  };

  const calculateProfit = (sale: Sale) => {
    const totalCost = sale.items.reduce((acc, item) => {
      const product = products.find(p => p.id === item.productId);
      if (!product) return acc;
      let cost = 0;
      if (product.category === 'bottle') {
        cost = product.buyPrice * item.quantity;
      } else {
        cost = (product.buyPrice / (product.capacity || 1)) * (item.volume || 0) * item.quantity;
      }
      return acc + cost;
    }, 0);
    return sale.total - totalCost;
  };

  const filteredSales = sales.filter(s => {
    const matchesSearch = s.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         s.items.some(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesEmployee = filterEmployee === 'all' || s.cashierId === filterEmployee;
    return matchesSearch && matchesEmployee;
  });

  const getEmployeeName = (id: string) => {
    return employees.find(e => e.id === id)?.name || 'Unknown';
  };

  const handleViewReceipt = (sale: Sale) => {
    setSelectedSale(sale);
    setShowReceiptModal(true);
  };

  return (
    <div className="p-8 space-y-8 text-black">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-black uppercase tracking-tight">Financial Audit Trail</h2>
          <p className="text-black font-bold text-xs uppercase tracking-widest mt-1 opacity-60">Review issued items and settled revenue.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-1 sm:w-64">
            <input 
              type="text" placeholder="Search by ID or Product..."
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-black font-black text-sm text-black"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg className="absolute left-4 top-3.5 text-black opacity-20" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          </div>
          <select 
            value={filterEmployee} onChange={(e) => setFilterEmployee(e.target.value)}
            className="px-6 py-3 bg-white border border-slate-200 rounded-2xl outline-none font-black text-[10px] uppercase tracking-widest text-black appearance-none min-w-[160px]"
          >
            <option value="all">All Waiters</option>
            {employees.map(e => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-black uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Waiter</th>
                <th className="px-6 py-4">Table</th>
                <th className="px-6 py-4">Value</th>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredSales.map(sale => (
                <tr key={sale.id} className="hover:bg-slate-50 transition group text-xs font-bold text-black">
                  <td className="px-6 py-5">
                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${sale.status === 'settled' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {sale.status}
                    </span>
                  </td>
                  <td className="px-6 py-5 font-black uppercase">{sale.id}</td>
                  <td className="px-6 py-5 opacity-70 uppercase tracking-tighter">{getEmployeeName(sale.cashierId)}</td>
                  <td className="px-6 py-5 opacity-70 uppercase tracking-tighter">{sale.tableNumber || '-'}</td>
                  <td className="px-6 py-5 font-black">Ksh {sale.total.toLocaleString()}</td>
                  <td className="px-6 py-5 opacity-50 whitespace-nowrap">
                    {new Date(sale.timestamp).toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button 
                      onClick={() => handleViewReceipt(sale)}
                      className="text-black hover:underline transition flex items-center justify-end space-x-1 uppercase text-[10px] tracking-widest font-black"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                      <span>Details</span>
                    </button>
                  </td>
                </tr>
              ))}
              {filteredSales.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-20 text-center text-black italic font-black uppercase tracking-widest opacity-20">
                    No transactions recorded
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showReceiptModal && selectedSale && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl animate-in zoom-in-95 print:shadow-none print:p-0">
            <div className="flex justify-center space-x-2 mb-6 print:hidden">
              {(['xs', 's', 'm', 'l'] as const).map(size => (
                <button
                  key={size}
                  onClick={() => setReceiptSize(size)}
                  className={`px-3 py-1 rounded-lg font-black text-[9px] uppercase border transition ${receiptSize === size ? 'bg-black text-white border-black' : 'bg-white text-black border-slate-200'}`}
                >
                  {size.toUpperCase()}
                </button>
              ))}
            </div>

            <div id="printable-customer-receipt" className={`border-2 border-dashed border-black p-6 rounded-3xl bg-white font-mono leading-tight text-black print:border-none print:p-4 ${sizeClasses[receiptSize]}`}>
              <div className="text-center mb-4">
                <h2 className="text-xl font-black uppercase tracking-tighter">GALAXY INN</h2>
                <div className="border-t border-black border-dashed my-2"></div>
                <p className="font-bold uppercase tracking-widest">Transaction Audit</p>
              </div>
              <div className="space-y-1 mb-4 font-bold">
                <p>STATUS: <span className="uppercase">{selectedSale.status}</span></p>
                <p>DATE: {new Date(selectedSale.timestamp).toLocaleDateString()}</p>
                <p>TRANS: {selectedSale.id}</p>
                <p>WAITER: {getEmployeeName(selectedSale.cashierId)}</p>
                {selectedSale.tableNumber && <p>TABLE: {selectedSale.tableNumber}</p>}
              </div>
              <div className="space-y-2 mb-4">
                {selectedSale.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start">
                    <span className="flex-1 uppercase font-bold">{item.name} x{item.quantity}</span>
                    <span className="font-black">{(item.quantity * item.price).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-black border-dashed my-2"></div>
              <div className="flex justify-between font-black text-lg"><span>TOTAL:</span><span>KES {selectedSale.total.toLocaleString()}</span></div>
              
              {selectedSale.status === 'settled' && (
                <div className="mt-2 pt-2 border-t border-black border-dotted space-y-1 text-[10px] font-bold">
                  <div className="flex justify-between"><span>METHOD:</span><span className="uppercase">{selectedSale.paymentMethod}</span></div>
                  <div className="flex justify-between"><span>SETTLED AT:</span><span>{new Date(selectedSale.settledAt!).toLocaleTimeString()}</span></div>
                </div>
              )}
              
              <div className="text-center mt-6 pt-4 border-t border-black border-dashed font-bold uppercase tracking-widest">GALAXY INN OFFICIAL</div>
            </div>
            <div className="flex space-x-3 mt-8 print:hidden">
              <button onClick={() => setShowReceiptModal(false)} className="flex-1 py-4 bg-slate-100 text-black font-black rounded-2xl text-[10px] uppercase tracking-widest">Close</button>
              <button onClick={() => window.print()} className="flex-[2] py-4 bg-black text-white font-black rounded-2xl text-[10px] uppercase tracking-widest flex items-center justify-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>
                <span>Print Copy</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default History;
