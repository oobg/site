/* eslint-disable jsx-a11y/label-has-associated-control */
import { useState, useMemo } from 'react';
import { Card } from '@src/shared/ui/card';
import {
  formatCurrency,
  formatCurrencyKorean,
  formatNumberInput,
  parseNumberInput,
} from '@src/shared/utils/number';
import { Disclaimer } from './disclaimer';

export const PersonalPensionCalculator = () => {
  const [monthlyPayment, setMonthlyPayment] = useState<number>(200000);
  const [period, setPeriod] = useState<number>(120);
  const [interestRate, setInterestRate] = useState<number>(4.0);
  const [taxDeductionRate, setTaxDeductionRate] = useState<number>(15.4);

  const result = useMemo(() => {
    if (!monthlyPayment || !period || !interestRate) {
      return null;
    }

    const monthlyRate = interestRate / 100 / 12;
    const maturityAmount = monthlyPayment * (((1 + monthlyRate) ** period - 1) / monthlyRate);
    const totalPayment = monthlyPayment * period;
    const interest = maturityAmount - totalPayment;

    // 세액공제 (연간 납입액의 일정 비율)
    const annualPayment = monthlyPayment * 12;
    const annualTaxDeduction = annualPayment * (taxDeductionRate / 100);
    const totalTaxDeduction = annualTaxDeduction * (period / 12);

    return {
      maturityAmount,
      totalPayment,
      interest,
      annualTaxDeduction,
      totalTaxDeduction,
    };
  }, [monthlyPayment, period, interestRate, taxDeductionRate]);

  return (
    <div className="space-y-6">
      <Disclaimer />
      <Card>
        <h3 className="mb-6 text-xl font-semibold">개인연금저축 계산</h3>
        <div className="space-y-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <label className="block text-sm font-medium text-gray-300">
                월 납입액 (원)
              </label>
              {monthlyPayment > 0 && (
                <span className="text-sm text-gray-500">
                  {formatCurrencyKorean(monthlyPayment)}
                </span>
              )}
            </div>
            <input
              type="text"
              value={formatNumberInput(monthlyPayment)}
              onChange={(e) => setMonthlyPayment(parseNumberInput(e.target.value))}
              className="w-full rounded-lg bg-gray-800/50 px-4 py-2 text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="200,000"
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
              placeholder="120"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              예상 수익률 (%)
            </label>
            <input
              type="text"
              value={formatNumberInput(interestRate)}
              onChange={(e) => setInterestRate(parseNumberInput(e.target.value))}
              className="w-full rounded-lg bg-gray-800/50 px-4 py-2 text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="4.0"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              세액공제율 (%)
            </label>
            <input
              type="text"
              value={formatNumberInput(taxDeductionRate)}
              onChange={(e) => setTaxDeductionRate(parseNumberInput(e.target.value))}
              className="w-full rounded-lg bg-gray-800/50 px-4 py-2 text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="15.4"
            />
          </div>
        </div>
      </Card>

      {result && (
        <Card className="bg-gradient-to-br from-primary-600/20 to-primary-700/20">
          <h3 className="mb-4 text-lg font-semibold">계산 결과</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-300">최종 수령액</span>
              <div className="flex flex-col items-end">
                <span className="text-xl font-bold text-primary-300">
                  {formatCurrency(result.maturityAmount)}
                </span>
                <span className="text-sm text-gray-500">
                  {formatCurrencyKorean(result.maturityAmount)}
                </span>
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">총 납입액</span>
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
              <span className="text-gray-300">이자 수익</span>
              <div className="flex flex-col items-end">
                <span className="text-xl font-bold text-primary-300">
                  {formatCurrency(result.interest)}
                </span>
                <span className="text-sm text-gray-500">
                  {formatCurrencyKorean(result.interest)}
                </span>
              </div>
            </div>
            <div className="mt-4 border-t border-gray-700 pt-3">
              <div className="flex justify-between">
                <span className="text-gray-300">세액공제 혜택 (연간)</span>
                <div className="flex flex-col items-end">
                  <span className="text-xl font-bold text-green-400">
                    {formatCurrency(result.annualTaxDeduction)}
                  </span>
                  <span className="text-sm text-gray-500">
                    {formatCurrencyKorean(result.annualTaxDeduction)}
                  </span>
                </div>
              </div>
              <div className="mt-2 flex justify-between">
                <span className="text-gray-300">총 세액공제 혜택</span>
                <div className="flex flex-col items-end">
                  <span className="text-xl font-bold text-green-400">
                    {formatCurrency(result.totalTaxDeduction)}
                  </span>
                  <span className="text-sm text-gray-500">
                    {formatCurrencyKorean(result.totalTaxDeduction)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
