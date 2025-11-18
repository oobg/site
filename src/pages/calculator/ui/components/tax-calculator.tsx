/* eslint-disable jsx-a11y/label-has-associated-control */
import { useState, useMemo } from 'react';
import { Card } from '@src/shared/ui/card';
import { formatCurrency, formatNumberInput, parseNumberInput } from '@src/shared/utils/number';
import { Disclaimer } from './disclaimer';

export const TaxCalculator = () => {
  const [income, setIncome] = useState<number>(50000000);
  const [deduction, setDeduction] = useState<number>(15000000);

  const result = useMemo(() => {
    if (!income) {
      return null;
    }

    const taxableIncome = Math.max(0, income - deduction);

    // 종합소득세 계산 (2024년 기준, 단순화된 계산)
    let incomeTax = 0;
    if (taxableIncome <= 12000000) {
      incomeTax = taxableIncome * 0.06;
    } else if (taxableIncome <= 46000000) {
      incomeTax = 12000000 * 0.06 + (taxableIncome - 12000000) * 0.15;
    } else if (taxableIncome <= 88000000) {
      incomeTax = 12000000 * 0.06 + 34000000 * 0.15
        + (taxableIncome - 46000000) * 0.24;
    } else if (taxableIncome <= 150000000) {
      incomeTax = 12000000 * 0.06 + 34000000 * 0.15 + 42000000 * 0.24
        + (taxableIncome - 88000000) * 0.35;
    } else if (taxableIncome <= 300000000) {
      incomeTax = 12000000 * 0.06 + 34000000 * 0.15 + 42000000 * 0.24
        + 62000000 * 0.35 + (taxableIncome - 150000000) * 0.38;
    } else if (taxableIncome <= 500000000) {
      incomeTax = 12000000 * 0.06 + 34000000 * 0.15 + 42000000 * 0.24
        + 62000000 * 0.35 + 150000000 * 0.38
        + (taxableIncome - 300000000) * 0.40;
    } else {
      incomeTax = 12000000 * 0.06 + 34000000 * 0.15 + 42000000 * 0.24
        + 62000000 * 0.35 + 150000000 * 0.38 + 200000000 * 0.40
        + (taxableIncome - 500000000) * 0.42;
    }

    // 지방소득세 (소득세의 10%)
    const localIncomeTax = incomeTax * 0.1;

    // 총 소득세
    const totalIncomeTax = incomeTax + localIncomeTax;

    // 부가가치세 (간단 계산, 매출 기준)
    const vat = (income * 0.1) / 11; // 부가세 포함 가격 기준

    return {
      taxableIncome,
      incomeTax,
      localIncomeTax,
      totalIncomeTax,
      vat,
    };
  }, [income, deduction]);

  return (
    <div className="space-y-6">
      <Disclaimer />
      <Card>
        <h3 className="mb-6 text-xl font-semibold">세금 계산</h3>
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              연소득 (원)
            </label>
            <input
              type="text"
              value={formatNumberInput(income)}
              onChange={(e) => setIncome(parseNumberInput(e.target.value))}
              className="w-full rounded-lg bg-gray-800/50 px-4 py-2 text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="50,000,000"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              공제액 (원)
            </label>
            <input
              type="text"
              value={formatNumberInput(deduction)}
              onChange={(e) => setDeduction(parseNumberInput(e.target.value))}
              className="w-full rounded-lg bg-gray-800/50 px-4 py-2 text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="15,000,000"
            />
          </div>
        </div>
      </Card>

      {result && (
        <Card className="bg-gradient-to-br from-primary-600/20 to-primary-700/20">
          <h3 className="mb-4 text-lg font-semibold">계산 결과</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-300">과세표준</span>
              <span className="text-xl font-bold text-primary-300">
                {formatCurrency(result.taxableIncome)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">소득세</span>
              <span className="text-xl font-bold text-primary-300">
                {formatCurrency(result.incomeTax)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">지방소득세</span>
              <span className="text-xl font-bold text-primary-300">
                {formatCurrency(result.localIncomeTax)}
              </span>
            </div>
            <div className="mt-4 border-t border-gray-700 pt-3">
              <div className="flex justify-between">
                <span className="text-gray-300">총 소득세</span>
                <span className="text-xl font-bold text-primary-300">
                  {formatCurrency(result.totalIncomeTax)}
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
