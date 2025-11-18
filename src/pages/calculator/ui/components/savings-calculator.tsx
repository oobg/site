import { useState, useMemo } from 'react';
import { Card } from '@src/shared/ui/card';
import { formatCurrency } from '@src/shared/utils/number';
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
            <label className="mb-2 block text-sm font-medium text-gray-300">
              원금 (원)
            </label>
            <input
              type="number"
              value={principal}
              onChange={(e) => setPrincipal(Number(e.target.value))}
              className="w-full rounded-lg bg-gray-800/50 px-4 py-2 text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="1000000"
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
              placeholder="3.5"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              기간 (개월)
            </label>
            <input
              type="number"
              value={period}
              onChange={(e) => setPeriod(Number(e.target.value))}
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
              <span className="text-xl font-bold text-primary-300">
                {formatCurrency(result.maturityAmount)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">이자 수익 (세전)</span>
              <span className="text-xl font-bold text-primary-300">
                {formatCurrency(result.interest)}
              </span>
            </div>
            {!isTaxFree && (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-300">이자소득세</span>
                  <span className="text-xl font-bold text-red-400">
                    {formatCurrency(result.tax)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">이자 수익 (세후)</span>
                  <span className="text-xl font-bold text-primary-300">
                    {formatCurrency(result.afterTaxInterest)}
                  </span>
                </div>
                <div className="mt-4 border-t border-gray-700 pt-3">
                  <div className="flex justify-between">
                    <span className="text-gray-300">실제 수령액 (세후)</span>
                    <span className="text-xl font-bold text-primary-300">
                      {formatCurrency(result.afterTaxMaturityAmount)}
                    </span>
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

