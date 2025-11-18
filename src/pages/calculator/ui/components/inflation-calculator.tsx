/* eslint-disable jsx-a11y/label-has-associated-control */
import { useState, useMemo } from 'react';
import { Card } from '@src/shared/ui/card';
import { formatCurrency } from '@src/shared/utils/number';
import { Disclaimer } from './disclaimer';

export const InflationCalculator = () => {
  const [currentValue, setCurrentValue] = useState<number>(1000000);
  const [inflationRate, setInflationRate] = useState<number>(2.5);
  const [period, setPeriod] = useState<number>(10);

  const result = useMemo(() => {
    if (!currentValue || !inflationRate || !period) {
      return null;
    }

    // 미래가치 = 현재가치 * (1 + 인플레이션율)^기간
    const futureValue = currentValue * (1 + inflationRate / 100) ** period;

    // 실질가치 (구매력 기준)
    const realValue = currentValue / (1 + inflationRate / 100) ** period;

    // 손실 금액
    const loss = currentValue - realValue;

    return {
      futureValue,
      realValue,
      loss,
    };
  }, [currentValue, inflationRate, period]);

  return (
    <div className="space-y-6">
      <Disclaimer />
      <Card>
        <h3 className="mb-6 text-xl font-semibold">인플레이션 계산</h3>
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              현재가치 (원)
            </label>
            <input
              type="number"
              value={currentValue}
              onChange={(e) => setCurrentValue(Number(e.target.value))}
              className="w-full rounded-lg bg-gray-800/50 px-4 py-2 text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="1000000"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              인플레이션율 (%)
            </label>
            <input
              type="number"
              step="0.1"
              value={inflationRate}
              onChange={(e) => setInflationRate(Number(e.target.value))}
              className="w-full rounded-lg bg-gray-800/50 px-4 py-2 text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="2.5"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              기간 (년)
            </label>
            <input
              type="number"
              value={period}
              onChange={(e) => setPeriod(Number(e.target.value))}
              className="w-full rounded-lg bg-gray-800/50 px-4 py-2 text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="10"
            />
          </div>
        </div>
      </Card>

      {result && (
        <Card className="bg-gradient-to-br from-primary-600/20 to-primary-700/20">
          <h3 className="mb-4 text-lg font-semibold">계산 결과</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-300">미래가치 (명목가치)</span>
              <span className="text-xl font-bold text-primary-300">
                {formatCurrency(result.futureValue)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">실질가치 (구매력 기준)</span>
              <span className="text-xl font-bold text-red-400">
                {formatCurrency(result.realValue)}
              </span>
            </div>
            <div className="mt-4 border-t border-gray-700 pt-3">
              <div className="flex justify-between">
                <span className="text-gray-300">구매력 손실</span>
                <span className="text-xl font-bold text-red-400">
                  {formatCurrency(result.loss)}
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
