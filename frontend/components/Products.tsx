import React, { useState } from 'react';
import { useStore } from '../store/StoreContext.tsx';
import { FinanceMode, Product } from '../types.ts';
import { Plus } from 'lucide-react';

export const Products: React.FC = () => {
  const { state, addProduct, updateProduct } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    mode: FinanceMode.DAILY,
    minPrincipal: 1000,
    maxPrincipal: 50000,
    interestRate: 10,
    processingFee: 500,
    active: true
  });

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      name: '',
      mode: FinanceMode.DAILY,
      minPrincipal: 1000,
      maxPrincipal: 50000,
      interestRate: 10,
      processingFee: 500,
      active: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingId(product.id);
    setFormData({
      name: product.name,
      mode: product.mode,
      minPrincipal: product.minPrincipal,
      maxPrincipal: product.maxPrincipal,
      interestRate: product.interestRate,
      processingFee: product.processingFee,
      active: product.active
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateProduct({
        id: editingId,
        ...formData
      });
    } else {
      addProduct({
        id: `PROD-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
        ...formData
      });
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Finance Products</h2>
        <button 
          onClick={handleOpenCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus size={18} />
          <span>Create Product</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {state.products.map(product => (
          <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{product.name}</h3>
                <span className="inline-block px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded mt-1">
                  {product.mode}
                </span>
              </div>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${product.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {product.active ? 'Active' : 'Inactive'}
              </span>
            </div>
            
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Principal Range:</span>
                <span className="font-medium text-gray-900">₹{product.minPrincipal} - ₹{product.maxPrincipal}</span>
              </div>
              <div className="flex justify-between">
                <span>Interest Rate:</span>
                <span className="font-medium text-gray-900">{product.interestRate}% (Flat)</span>
              </div>
              <div className="flex justify-between">
                <span>Processing Fee:</span>
                <span className="font-medium text-gray-900">₹{product.processingFee}</span>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end space-x-2">
              <button 
                onClick={() => handleOpenEdit(product)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Edit Rules
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {editingId ? 'Edit Finance Product' : 'Create New Product'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                <input 
                  required 
                  type="text" 
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Finance Mode</label>
                <select 
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.mode}
                  onChange={e => setFormData({...formData, mode: e.target.value as FinanceMode})}
                >
                  <option value={FinanceMode.DAILY}>Daily</option>
                  <option value={FinanceMode.WEEKLY}>Weekly</option>
                  <option value={FinanceMode.MONTHLY}>Monthly</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Principal (₹)</label>
                  <input 
                    required 
                    type="number" 
                    min="0"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                    value={formData.minPrincipal} 
                    onChange={e => setFormData({...formData, minPrincipal: Number(e.target.value)})} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Principal (₹)</label>
                  <input 
                    required 
                    type="number" 
                    min="0"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                    value={formData.maxPrincipal} 
                    onChange={e => setFormData({...formData, maxPrincipal: Number(e.target.value)})} 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Interest Rate (%)</label>
                  <input 
                    required 
                    type="number" 
                    step="0.01"
                    min="0"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                    value={formData.interestRate} 
                    onChange={e => setFormData({...formData, interestRate: Number(e.target.value)})} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Processing Fee (₹)</label>
                  <input 
                    required 
                    type="number" 
                    min="0"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                    value={formData.processingFee} 
                    onChange={e => setFormData({...formData, processingFee: Number(e.target.value)})} 
                  />
                </div>
              </div>

              <div className="flex items-center mt-4">
                <input 
                  type="checkbox" 
                  id="activeStatus"
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  checked={formData.active}
                  onChange={e => setFormData({...formData, active: e.target.checked})}
                />
                <label htmlFor="activeStatus" className="ml-2 block text-sm text-gray-900">
                  Product is Active
                </label>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingId ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
