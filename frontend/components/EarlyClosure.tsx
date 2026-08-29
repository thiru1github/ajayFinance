import React, { useState } from 'react';
import { useStore } from '../store/StoreContext.tsx';
import { calculateEarlyClosure } from '../utils/finance.ts';
import { AccountStatus } from '../types.ts';

export const EarlyClosure: React.FC = () => {
  const { state, closeAccount } = useStore();
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [quotation, setQuotation] = useState<{ outstandingPrincipal: number, penalty: number, settlementAmount: number } | null>(null);

  const activeAccounts = state.accounts.filter(a => a.status === AccountStatus.ACTIVE);

  const handleCalculate = () => {
    const account = state.accounts.find(a => a.id === selectedAccountId);
    if (account) {
      setQuotation(calculateEarlyClosure(account));
    }
  };

  const handleApproveClosure = () => {
    if (window.confirm('Are you sure you want to approve this early closure? This action cannot be undone.')) {
      closeAccount(selectedAccountId);
      alert('Account closed successfully via Early Settlement.');
      setSelectedAccountId('');
      setQuotation(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Early Closure Request</h2>
        
        <div className="flex space-x-4 mb-6">
          <select 
            className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            value={selectedAccountId}
            onChange={e => { setSelectedAccountId(e.target.value); setQuotation(null); }}
          >
            <option value="">-- Select Active Account --</option>
            {activeAccounts.map(a => (
              <option key={a.id} value={a.id}>{a.id}</option>
            ))}
          </select>
          <button 
            onClick={handleCalculate}
            disabled={!selectedAccountId}
            className="bg-slate-800 text-white px-6 py-2 rounded-lg hover:bg-slate-900 transition-colors disabled:opacity-50"
          >
            Calculate Quotation
          </button>
        </div>

        {quotation && (
          <div className="border border-blue-100 rounded-lg overflow-hidden">
            <div className="bg-blue-50 p-4 border-b border-blue-100">
              <h3 className="font-bold text-blue-800">Settlement Quotation</h3>
              <p className="text-sm text-blue-600">Valid for today only.</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <span className="text-gray-600">Outstanding Principal</span>
                <span className="font-medium">₹{quotation.outstandingPrincipal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <span className="text-gray-600">Early Closure Penalty (2%)</span>
                <span className="font-medium text-red-500">+ ₹{quotation.penalty.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-lg font-bold text-gray-800">Final Settlement Amount</span>
                <span className="text-2xl font-bold text-green-600">₹{quotation.settlementAmount.toFixed(2)}</span>
              </div>
              
              <div className="pt-6 flex justify-end space-x-4">
                <button className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Print Quotation</button>
                <button 
                  onClick={handleApproveClosure}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-sm"
                >
                  Approve & Close Account
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
