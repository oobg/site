/* eslint-disable jsx-a11y/label-has-associated-control */
import { useState, useMemo } from 'react';
import { Card } from '@src/shared/ui/card';
import { formatCurrency } from '@src/shared/utils/number';
import { Disclaimer } from './disclaimer';

export const IrpCalculator = () => {
  const [monthlyPayment, setMonthlyPayment] = useState<number>(200000);
  const [period, setPeriod] = useState<number>(240);
  const [expectedReturn, setExpectedReturn] = useState<number>(5.0);

  const result = useMemo(() => {
    if (!monthlyPayment || !period || !expectedReturn) {
      return null;
    }

    const monthlyRate = expectedReturn / 100 / 12;
    const maturityAmount = monthlyPayment * (((1 + monthlyRate) ** period - 1) / monthlyRate);
    const totalPayment = monthlyPayment * period;
    const interest = maturityAmount - totalPayment;

    // 세액공제 (연간 납입액의 15.4%, 최대 180만원)
    const annualPayment = monthlyPayment * 12;
    const annualTaxDeduction = Math.min(annualPayment * 0.154, 1800000);
    const totalTaxDeduction = annualTaxDeduction * (period / 12);

    return {
      maturityAmount,
      totalPayment,
      interest,
      annualTaxDeduction,
      totalTaxDeduction,
    };
  }, [monthlyPayment, period, expectedReturn]);

  return (
    <div className="space-y-6">
      <Disclaimer />
      <Card>
        <h3 className="mb-6 text-xl font-semibold">IRP(개인형퇴직연금) 계산</h3>
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              월 납입액 (원)
            </label>
            <input
              type="number"
              value={monthlyPayment}
              onChange={(e) => setMonthlyPayment(Number(e.target.value))}
              className="w-full rounded-lg bg-gray-800/50 px-4 py-2 text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="200000"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              가입기간 (개월)
            </label>
            <input
              type="number"
              value={period}
              onChange={(e) => setPeriod(Number(e.target.value))}
              className="w-full rounded-lg bg-gray-800/50 px-4 py-2 text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="240"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              예상 수익률 (%)
            </label>
            <input
              type="number"
              step="0.1"
              value={expectedReturn}
              onChange={(e) => setExpectedReturn(Number(e.target.value))}
              className="w-full rounded-lg bg-gray-800/50 px-4 py-2 text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="5.0"
            />
          </div>
        </div>
      </Card>

      {result && (
        <Card className="bg-gradient-to-br from-primary-600/20 to-primary-700/20">
          <h3 className="mb-4 text-lg font-semibold">계산 결과</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-300">퇴직 시 수령액</span>
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
                  {formatCurrency(result.annualTaxDeduction)}
                </span>
              </div>
              <div className="mt-2 flex justify-between">
                <span className="text-gray-300">총 세액공제</span>
                <span className="text-xl font-bold text-green-400">
                  {formatCurrency(result.totalTaxDeduction)}
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
