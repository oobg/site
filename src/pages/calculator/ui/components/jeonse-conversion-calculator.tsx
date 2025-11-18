/* eslint-disable jsx-a11y/label-has-associated-control */
import { useState, useMemo } from 'react';
import { Card } from '@src/shared/ui/card';
import { formatCurrency, formatPercent } from '@src/shared/utils/number';
import { Disclaimer } from './disclaimer';

export const JeonseConversionCalculator = () => {
  const [jeonseAmount, setJeonseAmount] = useState<number>(300000000);
  const [monthlyRent, setMonthlyRent] = useState<number>(1000000);
  const [deposit, setDeposit] = useState<number>(10000000);

  const result = useMemo(() => {
    if (!jeonseAmount || !monthlyRent || !deposit) {
      return null;
    }

    // 전세 전환율 = (전세금 - 보증금) / (월세 * 12) * 100
    const conversionRate = ((jeonseAmount - deposit) / (monthlyRent * 12)) * 100;

    // 월세로 전세 전환 시 필요한 전세금
    const requiredJeonse = deposit + (monthlyRent * 12 * 100) / conversionRate;

    return {
      conversionRate,
      requiredJeonse,
    };
  }, [jeonseAmount, monthlyRent, deposit]);

  return (
    <div className="space-y-6">
      <Disclaimer />
      <Card>
        <h3 className="mb-6 text-xl font-semibold">전세 전환율 계산</h3>
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              전세금 (원)
            </label>
            <input
              type="number"
              value={jeonseAmount}
              onChange={(e) => setJeonseAmount(Number(e.target.value))}
              className="w-full rounded-lg bg-gray-800/50 px-4 py-2 text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="300000000"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              월세 (원)
            </label>
            <input
              type="number"
              value={monthlyRent}
              onChange={(e) => setMonthlyRent(Number(e.target.value))}
              className="w-full rounded-lg bg-gray-800/50 px-4 py-2 text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="1000000"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              보증금 (원)
            </label>
            <input
              type="number"
              value={deposit}
              onChange={(e) => setDeposit(Number(e.target.value))}
              className="w-full rounded-lg bg-gray-800/50 px-4 py-2 text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="10000000"
            />
          </div>
        </div>
      </Card>

      {result && (
        <Card className="bg-gradient-to-br from-primary-600/20 to-primary-700/20">
          <h3 className="mb-4 text-lg font-semibold">계산 결과</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-300">전세 전환율</span>
              <span className="text-xl font-bold text-primary-300">
                {formatPercent(result.conversionRate, 1)}
              </span>
            </div>
            <div className="mt-4 border-t border-gray-700 pt-3">
              <div className="flex justify-between">
                <span className="text-gray-300">월세 기준 전세금</span>
                <span className="text-xl font-bold text-primary-300">
                  {formatCurrency(result.requiredJeonse)}
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
