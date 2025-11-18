/* eslint-disable jsx-a11y/label-has-associated-control */
import { useState, useMemo } from 'react';
import { Card } from '@src/shared/ui/card';
import { formatCurrency, formatCurrencyKorean, formatNumberInput, parseNumberInput } from '@src/shared/utils/number';
import { Disclaimer } from './disclaimer';

export const CarLoanCalculator = () => {
  const [carPrice, setCarPrice] = useState<number>(30000000);
  const [downPayment, setDownPayment] = useState<number>(5000000);
  const [interestRate, setInterestRate] = useState<number>(3.5);
  const [loanPeriod, setLoanPeriod] = useState<number>(36);

  const result = useMemo(() => {
    if (!carPrice || !downPayment || !interestRate || !loanPeriod) {
      return null;
    }

    const loanAmount = carPrice - downPayment;
    const monthlyRate = interestRate / 100 / 12;
    const monthlyPayment = (loanAmount * monthlyRate * (1 + monthlyRate) ** loanPeriod)
      / ((1 + monthlyRate) ** loanPeriod - 1);
    const totalPayment = monthlyPayment * loanPeriod;
    const totalInterest = totalPayment - loanAmount;

    return {
      loanAmount,
      monthlyPayment,
      totalPayment,
      totalInterest,
    };
  }, [carPrice, downPayment, interestRate, loanPeriod]);

  return (
    <div className="space-y-6">
      <Disclaimer />
      <Card>
        <h3 className="mb-6 text-xl font-semibold">차량할부 계산</h3>
        <div className="space-y-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <label htmlFor="car-price" className="block text-sm font-medium text-gray-300">
                차량가격 (원)
              </label>
              {carPrice > 0 && (
                <span className="text-sm text-gray-500">
                  {formatCurrencyKorean(carPrice)}
                </span>
              )}
            </div>
            <input
              id="car-price"
              type="text"
              value={formatNumberInput(carPrice)}
              onChange={(e) => setCarPrice(parseNumberInput(e.target.value))}
              className="w-full rounded-lg bg-gray-800/50 px-4 py-2 text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="30,000,000"
            />
          </div>
          <div>
            <div className="mb-2 flex items-center gap-2">
              <label htmlFor="down-payment" className="block text-sm font-medium text-gray-300">
                계약금 (원)
              </label>
              {downPayment > 0 && (
                <span className="text-sm text-gray-500">
                  {formatCurrencyKorean(downPayment)}
                </span>
              )}
            </div>
            <input
              id="down-payment"
              type="text"
              value={formatNumberInput(downPayment)}
              onChange={(e) => setDownPayment(parseNumberInput(e.target.value))}
              className="w-full rounded-lg bg-gray-800/50 px-4 py-2 text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="5,000,000"
            />
          </div>
          <div>
            <label htmlFor="interest-rate" className="mb-2 block text-sm font-medium text-gray-300">
              금리 (%)
            </label>
            <input
              id="interest-rate"
              type="text"
              value={formatNumberInput(interestRate)}
              onChange={(e) => setInterestRate(parseNumberInput(e.target.value))}
              className="w-full rounded-lg bg-gray-800/50 px-4 py-2 text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="3.5"
            />
          </div>
          <div>
            <label htmlFor="loan-period" className="mb-2 block text-sm font-medium text-gray-300">
              할부기간 (개월)
            </label>
            <input
              id="loan-period"
              type="text"
              value={formatNumberInput(loanPeriod)}
              onChange={(e) => setLoanPeriod(parseNumberInput(e.target.value))}
              className="w-full rounded-lg bg-gray-800/50 px-4 py-2 text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="36"
            />
          </div>
        </div>
      </Card>

      {result && (
        <Card className="bg-gradient-to-br from-primary-600/20 to-primary-700/20">
          <h3 className="mb-4 text-lg font-semibold">계산 결과</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-300">대출금액</span>
              <div className="flex flex-col items-end">
                <span className="text-xl font-bold text-primary-300">
                  {formatCurrency(result.loanAmount)}
                </span>
                <span className="text-sm text-gray-500">
                  {formatCurrencyKorean(result.loanAmount)}
                </span>
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">월 납입금</span>
              <div className="flex flex-col items-end">
                <span className="text-xl font-bold text-primary-300">
                  {formatCurrency(result.monthlyPayment)}
                </span>
                <span className="text-sm text-gray-500">
                  {formatCurrencyKorean(result.monthlyPayment)}
                </span>
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">총 납입금</span>
              <div className="flex flex-col items-end">
                <span className="text-xl font-bold text-primary-300">
                  {formatCurrency(result.totalPayment)}
                </span>
                <span className="text-sm text-gray-500">
                  {formatCurrencyKorean(result.totalPayment)}
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
          </div>
        </Card>
      )}
    </div>
  );
};
