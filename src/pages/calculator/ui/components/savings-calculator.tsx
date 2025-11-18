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

export const SavingsCalculator = () => {
  const [principal, setPrincipal] = useState<number>(1000000);
  const [interestRate, setInterestRate] = useState<number>(3.5);
  const [period, setPeriod] = useState<number>(12);
  const [isTaxFree, setIsTaxFree] = useState<boolean>(false);

  const result = useMemo(() => {
    if (!principal || !interestRate || !period) {
      return null;
    }

    const monthlyRate = interestRate / 100 / 12;
    const maturityAmount = principal * (1 + monthlyRate) ** period;
    const interest = maturityAmount - principal;
    const taxRate = isTaxFree ? 0 : 0.154; // 15.4% 이자소득세
    const tax = interest * taxRate;
    const afterTaxInterest = interest - tax;
    const afterTaxMaturityAmount = principal + afterTaxInterest;

    return {
      maturityAmount,
      interest,
      tax,
      afterTaxInterest,
      afterTaxMaturityAmount,
    };
  }, [principal, interestRate, period, isTaxFree]);

  return (
    <div className="space-y-6">
      <Disclaimer />
      <Card>
        <h3 className="mb-6 text-xl font-semibold">적금/예금 계산</h3>
        <div className="space-y-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <label className="block text-sm font-medium text-gray-300">
                원금 (원)
              </label>
              {principal > 0 && (
                <span className="text-sm text-gray-500">
                  {formatCurrencyKorean(principal)}
                </span>
              )}
            </div>
            <input
              type="text"
              value={formatNumberInput(principal)}
              onChange={(e) => setPrincipal(parseNumberInput(e.target.value))}
              className="w-full rounded-lg bg-gray-800/50 px-4 py-2 text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="1,000,000"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              금리 (%)
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
              기간 (개월)
            </label>
            <input
              type="text"
              value={formatNumberInput(period)}
              onChange={(e) => setPeriod(parseNumberInput(e.target.value))}
              className="w-full rounded-lg bg-gray-800/50 px-4 py-2 text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="12"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="taxFree"
              checked={isTaxFree}
              onChange={(e) => setIsTaxFree(e.target.checked)}
              className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="taxFree" className="text-sm font-medium text-gray-300">
              이자 비과세 (비과세 저축 등)
            </label>
          </div>
        </div>
      </Card>

      {result && (
        <Card className="bg-gradient-to-br from-primary-600/20 to-primary-700/20">
          <h3 className="mb-4 text-lg font-semibold">계산 결과</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-300">만기 수령액 (세전)</span>
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
              <span className="text-gray-300">이자 수익 (세전)</span>
              <div className="flex flex-col items-end">
                <span className="text-xl font-bold text-primary-300">
                  {formatCurrency(result.interest)}
                </span>
                <span className="text-sm text-gray-500">
                  {formatCurrencyKorean(result.interest)}
                </span>
              </div>
            </div>
            {!isTaxFree && (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-300">이자소득세</span>
                  <div className="flex flex-col items-end">
                    <span className="text-xl font-bold text-red-400">
                      {formatCurrency(result.tax)}
                    </span>
                    <span className="text-sm text-gray-500">
                      {formatCurrencyKorean(result.tax)}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">이자 수익 (세후)</span>
                  <div className="flex flex-col items-end">
                    <span className="text-xl font-bold text-primary-300">
                      {formatCurrency(result.afterTaxInterest)}
                    </span>
                    <span className="text-sm text-gray-500">
                      {formatCurrencyKorean(result.afterTaxInterest)}
                    </span>
                  </div>
                </div>
                <div className="mt-4 border-t border-gray-700 pt-3">
                  <div className="flex justify-between">
                    <span className="text-gray-300">실제 수령액 (세후)</span>
                    <div className="flex flex-col items-end">
                      <span className="text-xl font-bold text-primary-300">
                        {formatCurrency(result.afterTaxMaturityAmount)}
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatCurrencyKorean(result.afterTaxMaturityAmount)}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};
