/* eslint-disable jsx-a11y/label-has-associated-control */
import { useMemo } from 'react';
import { Card } from '@src/shared/ui/card';
import {
  formatCurrency,
  formatCurrencyKorean,
  formatNumberInput,
  parseNumberInput,
} from '@src/shared/utils/number';
import { useLocalStorage } from '@src/shared/utils';

export const JeonseLoanCalculator = () => {
  const [jeonseAmount, setJeonseAmount] = useLocalStorage<number>('calculator-jeonse-loan-jeonseAmount', 300000000);
  const [interestRate, setInterestRate] = useLocalStorage<number>('calculator-jeonse-loan-interestRate', 4.5);
  const [loanPeriod, setLoanPeriod] = useLocalStorage<number>('calculator-jeonse-loan-loanPeriod', 12);

  const result = useMemo(() => {
    if (!jeonseAmount || !interestRate || !loanPeriod) {
      return null;
    }

    const monthlyRate = interestRate / 100 / 12;
    const monthlyInterest = jeonseAmount * monthlyRate;
    const totalInterest = monthlyInterest * loanPeriod;
    const monthlyPayment = monthlyInterest;

    return {
      monthlyInterest,
      totalInterest,
      monthlyPayment,
    };
  }, [jeonseAmount, interestRate, loanPeriod]);

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="mb-6 text-xl font-semibold">전세대출이자 계산</h3>
        <div className="space-y-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <label className="block text-sm font-medium text-gray-300">
                전세금 (원)
              </label>
              {jeonseAmount > 0 && (
                <span className="text-sm text-gray-500">
                  {formatCurrencyKorean(jeonseAmount)}
                </span>
              )}
            </div>
            <input
              type="text"
              value={formatNumberInput(jeonseAmount)}
              onChange={(e) => setJeonseAmount(parseNumberInput(e.target.value))}
              className="w-full rounded-lg bg-gray-800/50 px-4 py-2 text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="300,000,000"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              대출금리 (%)
            </label>
            <input
              type="text"
              value={formatNumberInput(interestRate)}
              onChange={(e) => setInterestRate(parseNumberInput(e.target.value))}
              className="w-full rounded-lg bg-gray-800/50 px-4 py-2 text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="4.5"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              대출기간 (개월)
            </label>
            <input
              type="text"
              value={formatNumberInput(loanPeriod)}
              onChange={(e) => setLoanPeriod(parseNumberInput(e.target.value))}
              className="w-full rounded-lg bg-gray-800/50 px-4 py-2 text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="12"
            />
          </div>
        </div>
      </Card>

      {result && (
        <Card className="bg-gradient-to-br from-primary-600/20 to-primary-700/20">
          <h3 className="mb-4 text-lg font-semibold">계산 결과</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-300">월 이자</span>
              <div className="flex flex-col items-end">
                <span className="text-xl font-bold text-primary-300">
                  {formatCurrency(result.monthlyInterest)}
                </span>
                <span className="text-sm text-gray-500">
                  {formatCurrencyKorean(result.monthlyInterest)}
                </span>
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">총 이자</span>
              <div className="flex flex-col items-end">
                <span className="text-xl font-bold text-primary-300">
                  {formatCurrency(result.totalInterest)}
                </span>
                <span className="text-sm text-gray-500">
                  {formatCurrencyKorean(result.totalInterest)}
                </span>
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">월 상환액</span>
              <div className="flex flex-col items-end">
                <span className="text-xl font-bold text-primary-300">
                  {formatCurrency(result.monthlyPayment)}
                </span>
                <span className="text-sm text-gray-500">
                  {formatCurrencyKorean(result.monthlyPayment)}
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
