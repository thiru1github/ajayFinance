import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store/StoreContext.tsx';
import { 
  Users, CreditCard, TrendingUp, AlertCircle, CheckCircle, 
  PlusCircle, FileText, IndianRupee, ArrowRight, Clock, Activity,
  MessageSquare
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { AccountStatus, FinanceMode, InstallmentStatus } from '../types.ts';

export const Dashboard: React.FC = () => {
  const { state } = useStore();
  const [sentSms, setSentSms] = useState<Set<string>>(new Set());

  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);
  const todayStr = todayDate.toISOString().split('T')[0];

  const isToday = (dateString: string) => {
    return dateString.startsWith(todayStr);
  };

  // --- Operational Metrics Calculations ---
  const activeAccounts = state.accounts.filter(a => a.status === AccountStatus.ACTIVE).length;
  
  let expectedToday = 0;
  let totalArrears = 0;
  
  state.accounts.forEach(acc => {
    if (acc.status !== AccountStatus.ACTIVE) return;
    acc.installments.forEach(inst => {
      if (inst.status === InstallmentStatus.PAID) return;
      const due = inst.totalDue - inst.amountPaid;
      if (inst.dueDate === todayStr) {
        expectedToday += due;
      } else if (inst.dueDate < todayStr) {
        totalArrears += due;
      }
    });
  });

  const collectedToday = state.payments
    .filter(p => isToday(p.date))
    .reduce((sum, p) => sum + p.amount, 0);

  const totalTargetToday = expectedToday + totalArrears;
  const collectionEfficiency = totalTargetToday > 0 
    ? Math.min(100, Math.round((collectedToday / totalTargetToday) * 100)) 
    : (collectedToday > 0 ? 100 : 0);

  // --- Chart Data Calculations ---
  const weeklyChartData = useMemo(() => {
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    return last7Days.map(dateStr => {
      const dayPayments = state.payments.filter(p => p.date.startsWith(dateStr));
      const principal = dayPayments.reduce((sum, p) => sum + (p.principalPaid || 0), 0);
      const interest = dayPayments.reduce((sum, p) => sum + (p.interestPaid || 0), 0);
      
      return {
        name: new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' }),
        Principal: Number(principal.toFixed(2)),
        Interest: Number(interest.toFixed(2)),
      };
    });
  }, [state.payments]);

  const todayChartData = useMemo(() => {
    const todaysPayments = state.payments.filter(p => isToday(p.date));
    const collectionByMode = { [FinanceMode.DAILY]: 0, [FinanceMode.WEEKLY]: 0, [FinanceMode.MONTHLY]: 0 };

    todaysPayments.forEach(p => {
      const acc = state.accounts.find(a => a.id === p.accountId);
      if (acc) {
        const prod = state.products.find(pr => pr.id === acc.productId);
        if (prod) collectionByMode[prod.mode] += p.amount;
      }
    });

    return [
      { name: 'Daily', amount: collectionByMode[FinanceMode.DAILY] },
      { name: 'Weekly', amount: collectionByMode[FinanceMode.WEEKLY] },
      { name: 'Monthly', amount: collectionByMode[FinanceMode.MONTHLY] },
    ];
  }, [state.payments, state.accounts, state.products]);

  const overdueList = useMemo(() => {
    return state.accounts.map(acc => {
      if (acc.status === AccountStatus.CLOSED) return null;

      const overdueInsts = acc.installments.filter(inst => {
        return inst.dueDate < todayStr && inst.status !== InstallmentStatus.PAID;
      });

      if (overdueInsts.length > 0) {
        const customer = state.customers.find(c => c.id === acc.customerId);
        const totalOverdueAmount = overdueInsts.reduce((sum, inst) => sum + (inst.totalDue - inst.amountPaid), 0);
        return {
          accountId: acc.id,
          customerName: customer?.name || 'Unknown',
          customerMobile: customer?.mobile || 'N/A',
          missedCount: overdueInsts.length,
          overdueAmount: totalOverdueAmount
        };
      }
      return null;
    }).filter(Boolean) as Array<{accountId: string, customerName: string, customerMobile: string, missedCount: number, overdueAmount: number}>;
  }, [state.accounts, state.customers, todayStr]);

  const pieData = [
    { name: 'Daily', value: state.accounts.filter(a => state.products.find(p => p.id === a.productId)?.mode === FinanceMode.DAILY).length },
    { name: 'Weekly', value: state.accounts.filter(a => state.products.find(p => p.id === a.productId)?.mode === FinanceMode.WEEKLY).length },
    { name: 'Monthly', value: state.accounts.filter(a => state.products.find(p => p.id === a.productId)?.mode === FinanceMode.MONTHLY).length },
  ];
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

  const recentTransactions = useMemo(() => {
    return [...state.payments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
  }, [state.payments]);

  const handleSendSms = (item: {accountId: string, customerName: string, customerMobile: string, overdueAmount: number}) => {
    const message = `This is from SVM Ajay Finance. Dear ${item.customerName}, you forgot to pay your installment for account ${item.accountId}. Please pay ₹${item.overdueAmount.toFixed(2)} immediately to avoid further penalties.`;
    
    // Simulate sending SMS
    alert(`Simulated SMS sent to ${item.customerMobile}:\n\n"${message}"`);
    
    // Mark as sent in local state
    setSentSms(prev => {
      const newSet = new Set(prev);
      newSet.add(item.accountId);
      return newSet;
    });
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Quick Actions */}
      <div className="flex flex-wrap gap-4">
        <Link to="/customers" className="bg-white border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all rounded-lg px-4 py-3 flex items-center space-x-2 text-gray-700 hover:text-blue-600">
          <PlusCircle size={18} /> <span className="font-medium">New Customer</span>
        </Link>
        <Link to="/applications" className="bg-white border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all rounded-lg px-4 py-3 flex items-center space-x-2 text-gray-700 hover:text-blue-600">
          <FileText size={18} /> <span className="font-medium">New Application</span>
        </Link>
        <Link to="/collections" className="bg-blue-600 hover:bg-blue-700 shadow-md transition-all rounded-lg px-4 py-3 flex items-center space-x-2 text-white">
          <IndianRupee size={18} /> <span className="font-medium">Record Payment</span>
        </Link>
      </div>

      {/* Operational KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center space-x-4 z-10">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-lg"><Users size={24} /></div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Active Accounts</p>
              <p className="text-2xl font-bold text-gray-900">{activeAccounts}</p>
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-5 text-blue-600"><Users size={100} /></div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center space-x-4 z-10">
            <div className="p-3 bg-orange-100 text-orange-600 rounded-lg"><Clock size={24} /></div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Expected Today</p>
              <p className="text-2xl font-bold text-gray-900">₹{expectedToday.toLocaleString()}</p>
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-5 text-orange-600"><Clock size={100} /></div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center space-x-4 z-10">
            <div className="p-3 bg-red-100 text-red-600 rounded-lg"><AlertCircle size={24} /></div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Arrears</p>
              <p className="text-2xl font-bold text-red-600">₹{totalArrears.toLocaleString()}</p>
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-5 text-red-600"><AlertCircle size={100} /></div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center space-x-4 z-10 mb-2">
            <div className="p-3 bg-green-100 text-green-600 rounded-lg"><TrendingUp size={24} /></div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Collected Today</p>
              <p className="text-2xl font-bold text-green-600">₹{collectedToday.toLocaleString()}</p>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2 z-10">
            <div className="bg-green-500 h-2 rounded-full" style={{ width: `${collectionEfficiency}%` }}></div>
          </div>
          <p className="text-xs text-gray-500 mt-1 z-10 text-right">{collectionEfficiency}% Efficiency</p>
          <div className="absolute -right-4 -bottom-4 opacity-5 text-green-600"><TrendingUp size={100} /></div>
        </div>
      </div>

      {/* Middle Row: Today's Collection & Overdue Customers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Collection Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Today's Collection by Mode</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={todayChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#888' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#888' }} />
                <Tooltip 
                  cursor={{ fill: '#f3f4f6' }} 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                />
                <Bar dataKey="amount" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Collected (₹)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Overdue Customers Highlight */}
        <div className="bg-red-50 p-6 rounded-xl shadow-sm border border-red-100 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-red-800 flex items-center">
              <AlertCircle className="mr-2" size={20} /> Action Required: Overdue Accounts
            </h3>
            <span className="bg-red-200 text-red-800 text-xs font-bold px-2 py-1 rounded-full">
              {overdueList.length} Accounts
            </span>
          </div>
          
          {overdueList.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-green-600">
              <CheckCircle size={48} className="mb-3 opacity-80" />
              <p className="font-medium text-lg">All customers are up to date!</p>
              <p className="text-sm opacity-80">No missed payments found.</p>
            </div>
          ) : (
            <div className="space-y-3 overflow-y-auto flex-1 pr-2" style={{ maxHeight: '288px' }}>
              {overdueList.map(item => (
                <div key={item.accountId} className="bg-white p-4 rounded-lg border border-red-200 shadow-sm flex justify-between items-center hover:border-red-300 transition-colors">
                  <div>
                    <p className="font-bold text-gray-800">
                      {item.customerName} <span className="text-xs text-gray-500 font-normal">({item.accountId})</span>
                    </p>
                    <p className="text-sm text-gray-600">Mobile: {item.customerMobile}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-red-600 font-bold text-lg">₹{item.overdueAmount.toFixed(2)}</p>
                      <p className="text-xs font-medium text-red-500 bg-red-100 px-2 py-1 rounded-full inline-block mt-1">
                        {item.missedCount} missed payment{item.missedCount > 1 ? 's' : ''}
                      </p>
                    </div>
                    <button 
                      onClick={() => handleSendSms(item)}
                      disabled={sentSms.has(item.accountId)}
                      className={`p-2 rounded-full transition-colors flex-shrink-0 ${
                        sentSms.has(item.accountId) 
                          ? 'bg-green-100 text-green-600 cursor-default' 
                          : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                      }`}
                      title={sentSms.has(item.accountId) ? "SMS Sent" : "Send SMS Reminder"}
                    >
                      {sentSms.has(item.accountId) ? <CheckCircle size={20} /> : <MessageSquare size={20} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row: Weekly Trend, Portfolio, Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Weekly Collection Report (Principal vs Interest)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#888' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#888' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: '#f3f4f6' }}
                />
                <Legend />
                <Bar dataKey="Principal" stackId="a" fill="#3b82f6" radius={[0, 0, 4, 4]} />
                <Bar dataKey="Interest" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          {/* Portfolio Pie Chart */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Portfolio by Mode</h3>
            <div className="h-48">
              {state.accounts.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                  No active accounts
                </div>
              )}
            </div>
            <div className="flex justify-center space-x-4 mt-2">
              {pieData.map((entry, index) => (
                <div key={entry.name} className="flex items-center text-xs text-gray-600">
                  <div className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                  {entry.name}
                </div>
              ))}
            </div>
          </div>

          {/* Recent Transactions Feed */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <Activity className="mr-2 text-blue-500" size={18} /> Recent Activity
              </h3>
              <Link to="/reports" className="text-xs text-blue-600 hover:underline flex items-center">
                View All <ArrowRight size={12} className="ml-1" />
              </Link>
            </div>
            
            {recentTransactions.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No recent transactions.</p>
            ) : (
              <div className="space-y-4">
                {recentTransactions.map(txn => {
                  const acc = state.accounts.find(a => a.id === txn.accountId);
                  const cust = acc ? state.customers.find(c => c.id === acc.customerId) : null;
                  
                  return (
                    <div key={txn.id} className="flex justify-between items-center border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{cust?.name || 'Unknown'}</p>
                        <p className="text-xs text-gray-500">{txn.accountId} • {new Date(txn.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-green-600">+₹{txn.amount.toFixed(2)}</p>
                        <p className="text-xs text-gray-400">{txn.method}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
