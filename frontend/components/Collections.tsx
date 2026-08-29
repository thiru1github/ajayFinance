import React, { useState, useMemo } from 'react';
import { useStore } from '../store/StoreContext.tsx';
import { AccountStatus, InstallmentStatus } from '../types.ts';
import { Search, AlertCircle, Clock, CheckCircle, ChevronRight } from 'lucide-react';

export const Collections: React.FC = () => {
  const { state, recordPayment } = useStore();
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [receipt, setReceipt] = useState<{ receiptNumber: string, accountId: string, date: string, amount: number } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  // Derived state for the pending collections list
  const pendingCollections = useMemo(() => {
    return state.accounts.flatMap(acc => {
      if (acc.status !== AccountStatus.ACTIVE) return [];
      
      // Find installments due today or earlier that are not fully paid
      const pendingInsts = acc.installments.filter(i => i.dueDate <= todayStr && i.status !== InstallmentStatus.PAID);
      if (pendingInsts.length === 0) return [];

      const customer = state.customers.find(c => c.id === acc.customerId);
      const amountDue = pendingInsts.reduce((sum, i) => sum + (i.totalDue - i.amountPaid), 0);
      const earliestDue = pendingInsts.reduce((earliest, i) => i.dueDate < earliest ? i.dueDate : earliest, pendingInsts[0].dueDate);

      return [{
        accountId: acc.id,
        customerName: customer?.name || 'Unknown',
        mobile: customer?.mobile || '',
        amountDue,
        dueDate: earliestDue,
        isOverdue: earliestDue < todayStr,
        missedCount: pendingInsts.length
      }];
    })
    .filter(item => 
      item.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.accountId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.mobile.includes(searchTerm)
    )
    .sort((a, b) => {
      // Sort overdue first, then by date
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;
      return a.dueDate.localeCompare(b.dueDate);
    });
  }, [state.accounts, state.customers, todayStr, searchTerm]);

  const activeAccounts = state.accounts.filter(a => a.status === AccountStatus.ACTIVE);
  const selectedAccount = state.accounts.find(a => a.id === selectedAccountId);
  const customer = selectedAccount ? state.customers.find(c => c.id === selectedAccount.customerId) : null;

  const totalDue = selectedAccount?.installments
    .filter(i => i.status !== InstallmentStatus.PAID)
    .reduce((sum, i) => sum + (i.totalDue - i.amountPaid), 0) || 0;

  const handleSelectPending = (accountId: string, amountDue: number) => {
    setSelectedAccountId(accountId);
    setAmount(amountDue);
    setReceipt(null);
    setPaymentDate(todayStr);
  };

  const handleCollect = () => {
    if (!selectedAccount || !amount || amount <= 0) return;

    // Use the selected payment date, but keep the current time for uniqueness/sorting if it's today
    const isToday = paymentDate === todayStr;
    const finalDate = isToday ? new Date().toISOString() : new Date(`${paymentDate}T12:00:00Z`).toISOString();

    const payment = {
      id: `TXN-${Date.now()}`,
      accountId: selectedAccount.id,
      amount: Number(amount),
      date: finalDate,
      method: 'CASH',
      receiptNumber: `RCPT-${Math.floor(Math.random() * 1000000)}`
    };

    recordPayment(payment);
    setReceipt(payment);
    setAmount('');
    setSelectedAccountId('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-8rem)]">
      
      {/* Left Column: Pending Collections List */}
      <div className="lg:col-span-7 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Today's Collections</h2>
            <p className="text-sm text-gray-500">{pendingCollections.length} accounts pending</p>
          </div>
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search name or ID..."
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
          {pendingCollections.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <CheckCircle size={48} className="mb-4 text-green-400 opacity-50" />
              <p className="text-lg font-medium text-gray-600">All caught up!</p>
              <p className="text-sm">No pending collections for today.</p>
            </div>
          ) : (
            pendingCollections.map(item => (
              <div 
                key={item.accountId} 
                onClick={() => handleSelectPending(item.accountId, item.amountDue)}
                className={`p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md flex items-center justify-between ${
                  selectedAccountId === item.accountId 
                    ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' 
                    : item.isOverdue 
                      ? 'border-red-200 bg-white hover:border-red-300' 
                      : 'border-gray-200 bg-white hover:border-blue-200'
                }`}
              >
                <div className="flex items-start space-x-4">
                  <div className={`p-2 rounded-lg mt-1 ${item.isOverdue ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                    {item.isOverdue ? <AlertCircle size={20} /> : <Clock size={20} />}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">{item.customerName}</h3>
                    <p className="text-xs text-gray-500 mb-1">{item.accountId} • {item.mobile}</p>
                    {item.isOverdue ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                        Overdue ({item.missedCount} missed)
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                        Due Today
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right flex items-center space-x-4">
                  <div>
                    <p className="text-sm text-gray-500">Amount Due</p>
                    <p className={`text-lg font-bold ${item.isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                      ₹{item.amountDue.toFixed(2)}
                    </p>
                  </div>
                  <ChevronRight className={`transition-transform ${selectedAccountId === item.accountId ? 'text-blue-600 translate-x-1' : 'text-gray-300'}`} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Column: Payment Form & Receipt */}
      <div className="lg:col-span-5 flex flex-col gap-6">
        
        {receipt ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 flex flex-col items-center justify-center text-center flex-1">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
              <CheckCircle size={32} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Successful</h2>
            <p className="text-gray-500 mb-6">Receipt generated successfully.</p>
            
            <div className="w-full bg-gray-50 p-6 rounded-lg border border-gray-200 text-left space-y-3 mb-6">
              <div className="flex justify-between border-b border-gray-200 pb-2">
                <span className="text-gray-500 text-sm">Receipt No:</span>
                <span className="font-medium">{receipt.receiptNumber}</span>
              </div>
              <div className="flex justify-between border-b border-gray-200 pb-2">
                <span className="text-gray-500 text-sm">Account:</span>
                <span className="font-medium">{receipt.accountId}</span>
              </div>
              <div className="flex justify-between border-b border-gray-200 pb-2">
                <span className="text-gray-500 text-sm">Date:</span>
                <span className="font-medium">{new Date(receipt.date).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-gray-800 font-bold">Amount Paid:</span>
                <span className="font-bold text-green-600 text-lg">₹{receipt.amount.toFixed(2)}</span>
              </div>
            </div>
            
            <div className="flex space-x-3 w-full">
              <button className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors">
                Print Receipt
              </button>
              <button 
                onClick={() => setReceipt(null)}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
              >
                New Payment
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex-1 flex flex-col">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Record Payment</h2>
            
            <div className="space-y-5 flex-1">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Account</label>
                <select 
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
                  value={selectedAccountId}
                  onChange={e => { 
                    setSelectedAccountId(e.target.value); 
                    setAmount(''); 
                  }}
                >
                  <option value="">-- Manual Selection --</option>
                  {activeAccounts.map(a => {
                    const cust = state.customers.find(c => c.id === a.customerId);
                    return <option key={a.id} value={a.id}>{a.id} - {cust?.name}</option>;
                  })}
                </select>
              </div>

              {selectedAccount && customer ? (
                <>
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-gray-600">Customer:</span> <span className="font-bold text-gray-900">{customer.name}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Total Loan:</span> <span className="font-medium">₹{selectedAccount.totalPayable}</span></div>
                    <div className="flex justify-between pt-2 border-t border-blue-200">
                      <span className="text-gray-800 font-medium">Total Outstanding:</span> 
                      <span className="font-bold text-red-600 text-base">₹{totalDue.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
                      <input 
                        type="date" 
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        value={paymentDate}
                        onChange={e => setPaymentDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
                      <input 
                        type="number" 
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-lg font-bold text-green-700"
                        value={amount}
                        onChange={e => setAmount(Number(e.target.value))}
                        max={totalDue}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-lg p-6">
                  <Search size={32} className="mb-2 opacity-50" />
                  <p className="text-center text-sm">Select an account from the list on the left or the dropdown above to record a payment.</p>
                </div>
              )}
            </div>

            <div className="pt-6 mt-auto">
              <button 
                onClick={handleCollect}
                disabled={!selectedAccount || !amount || amount <= 0}
                className="w-full bg-blue-600 text-white py-3.5 rounded-lg hover:bg-blue-700 transition-colors font-bold shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center space-x-2"
              >
                <CheckCircle size={20} />
                <span>Confirm Payment</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
