import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AppState, Customer, Product, FinanceAccount, Payment, FinanceMode, AccountStatus, InstallmentStatus } from '../types.ts';

interface StoreContextType {
  state: AppState;
  addCustomer: (c: Customer) => void;
  addProduct: (p: Product) => void;
  updateProduct: (p: Product) => void;
  addAccount: (a: FinanceAccount) => void;
  recordPayment: (p: Payment) => void;
  closeAccount: (accountId: string) => void;
}

const initialState: AppState = {
  customers: [
    { id: 'CUST-001', name: 'Rahul Sharma', mobile: '9876543210', address: 'Mumbai, MH', kycNumber: 'XXXX-XXXX-1234', createdAt: new Date().toISOString() },
    { id: 'CUST-002', name: 'Priya Singh', mobile: '9123456780', address: 'Pune, MH', kycNumber: 'XXXX-XXXX-5678', createdAt: new Date().toISOString() }
  ],
  products: [
    { id: 'PROD-001', name: 'Daily Micro Finance', mode: FinanceMode.DAILY, minPrincipal: 1000, maxPrincipal: 50000, interestRate: 10, processingFee: 500, active: true },
    { id: 'PROD-002', name: 'Weekly SME Loan', mode: FinanceMode.WEEKLY, minPrincipal: 10000, maxPrincipal: 200000, interestRate: 12, processingFee: 1000, active: true }
  ],
  accounts: [],
  payments: []
};

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(initialState);

  const addCustomer = (c: Customer) => setState(s => ({ ...s, customers: [...s.customers, c] }));
  const addProduct = (p: Product) => setState(s => ({ ...s, products: [...s.products, p] }));
  const updateProduct = (p: Product) => setState(s => ({ ...s, products: s.products.map(prod => prod.id === p.id ? p : prod) }));
  const addAccount = (a: FinanceAccount) => setState(s => ({ ...s, accounts: [...s.accounts, a] }));
  
  const recordPayment = (payment: Payment) => {
    setState(s => {
      let totalPrincipalPaid = 0;
      let totalInterestPaid = 0;
      
      // Update account installments
      const newAccounts = s.accounts.map(acc => {
        if (acc.id !== payment.accountId) return acc;
        
        let remainingPayment = payment.amount;
        const updatedInstallments = acc.installments.map(inst => {
          if (remainingPayment <= 0 || inst.status === InstallmentStatus.PAID) return inst;
          
          const due = inst.totalDue - inst.amountPaid;
          const paymentForThisInst = Math.min(remainingPayment, due);
          
          // Allocate to interest first, then principal
          const unpaidInterest = Math.max(0, inst.interestComponent - (inst.amountPaid > inst.interestComponent ? inst.interestComponent : inst.amountPaid));
          const interestAllocated = Math.min(paymentForThisInst, unpaidInterest);
          const principalAllocated = paymentForThisInst - interestAllocated;
          
          totalInterestPaid += interestAllocated;
          totalPrincipalPaid += principalAllocated;
          
          remainingPayment -= paymentForThisInst;
          const newAmountPaid = inst.amountPaid + paymentForThisInst;
          
          return { 
            ...inst, 
            amountPaid: newAmountPaid, 
            status: newAmountPaid >= inst.totalDue ? InstallmentStatus.PAID : InstallmentStatus.PARTIALLY_PAID,
            paidDate: payment.date
          };
        });

        const allPaid = updatedInstallments.every(i => i.status === InstallmentStatus.PAID);
        
        return {
          ...acc,
          installments: updatedInstallments,
          status: allPaid ? AccountStatus.CLOSED : acc.status
        };
      });

      const enrichedPayment = {
        ...payment,
        principalPaid: totalPrincipalPaid,
        interestPaid: totalInterestPaid
      };

      return { ...s, payments: [...s.payments, enrichedPayment], accounts: newAccounts };
    });
  };

  const closeAccount = (accountId: string) => {
    setState(s => ({
      ...s,
      accounts: s.accounts.map(a => a.id === accountId ? { ...a, status: AccountStatus.CLOSED } : a)
    }));
  };

  return (
    <StoreContext.Provider value={{ state, addCustomer, addProduct, updateProduct, addAccount, recordPayment, closeAccount }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within StoreProvider');
  return context;
};
