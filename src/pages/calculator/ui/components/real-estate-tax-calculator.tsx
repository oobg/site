/* eslint-disable jsx-a11y/label-has-associated-control */
import { useState, useMemo } from 'react';
import { Card } from '@src/shared/ui/card';
import { formatCurrency, formatNumberInput, parseNumberInput } from '@src/shared/utils/number';
import { Disclaimer } from './disclaimer';

export const RealEstateTaxCalculator = () => {
  const [acquisitionPrice, setAcquisitionPrice] = useState<number>(500000000);
  const [salePrice, setSalePrice] = useState<number>(600000000);
  const [holdingPeriod, setHoldingPeriod] = useState<number>(60);
  const [houseType, setHouseType] = useState<'general' | 'first'>('general');

  const result = useMemo(() => {
    if (!acquisitionPrice || !salePrice || !holdingPeriod) {
      return null;
    }

    // 취득세 계산 (간단화)
    const acquisitionTax = acquisitionPrice * 0.01; // 1% (실제로는 복잡함)

    // 양도소득세 계산
    const profit = salePrice - acquisitionPrice;
    const isLongTerm = holdingPeriod >= 24; // 2년 이상 보유 시 장기보유

    let transferTax = 0;
    if (houseType === 'first' && isLongTerm) {
      // 1주택 장기보유 특별공제
      transferTax = profit * 0.06; // 6%
    } else if (isLongTerm) {
      transferTax = profit * 0.10; // 10%
    } else {
      transferTax = profit * 0.30; // 30%
    }

    return {
      profit,
      acquisitionTax,
      transferTax,
      isLongTerm,
    };
  }, [acquisitionPrice, salePrice, holdingPeriod, houseType]);

  return (
    <div className="space-y-6">
      <Disclaimer />
      <Card>
        <h3 className="mb-6 text-xl font-semibold">부동산 취득세/양도세 계산</h3>
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              취득가 (원)
            </label>
            <input
              type="text"
              value={formatNumberInput(acquisitionPrice)}
              onChange={(e) => setAcquisitionPrice(parseNumberInput(e.target.value))}
              className="w-full rounded-lg bg-gray-800/50 px-4 py-2 text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="500,000,000"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              양도가 (원)
            </label>
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
            <label className="mb-2 block text-sm font-medium text-gray-300">
              주택 유형
            </label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setHouseType('general')}
                className={`flex-1 rounded-lg px-4 py-2 transition-all ${
                  houseType === 'general'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
                }`}
              >
                일반 주택
              </button>
              <button
                type="button"
                onClick={() => setHouseType('first')}
                className={`flex-1 rounded-lg px-4 py-2 transition-all ${
                  houseType === 'first'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
                }`}
              >
                1주택
              </button>
            </div>
          </div>
        </div>
      </Card>

      {result && (
        <Card className="bg-gradient-to-br from-primary-600/20 to-primary-700/20">
          <h3 className="mb-4 text-lg font-semibold">계산 결과</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-300">양도 차익</span>
              <span className="text-xl font-bold text-primary-300">
                {formatCurrency(result.profit)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">취득세</span>
              <span className="text-xl font-bold text-primary-300">
                {formatCurrency(result.acquisitionTax)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">양도소득세</span>
              <span className="text-xl font-bold text-primary-300">
                {formatCurrency(result.transferTax)}
              </span>
            </div>
            <div className="mt-4 border-t border-gray-700 pt-3">
              <div className="text-xs text-gray-400">
                * {result.isLongTerm ? '장기보유' : '단기보유'} 주택
                {houseType === 'first' && result.isLongTerm && ' (1주택 장기보유 특별공제 적용)'}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
