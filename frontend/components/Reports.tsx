import React from 'react';
import { useStore } from '../store/StoreContext.tsx';

export const Reports: React.FC = () => {
  const { state } = useStore();

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">Financial Reports</h2>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h3 className="font-semibold text-gray-700">Recent Transactions</h3>
          <button className="text-sm text-blue-600 hover:underline">Export CSV</button>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-gray-500 text-sm border-b border-gray-100">
              <th className="p-4 font-medium">Txn ID</th>
              <th className="p-4 font-medium">Date</th>
              <th className="p-4 font-medium">Account</th>
              <th className="p-4 font-medium">Method</th>
              <th className="p-4 font-medium text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="text-sm text-gray-800">
            {state.payments.slice().reverse().map((payment) => (
              <tr key={payment.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="p-4 font-medium text-blue-600">{payment.id}</td>
                <td className="p-4">{new Date(payment.date).toLocaleString()}</td>
                <td className="p-4">{payment.accountId}</td>
                <td className="p-4"><span className="px-2 py-1 bg-gray-100 rounded text-xs">{payment.method}</span></td>
                <td className="p-4 text-right font-bold text-green-600">₹{payment.amount.toFixed(2)}</td>
              </tr>
            ))}
            {state.payments.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">No transactions found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
