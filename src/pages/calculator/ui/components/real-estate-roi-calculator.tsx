/* eslint-disable jsx-a11y/label-has-associated-control */
import { useState, useMemo } from 'react';
import { Card } from '@src/shared/ui/card';
import {
  formatCurrency,
  formatCurrencyKorean,
  formatPercent,
  formatNumberInput,
  parseNumberInput,
} from '@src/shared/utils/number';
import { Disclaimer } from './disclaimer';

export const RealEstateRoiCalculator = () => {
  const [purchasePrice, setPurchasePrice] = useState<number>(500000000);
  const [salePrice, setSalePrice] = useState<number>(600000000);
  const [holdingPeriod, setHoldingPeriod] = useState<number>(60);
  const [additionalCosts, setAdditionalCosts] = useState<number>(10000000);

  const result = useMemo(() => {
    if (!purchasePrice || !salePrice || !holdingPeriod) {
      return null;
    }

    const profit = salePrice - purchasePrice - additionalCosts;
    const roi = (profit / purchasePrice) * 100;
    const annualRoi = (roi / holdingPeriod) * 12; // 월 단위를 연 단위로 변환

    return {
      profit,
      roi,
      annualRoi,
    };
  }, [purchasePrice, salePrice, holdingPeriod, additionalCosts]);

  return (
    <div className="space-y-6">
      <Disclaimer />
      <Card>
        <h3 className="mb-6 text-xl font-semibold">부동산 투자 수익률(ROI) 계산</h3>
        <div className="space-y-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <label className="block text-sm font-medium text-gray-300">
                매입가 (원)
              </label>
              {purchasePrice > 0 && (
                <span className="text-sm text-gray-500">
                  {formatCurrencyKorean(purchasePrice)}
                </span>
              )}
            </div>
            <input
              type="text"
              value={formatNumberInput(purchasePrice)}
              onChange={(e) => setPurchasePrice(parseNumberInput(e.target.value))}
              className="w-full rounded-lg bg-gray-800/50 px-4 py-2 text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="500,000,000"
            />
          </div>
          <div>
            <div className="mb-2 flex items-center gap-2">
              <label className="block text-sm font-medium text-gray-300">
                매도가 (원)
              </label>
              {salePrice > 0 && (
                <span className="text-sm text-gray-500">
                  {formatCurrencyKorean(salePrice)}
                </span>
              )}
            </div>
            <input
              type="text"
              value={formatNumberInput(salePrice)}
              onChange={(e) => setSalePrice(parseNumberInput(e.target.value))}
              className="w-full rounded-lg bg-gray-800/50 px-4 py-2 text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="600,000,000"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              보유기간 (개월)
            </label>
            <input
              type="text"
              value={formatNumberInput(holdingPeriod)}
              onChange={(e) => setHoldingPeriod(parseNumberInput(e.target.value))}
              className="w-full rounded-lg bg-gray-800/50 px-4 py-2 text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="60"
            />
          </div>
          <div>
            <div className="mb-2 flex items-center gap-2">
              <label className="block text-sm font-medium text-gray-300">
                추가 비용 (원) - 취득세, 중개수수료 등
              </label>
              {additionalCosts > 0 && (
                <span className="text-sm text-gray-500">
                  {formatCurrencyKorean(additionalCosts)}
                </span>
              )}
            </div>
            <input
              type="text"
              value={formatNumberInput(additionalCosts)}
              onChange={(e) => setAdditionalCosts(parseNumberInput(e.target.value))}
              className="w-full rounded-lg bg-gray-800/50 px-4 py-2 text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="10,000,000"
            />
          </div>
        </div>
      </Card>

      {result && (
        <Card className="bg-gradient-to-br from-primary-600/20 to-primary-700/20">
          <h3 className="mb-4 text-lg font-semibold">계산 결과</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-300">수익</span>
              <div className="flex flex-col items-end">
                <span className={`text-xl font-bold ${result.profit < 0 ? 'text-red-400' : 'text-primary-300'}`}>
                  {formatCurrency(result.profit)}
                </span>
                <span className="text-sm text-gray-500">
                  {formatCurrencyKorean(result.profit)}
                </span>
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">수익률</span>
              <span className={`text-xl font-bold ${result.roi < 0 ? 'text-red-400' : 'text-primary-300'}`}>
                {formatPercent(result.roi, 2)}
              </span>
            </div>
            <div className="mt-4 border-t border-gray-700 pt-3">
              <div className="flex justify-between">
                <span className="text-gray-300">연평균 수익률</span>
                <span className={`text-xl font-bold ${result.annualRoi < 0 ? 'text-red-400' : 'text-primary-300'}`}>
                  {formatPercent(result.annualRoi, 2)}
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
