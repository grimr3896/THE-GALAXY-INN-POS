
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

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Sales History</h2>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">Browse and filter all past transactions.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-1 sm:w-64">
            <input 
              type="text" 
              placeholder="Search by Order ID or Item..."
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg className="absolute left-4 top-3.5 text-slate-300" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          </div>
          <select 
            value={filterEmployee}
            onChange={(e) => setFilterEmployee(e.target.value)}
            className="px-6 py-3 bg-white border border-slate-200 rounded-2xl outline-none font-black text-[10px] uppercase tracking-widest text-slate-600 appearance-none min-w-[160px]"
          >
            <option value="all">All Employees</option>
            {employees.map(e => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">Order ID</th>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Items</th>
                <th className="px-6 py-4">Tax</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4">Profit</th>
                <th className="px-6 py-4">Payment</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredSales.map(sale => (
                <tr key={sale.id} className="hover:bg-slate-50 transition group text-xs font-bold">
                  <td className="px-6 py-5 text-slate-900 font-black">{sale.id}</td>
                  <td className="px-6 py-5 text-slate-600 uppercase tracking-tighter">{getEmployeeName(sale.cashierId)}</td>
                  <td className="px-6 py-5">
                    <div className="max-w-[180px] truncate text-slate-500 uppercase">
                      {sale.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-slate-400">Ksh {(sale.vatAmount || 0).toLocaleString()}</td>
                  <td className="px-6 py-5 text-slate-900 font-black">Ksh {sale.total.toLocaleString()}</td>
                  <td className="px-6 py-5 text-emerald-600">Ksh {calculateProfit(sale).toLocaleString()}</td>
                  <td className="px-6 py-5">
                    <span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-500 uppercase text-[9px]">{sale.paymentMethod}</span>
                  </td>
                  <td className="px-6 py-5 text-slate-400 whitespace-nowrap">
                    {new Date(sale.timestamp).toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-6 py-5">
                    <span className="flex items-center space-x-1.5 text-emerald-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <span className="uppercase text-[10px]">Paid</span>
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button 
                      onClick={() => handleViewReceipt(sale)}
                      className="text-indigo-600 hover:text-indigo-900 transition flex items-center justify-end space-x-1 uppercase text-[10px] tracking-widest font-black"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                      <span>View</span>
                    </button>
                  </td>
                </tr>
              ))}
              {filteredSales.length === 0 && (
                <tr>
                  <td colSpan={10} className="p-20 text-center text-slate-300 italic font-black uppercase tracking-widest">
                    No transactions matching your criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showReceiptModal && selectedSale && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl animate-in zoom-in-95 print:shadow-none print:p-0 print:m-0 print:w-full">
            <div className="flex justify-between items-center mb-6 print:hidden">
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Sale Audit</h3>
              <button onClick={() => setShowReceiptModal(false)} className="text-slate-400 hover:text-slate-600 transition">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>

            <div id="printable-history-receipt" className="border-2 border-dashed border-black p-6 rounded-3xl bg-white font-mono text-[10px] leading-tight text-black print:border-none print:p-4">
              <div className="text-center mb-4">
                <h2 className="text-xl font-black uppercase tracking-tighter">GALAXY INN</h2>
                <p className="font-bold text-[8px] uppercase">Nairobi, Kenya</p>
                <div className="border-t border-black border-dashed my-2"></div>
                <p className="font-bold uppercase tracking-widest">Duplicate Receipt</p>
              </div>

              <div className="space-y-1 mb-4">
                <p>DATE: {new Date(selectedSale.timestamp).toLocaleDateString('en-GB')}</p>
                <p>TIME: {new Date(selectedSale.timestamp).toLocaleTimeString()}</p>
                <p>TRANS ID: {selectedSale.id}</p>
                <p>CASHIER: {getEmployeeName(selectedSale.cashierId)}</p>
              </div>

              <div className="border-t border-black border-dashed my-2"></div>

              <div className="space-y-2 mb-4">
                {selectedSale.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start">
                    <div className="flex-1 pr-2">
                      <p className="uppercase font-bold">{item.name}</p>
                      <p className="text-[8px]">{item.quantity} x {item.price.toLocaleString()}</p>
                    </div>
                    <p className="font-black">{(item.quantity * item.price).toLocaleString()}</p>
                  </div>
                ))}
              </div>

              <div className="border-t border-black border-dashed my-2"></div>

              <div className="space-y-1 mb-4">
                <div className="flex justify-between font-bold">
                  <span>SUBTOTAL:</span>
                  <span>KES {(selectedSale.total - (selectedSale.vatAmount || 0)).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>VAT (16%):</span>
                  <span>KES {(selectedSale.vatAmount || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-black text-lg border-t border-black pt-1">
                  <span>TOTAL:</span>
                  <span>KES {selectedSale.total.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex justify-between uppercase mb-4">
                <span>Payment Method:</span>
                <span className="font-bold">{selectedSale.paymentMethod}</span>
              </div>

              <div className="text-center mt-6 pt-4 border-t border-black border-dashed space-y-1">
                <p className="font-bold uppercase tracking-widest">PLEASE VISIT AGAIN</p>
                <p className="text-[7px] mt-2 text-center uppercase">GALAXY INN POS v1.0 • OFFLINE SECURE</p>
              </div>
            </div>

            <div className="flex space-x-3 mt-8 print:hidden">
              <button onClick={() => setShowReceiptModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-slate-200 transition">Close</button>
              <button onClick={handlePrint} className="flex-2 py-4 bg-slate-900 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-xl hover:bg-black transition flex items-center justify-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>
                <span>Print Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printing Styles for Duplicate Receipt */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-history-receipt, #printable-history-receipt * {
            visibility: visible;
          }
          #printable-history-receipt {
            position: fixed;
            left: 0;
            top: 0;
            width: 58mm;
            padding: 0;
            margin: 0;
            border: none;
            box-shadow: none;
            color: black !important;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default History;
