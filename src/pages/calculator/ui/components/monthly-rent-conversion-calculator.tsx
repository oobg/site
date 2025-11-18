/* eslint-disable jsx-a11y/label-has-associated-control */
import { useMemo } from 'react';
import { Card } from '@src/shared/ui/card';
import {
  formatCurrency,
  formatCurrencyKorean,
  formatPercent,
  formatNumberInput,
  parseNumberInput,
} from '@src/shared/utils/number';
import { useLocalStorage } from '@src/shared/utils';

export const MonthlyRentConversionCalculator = () => {
  const [monthlyRent, setMonthlyRent] = useLocalStorage<number>('calculator-monthly-rent-conversion-monthlyRent', 1000000);
  const [deposit, setDeposit] = useLocalStorage<number>('calculator-monthly-rent-conversion-deposit', 10000000);
  const [jeonseAmount, setJeonseAmount] = useLocalStorage<number>('calculator-monthly-rent-conversion-jeonseAmount', 300000000);

  const result = useMemo(() => {
    if (!monthlyRent || !deposit || !jeonseAmount) {
      return null;
    }

    // 월세 전환율 = (전세금 - 보증금) / (월세 * 12) * 100
    const conversionRate = ((jeonseAmount - deposit) / (monthlyRent * 12)) * 100;

    // 월세 기준 전세금 계산
    const equivalentJeonse = deposit + (monthlyRent * 12 * 100) / conversionRate;

    return {
      conversionRate,
      equivalentJeonse,
    };
  }, [monthlyRent, deposit, jeonseAmount]);

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="mb-6 text-xl font-semibold">월세 전환율 계산</h3>
        <div className="space-y-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <label className="block text-sm font-medium text-gray-300">
                월세 (원)
              </label>
              {monthlyRent > 0 && (
                <span className="text-sm text-gray-500">
                  {formatCurrencyKorean(monthlyRent)}
                </span>
              )}
            </div>
            <input
              type="text"
              value={formatNumberInput(monthlyRent)}
              onChange={(e) => setMonthlyRent(parseNumberInput(e.target.value))}
              className="w-full rounded-lg bg-gray-800/50 px-4 py-2 text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="1,000,000"
            />
          </div>
          <div>
            <div className="mb-2 flex items-center gap-2">
              <label className="block text-sm font-medium text-gray-300">
                보증금 (원)
              </label>
              {deposit > 0 && (
                <span className="text-sm text-gray-500">
                  {formatCurrencyKorean(deposit)}
                </span>
              )}
            </div>
            <input
              type="text"
              value={formatNumberInput(deposit)}
              onChange={(e) => setDeposit(parseNumberInput(e.target.value))}
              className="w-full rounded-lg bg-gray-800/50 px-4 py-2 text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="10,000,000"
            />
          </div>
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
        </div>
      </Card>

      {result && (
        <Card className="bg-gradient-to-br from-primary-600/20 to-primary-700/20">
          <h3 className="mb-4 text-lg font-semibold">계산 결과</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-300">월세 전환율</span>
              <span className="text-xl font-bold text-primary-300">
                {formatPercent(result.conversionRate, 1)}
              </span>
            </div>
            <div className="mt-4 border-t border-gray-700 pt-3">
              <div className="flex justify-between">
                <span className="text-gray-300">월세 기준 전세금</span>
                <div className="flex flex-col items-end">
                  <span className="text-xl font-bold text-primary-300">
                    {formatCurrency(result.equivalentJeonse)}
                  </span>
                  <span className="text-sm text-gray-500">
                    {formatCurrencyKorean(result.equivalentJeonse)}
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
