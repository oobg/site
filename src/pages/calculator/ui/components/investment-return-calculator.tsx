import { useState, useMemo } from 'react';
import { Card } from '@src/shared/ui/card';
import { formatCurrency, formatPercent } from '@src/shared/utils/number';
import { Disclaimer } from './disclaimer';

export const InvestmentReturnCalculator = () => {
  const [principal, setPrincipal] = useState<number>(10000000);
  const [returnRate, setReturnRate] = useState<number>(5.0);
  const [period, setPeriod] = useState<number>(12);
  const [isCompound, setIsCompound] = useState<boolean>(true);

  const result = useMemo(() => {
    if (!principal || !returnRate || !period) {
      return null;
    }

    let finalAmount = 0;
    let interest = 0;

    if (isCompound) {
      // 복리 계산
      const monthlyRate = returnRate / 100 / 12;
      finalAmount = principal * (1 + monthlyRate) ** period;
      interest = finalAmount - principal;
    } else {
      // 단리 계산
      const monthlyRate = returnRate / 100 / 12;
      interest = principal * monthlyRate * period;
      finalAmount = principal + interest;
    }

    const returnPercentage = (interest / principal) * 100;

    return {
      finalAmount,
      interest,
      returnPercentage,
    };
  }, [principal, returnRate, period, isCompound]);

  return (
    <div className="space-y-6">
      <Disclaimer />
      <Card>
        <h3 className="mb-6 text-xl font-semibold">복리/단리 투자 수익률 계산</h3>
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
              placeholder="10000000"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              연 수익률 (%)
            </label>
            <input
              type="number"
              step="0.1"
              value={returnRate}
              onChange={(e) => setReturnRate(Number(e.target.value))}
              className="w-full rounded-lg bg-gray-800/50 px-4 py-2 text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="5.0"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              투자기간 (개월)
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
              id="compound"
              checked={isCompound}
              onChange={(e) => setIsCompound(e.target.checked)}
              className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="compound" className="text-sm font-medium text-gray-300">
              복리 계산 (체크 해제 시 단리)
            </label>
          </div>
        </div>
      </Card>

      {result && (
        <Card className="bg-gradient-to-br from-primary-600/20 to-primary-700/20">
          <h3 className="mb-4 text-lg font-semibold">계산 결과</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-300">최종 수익</span>
              <span className="text-xl font-bold text-primary-300">
                {formatCurrency(result.finalAmount)}
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
                <span className="text-gray-300">수익률</span>
                <span className="text-xl font-bold text-primary-300">
                  {formatPercent(result.returnPercentage, 2)}
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

