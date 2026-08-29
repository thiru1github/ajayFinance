import Decimal from 'decimal.js';
import { FinanceMode, Installment, InstallmentStatus, FinanceAccount } from '../types.ts';

// Configure Decimal for financial calculations (rounding half up)
Decimal.set({ rounding: Decimal.ROUND_HALF_UP });

export const generateSchedule = (
  principal: number,
  rate: number,
  tenure: number,
  mode: FinanceMode,
  startDate: Date
): { installments: Installment[], totalInterest: number, totalPayable: number } => {
  const p = new Decimal(principal);
  const r = new Decimal(rate).dividedBy(100);
  const t = new Decimal(tenure);

  // Flat interest calculation for simplicity in this prototype
  // Total Interest = Principal * Rate
  const totalInterest = p.times(r);
  const totalPayable = p.plus(totalInterest);
  
  const installmentAmount = totalPayable.dividedBy(t).toDecimalPlaces(2);
  const principalComponent = p.dividedBy(t).toDecimalPlaces(2);
  const interestComponent = totalInterest.dividedBy(t).toDecimalPlaces(2);

  const installments: Installment[] = [];
  let currentDate = new Date(startDate);

  // Adjust for rounding errors on the last installment
  let accumulatedPrincipal = new Decimal(0);
  let accumulatedInterest = new Decimal(0);

  for (let i = 1; i <= tenure; i++) {
    if (mode === FinanceMode.DAILY) {
      currentDate.setDate(currentDate.getDate() + 1);
    } else if (mode === FinanceMode.WEEKLY) {
      currentDate.setDate(currentDate.getDate() + 7);
    } else if (mode === FinanceMode.MONTHLY) {
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    let currentPrin = principalComponent;
    let currentInt = interestComponent;
    let currentTotal = installmentAmount;

    // Last installment adjustment
    if (i === tenure) {
      currentPrin = p.minus(accumulatedPrincipal);
      currentInt = totalInterest.minus(accumulatedInterest);
      currentTotal = currentPrin.plus(currentInt);
    } else {
      accumulatedPrincipal = accumulatedPrincipal.plus(currentPrin);
      accumulatedInterest = accumulatedInterest.plus(currentInt);
    }

    installments.push({
      id: `inst-${Date.now()}-${i}`,
      sequence: i,
      dueDate: currentDate.toISOString().split('T')[0],
      principalComponent: currentPrin.toNumber(),
      interestComponent: currentInt.toNumber(),
      totalDue: currentTotal.toNumber(),
      amountPaid: 0,
      status: InstallmentStatus.UPCOMING
    });
  }

  return {
    installments,
    totalInterest: totalInterest.toNumber(),
    totalPayable: totalPayable.toNumber()
  };
};

export const calculateEarlyClosure = (account: FinanceAccount) => {
  // Simplified early closure: Outstanding Principal + 2% Penalty on outstanding
  const outstandingPrincipal = account.installments
    .filter((i: Installment) => i.status !== InstallmentStatus.PAID)
    .reduce((sum: Decimal, i: Installment) => sum.plus(new Decimal(i.principalComponent)), new Decimal(0));
  
  const penalty = outstandingPrincipal.times(0.02).toDecimalPlaces(2);
  const settlementAmount = outstandingPrincipal.plus(penalty);

  return {
    outstandingPrincipal: outstandingPrincipal.toNumber(),
    penalty: penalty.toNumber(),
    settlementAmount: settlementAmount.toNumber()
  };
};
