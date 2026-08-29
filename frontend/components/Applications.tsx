import React, { useState } from 'react';
import { useStore } from '../store/StoreContext.tsx';
import { generateSchedule } from '../utils/finance.ts';
import { AccountStatus, Installment } from '../types.ts';

export const Applications: React.FC = () => {
  const { state, addAccount } = useStore();
  const [formData, setFormData] = useState({
    customerId: '',
    productId: '',
    principal: 10000,
    tenure: 10,
    startDate: new Date().toISOString().split('T')[0]
  });
  const [preview, setPreview] = useState<{ installments: Installment[], totalInterest: number, totalPayable: number } | null>(null);

  const handlePreview = () => {
    const product = state.products.find(p => p.id === formData.productId);
    if (!product) return;
    
    const schedule = generateSchedule(
      formData.principal,
      product.interestRate,
      formData.tenure,
      product.mode,
      new Date(formData.startDate)
    );
    setPreview(schedule);
  };

  const handleSubmit = () => {
    if (!preview) return;
    const product = state.products.find(p => p.id === formData.productId);
    
    addAccount({
      id: `ACC-${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`,
      customerId: formData.customerId,
      productId: formData.productId,
      principal: formData.principal,
      tenure: formData.tenure,
      totalInterest: preview.totalInterest,
      totalPayable: preview.totalPayable,
      disbursedDate: new Date(formData.startDate).toISOString(),
      status: AccountStatus.ACTIVE,
      installments: preview.installments
    });
    
    alert('Application Approved & Disbursed Successfully!');
    setFormData({ customerId: '', productId: '', principal: 10000, tenure: 10, startDate: new Date().toISOString().split('T')[0] });
    setPreview(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6">New Finance Application</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Customer</label>
            <select 
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.customerId}
              onChange={e => setFormData({...formData, customerId: e.target.value})}
            >
              <option value="">-- Select Customer --</option>
              {state.customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.id})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Product</label>
            <select 
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.productId}
              onChange={e => setFormData({...formData, productId: e.target.value})}
            >
              <option value="">-- Select Product --</option>
              {state.products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.mode})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Principal (₹)</label>
              <input 
                type="number" 
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.principal}
                onChange={e => setFormData({...formData, principal: Number(e.target.value)})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tenure</label>
              <input 
                type="number" 
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.tenure}
                onChange={e => setFormData({...formData, tenure: Number(e.target.value)})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input 
                type="date" 
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.startDate}
                onChange={e => setFormData({...formData, startDate: e.target.value})}
              />
            </div>
          </div>
          <button 
            onClick={handlePreview}
            disabled={!formData.customerId || !formData.productId}
            className="w-full bg-slate-800 text-white py-2 rounded-lg hover:bg-slate-900 transition-colors disabled:opacity-50 mt-4"
          >
            Generate Schedule Preview
          </button>
        </div>
      </div>

      {preview && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col h-[600px]">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Schedule Preview</h2>
          <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-blue-50 rounded-lg text-sm">
            <div><span className="text-gray-500">Total Interest:</span> <span className="font-bold">₹{preview.totalInterest}</span></div>
            <div><span className="text-gray-500">Total Payable:</span> <span className="font-bold">₹{preview.totalPayable}</span></div>
          </div>
          
          <div className="flex-1 overflow-auto border border-gray-200 rounded-lg">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="p-3 font-medium text-gray-600">No.</th>
                  <th className="p-3 font-medium text-gray-600">Due Date</th>
                  <th className="p-3 font-medium text-gray-600">Principal</th>
                  <th className="p-3 font-medium text-gray-600">Interest</th>
                  <th className="p-3 font-medium text-gray-600">Total Due</th>
                </tr>
              </thead>
              <tbody>
                {preview.installments.map((inst: Installment) => (
                  <tr key={inst.id} className="border-t border-gray-100">
                    <td className="p-3">{inst.sequence}</td>
                    <td className="p-3">{inst.dueDate}</td>
                    <td className="p-3">₹{inst.principalComponent}</td>
                    <td className="p-3">₹{inst.interestComponent}</td>
                    <td className="p-3 font-medium">₹{inst.totalDue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <button 
            onClick={handleSubmit}
            className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors mt-4 font-bold shadow-md"
          >
            Approve & Disburse
          </button>
        </div>
      )}
    </div>
  );
};
