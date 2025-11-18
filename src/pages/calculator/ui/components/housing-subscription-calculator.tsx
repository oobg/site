/* eslint-disable jsx-a11y/label-has-associated-control */
import { useState, useMemo } from 'react';
import { Card } from '@src/shared/ui/card';
import { formatCurrency, formatNumberInput, parseNumberInput } from '@src/shared/utils/number';
import { Disclaimer } from './disclaimer';

export const HousingSubscriptionCalculator = () => {
  const [monthlyPayment, setMonthlyPayment] = useState<number>(100000);
  const [period, setPeriod] = useState<number>(60);
  const [interestRate, setInterestRate] = useState<number>(3.5);
  const [preferentialRate, setPreferentialRate] = useState<number>(1.0);

  const result = useMemo(() => {
    if (!monthlyPayment || !period || !interestRate) {
      return null;
    }

    const monthlyRate = (interestRate + preferentialRate) / 100 / 12;
    const maturityAmount = monthlyPayment * (((1 + monthlyRate) ** period - 1) / monthlyRate);
    const totalPayment = monthlyPayment * period;
    const interest = maturityAmount - totalPayment;

    // 세액공제 (연간 납입액의 40%, 최대 200만원)
    const annualPayment = monthlyPayment * 12;
    const taxDeduction = Math.min(annualPayment * 0.4, 2000000);

    return {
      maturityAmount,
      totalPayment,
      interest,
      taxDeduction,
    };
  }, [monthlyPayment, period, interestRate, preferentialRate]);

  return (
    <div className="space-y-6">
      <Disclaimer />
      <Card>
        <h3 className="mb-6 text-xl font-semibold">주택청약종합저축 계산</h3>
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              월 납입액 (원)
            </label>
            <input
              type="text"
              value={formatNumberInput(monthlyPayment)}
              onChange={(e) => setMonthlyPayment(parseNumberInput(e.target.value))}
              className="w-full rounded-lg bg-gray-800/50 px-4 py-2 text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="100,000"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              가입기간 (개월)
            </label>
            <input
              type="text"
              value={formatNumberInput(period)}
              onChange={(e) => setPeriod(parseNumberInput(e.target.value))}
              className="w-full rounded-lg bg-gray-800/50 px-4 py-2 text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="60"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              기본금리 (%)
            </label>
            <input
              type="text"
              value={formatNumberInput(interestRate)}
              onChange={(e) => setInterestRate(parseNumberInput(e.target.value))}
              className="w-full rounded-lg bg-gray-800/50 px-4 py-2 text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="3.5"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              우대금리 (%)
            </label>
            <input
              type="text"
              value={formatNumberInput(preferentialRate)}
              onChange={(e) => setPreferentialRate(parseNumberInput(e.target.value))}
              className="w-full rounded-lg bg-gray-800/50 px-4 py-2 text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="1.0"
            />
          </div>
        </div>
      </Card>

      {result && (
        <Card className="bg-gradient-to-br from-primary-600/20 to-primary-700/20">
          <h3 className="mb-4 text-lg font-semibold">계산 결과</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-300">만기 수령액</span>
              <span className="text-xl font-bold text-primary-300">
                {formatCurrency(result.maturityAmount)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">총 납입액</span>
              <span className="text-xl font-bold text-primary-300">
                {formatCurrency(result.totalPayment)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">이자 수익</span>
              <span className="text-xl font-bold text-primary-300">
                {formatCurrency(result.interest)}
              </span>
            </div>
            <div className="mt-4 border-t border-gray-700 pt-3">
              <div className="flex justify-between">
                <span className="text-gray-300">세액공제 (연간 최대)</span>
                <span className="text-xl font-bold text-green-400">
                  {formatCurrency(result.taxDeduction)}
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
