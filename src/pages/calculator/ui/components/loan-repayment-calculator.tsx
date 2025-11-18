/* eslint-disable jsx-a11y/label-has-associated-control */
import { useState, useMemo } from 'react';
import { Card } from '@src/shared/ui/card';
import { formatCurrency } from '@src/shared/utils/number';
import { Disclaimer } from './disclaimer';

export const LoanRepaymentCalculator = () => {
  const [loanAmount, setLoanAmount] = useState<number>(100000000);
  const [interestRate, setInterestRate] = useState<number>(4.0);
  const [loanPeriod, setLoanPeriod] = useState<number>(240);

  const result = useMemo(() => {
    if (!loanAmount || !interestRate || !loanPeriod) {
      return null;
    }

    const monthlyRate = interestRate / 100 / 12;

    // 원리금균등상환
    const equalPayment = (loanAmount * monthlyRate * (1 + monthlyRate) ** loanPeriod)
      / ((1 + monthlyRate) ** loanPeriod - 1);
    const equalTotalPayment = equalPayment * loanPeriod;
    const equalTotalInterest = equalTotalPayment - loanAmount;

    // 원금균등상환
    const principalPayment = loanAmount / loanPeriod;
    let principalTotalInterest = 0;
    let remainingPrincipal = loanAmount;

    for (let i = 0; i < loanPeriod; i += 1) {
      const interestPayment = remainingPrincipal * monthlyRate;
      principalTotalInterest += interestPayment;
      remainingPrincipal -= principalPayment;
    }

    const principalTotalPayment = loanAmount + principalTotalInterest;

    return {
      equalPayment,
      equalTotalPayment,
      equalTotalInterest,
      principalPayment,
      principalTotalPayment,
      principalTotalInterest,
    };
  }, [loanAmount, interestRate, loanPeriod]);

  return (
    <div className="space-y-6">
      <Disclaimer />
      <Card>
        <h3 className="mb-6 text-xl font-semibold">대출 상환 계산</h3>
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              대출금액 (원)
            </label>
            <input
              type="number"
              value={loanAmount}
              onChange={(e) => setLoanAmount(Number(e.target.value))}
              className="w-full rounded-lg bg-gray-800/50 px-4 py-2 text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="100000000"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              금리 (%)
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
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-gradient-to-br from-primary-600/20 to-primary-700/20">
            <h3 className="mb-4 text-lg font-semibold">원리금균등상환</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-300">월 상환액</span>
                <span className="text-xl font-bold text-primary-300">
                  {formatCurrency(result.equalPayment)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">총 상환액</span>
                <span className="text-xl font-bold text-primary-300">
                  {formatCurrency(result.equalTotalPayment)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">총 이자</span>
                <span className="text-xl font-bold text-primary-300">
                  {formatCurrency(result.equalTotalInterest)}
                </span>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-blue-600/20 to-blue-700/20">
            <h3 className="mb-4 text-lg font-semibold">원금균등상환</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-300">월 원금</span>
                <span className="text-xl font-bold text-blue-300">
                  {formatCurrency(result.principalPayment)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">총 상환액</span>
                <span className="text-xl font-bold text-blue-300">
                  {formatCurrency(result.principalTotalPayment)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">총 이자</span>
                <span className="text-xl font-bold text-blue-300">
                  {formatCurrency(result.principalTotalInterest)}
                </span>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
