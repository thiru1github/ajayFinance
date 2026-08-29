export enum FinanceMode {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY'
}

export enum AccountStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  ACTIVE = 'ACTIVE',
  OVERDUE = 'OVERDUE',
  CLOSED = 'CLOSED'
}

export enum InstallmentStatus {
  UPCOMING = 'UPCOMING',
  DUE = 'DUE',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE'
}

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  address: string;
  kycNumber: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  mode: FinanceMode;
  minPrincipal: number;
  maxPrincipal: number;
  interestRate: number; // Percentage
  processingFee: number;
  active: boolean;
}

export interface Installment {
  id: string;
  sequence: number;
  dueDate: string;
  principalComponent: number;
  interestComponent: number;
  totalDue: number;
  amountPaid: number;
  status: InstallmentStatus;
  paidDate?: string;
}

export interface FinanceAccount {
  id: string;
  customerId: string;
  productId: string;
  principal: number;
  tenure: number;
  totalInterest: number;
  totalPayable: number;
  disbursedDate: string;
  status: AccountStatus;
  installments: Installment[];
}

export interface Payment {
  id: string;
  accountId: string;
  amount: number;
  date: string;
  method: string;
  receiptNumber: string;
  principalPaid?: number;
  interestPaid?: number;
}

export interface AppState {
  customers: Customer[];
  products: Product[];
  accounts: FinanceAccount[];
  payments: Payment[];
}
