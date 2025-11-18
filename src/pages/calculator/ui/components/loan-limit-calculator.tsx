/* eslint-disable jsx-a11y/label-has-associated-control */
import { useState, useMemo } from 'react';
import { Card } from '@src/shared/ui/card';
import { formatCurrency } from '@src/shared/utils/number';
import { Disclaimer } from './disclaimer';

export const LoanLimitCalculator = () => {
  const [income, setIncome] = useState<number>(50000000);
  const [existingLoan, setExistingLoan] = useState<number>(0);
  const [dsrLimit, setDsrLimit] = useState<number>(40);
  const [interestRate, setInterestRate] = useState<number>(4.0);
  const [loanPeriod, setLoanPeriod] = useState<number>(240);

  const result = useMemo(() => {
    if (!income || !dsrLimit || !interestRate || !loanPeriod) {
      return null;
    }

    const monthlyRate = interestRate / 100 / 12;
    const maxAnnualPayment = (income * dsrLimit) / 100;

    // 기존 대출 연간 상환액 계산
    let existingAnnualPayment = 0;
    if (existingLoan > 0) {
      const existingMonthlyPayment = (existingLoan * monthlyRate * (1 + monthlyRate) ** loanPeriod)
        / ((1 + monthlyRate) ** loanPeriod - 1);
      existingAnnualPayment = existingMonthlyPayment * 12;
    }

    // 신규 대출 가능 연간 상환액
    const availableAnnualPayment = maxAnnualPayment - existingAnnualPayment;

    if (availableAnnualPayment <= 0) {
      return {
        maxLoanAmount: 0,
        availableAnnualPayment: 0,
        existingAnnualPayment,
      };
    }

    // 신규 대출 가능 금액 역산
    // availableAnnualPayment = (loanAmount * monthlyRate * (1 + monthlyRate)^period)
    //   / ((1 + monthlyRate)^period - 1) * 12
    // 이를 loanAmount에 대해 역산
    const monthlyPayment = availableAnnualPayment / 12;
    const maxLoanAmount = (monthlyPayment * ((1 + monthlyRate) ** loanPeriod - 1))
      / (monthlyRate * (1 + monthlyRate) ** loanPeriod);

    return {
      maxLoanAmount,
      availableAnnualPayment,
      existingAnnualPayment,
      maxAnnualPayment,
    };
  }, [income, existingLoan, dsrLimit, interestRate, loanPeriod]);

  return (
    <div className="space-y-6">
      <Disclaimer />
      <Card>
        <h3 className="mb-6 text-xl font-semibold">대출 한도 계산</h3>
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              연소득 (원)
            </label>
            <input
              type="number"
              value={income}
              onChange={(e) => setIncome(Number(e.target.value))}
              className="w-full rounded-lg bg-gray-800/50 px-4 py-2 text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="50000000"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              기존 대출금액 (원)
            </label>
            <input
              type="number"
              value={existingLoan}
              onChange={(e) => setExistingLoan(Number(e.target.value))}
              className="w-full rounded-lg bg-gray-800/50 px-4 py-2 text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="0"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              DSR 기준 (%)
            </label>
            <input
              type="number"
              step="0.1"
              value={dsrLimit}
              onChange={(e) => setDsrLimit(Number(e.target.value))}
              className="w-full rounded-lg bg-gray-800/50 px-4 py-2 text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="40"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              대출금리 (%)
            </label>
            <input
              type="number"
              step="0.1"
              value={interestRate}
              onChange={(e) => setInterestRate(Number(e.target.value))}
              className="w-full rounded-lg bg-gray-800/50 px-4 py-2 text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="4.0"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              대출기간 (개월)
            </label>
            <input
              type="number"
              value={loanPeriod}
              onChange={(e) => setLoanPeriod(Number(e.target.value))}
              className="w-full rounded-lg bg-gray-800/50 px-4 py-2 text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="240"
            />
          </div>
        </div>
      </Card>

      {result && (
        <Card className="bg-gradient-to-br from-primary-600/20 to-primary-700/20">
          <h3 className="mb-4 text-lg font-semibold">계산 결과</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-300">대출 가능 한도</span>
              <span className={`text-xl font-bold ${result.maxLoanAmount <= 0 ? 'text-red-400' : 'text-primary-300'}`}>
                {formatCurrency(result.maxLoanAmount)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">DSR 기준 최대 연간 상환액</span>
              <span className="text-xl font-bold text-primary-300">
                {formatCurrency(result.maxAnnualPayment ?? 0)}
              </span>
            </div>
            {result.existingAnnualPayment > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-300">기존 대출 연간 상환액</span>
                <span className="text-xl font-bold text-red-400">
                  {formatCurrency(result.existingAnnualPayment)}
                </span>
              </div>
            )}
            <div className="mt-4 border-t border-gray-700 pt-3">
              <div className="flex justify-between">
                <span className="text-gray-300">신규 대출 가능 연간 상환액</span>
                <span className="text-xl font-bold text-primary-300">
                  {formatCurrency(result.availableAnnualPayment)}
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
