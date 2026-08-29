import React, { useState } from 'react';
import { useStore } from '../store/StoreContext.tsx';
import { Plus, Search, Eye, X, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Customer, InstallmentStatus } from '../types.ts';

export const Customers: React.FC = () => {
  const { state, addCustomer } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    name: '', mobile: '', address: '', kycNumber: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addCustomer({
      id: `CUST-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      ...formData,
      createdAt: new Date().toISOString()
    });
    setIsModalOpen(false);
    setFormData({ name: '', mobile: '', address: '', kycNumber: '' });
  };

  const filteredCustomers = state.customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.mobile.includes(searchTerm)
  );

  const getCustomerAccounts = (customerId: string) => {
    return state.accounts.filter(a => a.customerId === customerId);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="relative w-64">
          <input
            type="text"
            placeholder="Search customers..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus size={18} />
          <span>Add Customer</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-100">
              <th className="p-4 font-medium">Customer ID</th>
              <th className="p-4 font-medium">Name</th>
              <th className="p-4 font-medium">Mobile</th>
              <th className="p-4 font-medium">Address</th>
              <th className="p-4 font-medium">KYC Number</th>
              <th className="p-4 font-medium text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm text-gray-800">
            {filteredCustomers.map((customer) => (
              <tr key={customer.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="p-4 font-medium text-blue-600">{customer.id}</td>
                <td className="p-4">{customer.name}</td>
                <td className="p-4">{customer.mobile}</td>
                <td className="p-4">{customer.address}</td>
                <td className="p-4">{customer.kycNumber}</td>
                <td className="p-4 text-center">
                  <button 
                    onClick={() => setSelectedCustomer(customer)}
                    className="text-blue-600 hover:text-blue-800 p-1 rounded-md hover:bg-blue-50 transition-colors inline-flex items-center space-x-1"
                  >
                    <Eye size={16} /> <span>View</span>
                  </button>
                </td>
              </tr>
            ))}
            {filteredCustomers.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">No customers found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Add New Customer</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input required type="text" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                <input required type="tel" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea required className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" rows={2} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})}></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">KYC Document Number (Aadhar/PAN)</label>
                <input required type="text" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={formData.kycNumber} onChange={e => setFormData({...formData, kycNumber: e.target.value})} />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Save Customer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Details Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">{selectedCustomer.name}</h2>
                <p className="text-sm text-gray-500">ID: {selectedCustomer.id} | Mobile: {selectedCustomer.mobile}</p>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Finance Accounts & Activity</h3>
              
              {getCustomerAccounts(selectedCustomer.id).length === 0 ? (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                  No finance accounts found for this customer.
                </div>
              ) : (
                <div className="space-y-6">
                  {getCustomerAccounts(selectedCustomer.id).map(account => {
                    const product = state.products.find(p => p.id === account.productId);
                    
                    // Calculate repayment behavior
                    let onTime = 0;
                    let late = 0;
                    let missed = 0;
                    
                    account.installments.forEach(inst => {
                      if (inst.status === InstallmentStatus.PAID && inst.paidDate) {
                        const due = new Date(inst.dueDate);
                        const paid = new Date(inst.paidDate);
                        // Reset time to compare just dates
                        due.setHours(0,0,0,0);
                        paid.setHours(0,0,0,0);
                        
                        if (paid <= due) onTime++;
                        else late++;
                      } else if (inst.status !== InstallmentStatus.PAID) {
                        const due = new Date(inst.dueDate);
                        const today = new Date();
                        due.setHours(0,0,0,0);
                        today.setHours(0,0,0,0);
                        
                        if (today > due) missed++;
                      }
                    });

                    return (
                      <div key={account.id} className="border border-gray-200 rounded-xl overflow-hidden">
                        <div className="bg-gray-50 p-4 border-b border-gray-200 flex justify-between items-center">
                          <div>
                            <h4 className="font-bold text-gray-800">{account.id} - {product?.name}</h4>
                            <p className="text-sm text-gray-500">Principal: ₹{account.principal} | Status: <span className="font-medium">{account.status}</span></p>
                          </div>
                          <div className="flex space-x-4 text-sm">
                            <div className="flex items-center text-green-600"><CheckCircle size={16} className="mr-1"/> {onTime} On Time</div>
                            <div className="flex items-center text-orange-500"><Clock size={16} className="mr-1"/> {late} Late</div>
                            <div className="flex items-center text-red-600"><XCircle size={16} className="mr-1"/> {missed} Missed</div>
                          </div>
                        </div>
                        
                        <div className="p-0 overflow-x-auto">
                          <table className="w-full text-left text-sm">
                            <thead className="bg-white border-b border-gray-100">
                              <tr>
                                <th className="p-3 font-medium text-gray-500">Seq</th>
                                <th className="p-3 font-medium text-gray-500">Due Date</th>
                                <th className="p-3 font-medium text-gray-500">Amount Due</th>
                                <th className="p-3 font-medium text-gray-500">Paid</th>
                                <th className="p-3 font-medium text-gray-500">Status</th>
                                <th className="p-3 font-medium text-gray-500">Paid On</th>
                              </tr>
                            </thead>
                            <tbody>
                              {account.installments.map(inst => {
                                let statusColor = 'text-gray-600';
                                if (inst.status === InstallmentStatus.PAID) statusColor = 'text-green-600 font-medium';
                                else if (inst.status === InstallmentStatus.PARTIALLY_PAID) statusColor = 'text-orange-500 font-medium';
                                else if (new Date(inst.dueDate) < new Date()) statusColor = 'text-red-600 font-medium';

                                return (
                                  <tr key={inst.id} className="border-b border-gray-50 hover:bg-gray-50">
                                    <td className="p-3">{inst.sequence}</td>
                                    <td className="p-3">{inst.dueDate}</td>
                                    <td className="p-3">₹{inst.totalDue}</td>
                                    <td className="p-3">₹{inst.amountPaid}</td>
                                    <td className={`p-3 ${statusColor}`}>{inst.status}</td>
                                    <td className="p-3 text-gray-500">
                                      {inst.paidDate ? new Date(inst.paidDate).toLocaleDateString() : '-'}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
