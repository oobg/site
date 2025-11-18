/* eslint-disable jsx-a11y/label-has-associated-control */
import { useMemo } from 'react';
import { Card } from '@src/shared/ui/card';
import {
  formatCurrency,
  formatCurrencyKorean,
  formatNumberInput,
  parseNumberInput,
} from '@src/shared/utils/number';
import { useLocalStorage } from '@src/shared/utils';

export const RealEstateFeeCalculator = () => {
  const [price, setPrice] = useLocalStorage<number>('calculator-real-estate-fee-price', 500000000);
  const [type, setType] = useLocalStorage<'sale' | 'jeonse'>('calculator-real-estate-fee-type', 'sale');

  const result = useMemo(() => {
    if (!price) {
      return null;
    }

    let fee = 0;

    if (type === 'sale') {
      // 매매 중개수수료 (2021년 기준)
      if (price <= 50000000) {
        fee = price * 0.006; // 0.6%
      } else if (price <= 200000000) {
        fee = 50000000 * 0.006 + (price - 50000000) * 0.005; // 0.5%
      } else if (price <= 600000000) {
        fee = 50000000 * 0.006 + 150000000 * 0.005
          + (price - 200000000) * 0.004; // 0.4%
      } else if (price <= 900000000) {
        fee = 50000000 * 0.006 + 150000000 * 0.005 + 400000000 * 0.004
          + (price - 600000000) * 0.005; // 0.5%
      } else {
        fee = 50000000 * 0.006 + 150000000 * 0.005 + 400000000 * 0.004
          + 300000000 * 0.005 + (price - 900000000) * 0.009; // 0.9%
      }
    } else if (price <= 50000000) {
      // 전세 중개수수료
      fee = price * 0.005; // 0.5%
    } else if (price <= 200000000) {
      fee = 50000000 * 0.005 + (price - 50000000) * 0.004; // 0.4%
    } else if (price <= 600000000) {
      fee = 50000000 * 0.005 + 150000000 * 0.004
        + (price - 200000000) * 0.003; // 0.3%
    } else if (price <= 900000000) {
      fee = 50000000 * 0.005 + 150000000 * 0.004 + 400000000 * 0.003
        + (price - 600000000) * 0.004; // 0.4%
    } else {
      fee = 50000000 * 0.005 + 150000000 * 0.004 + 400000000 * 0.003
        + 300000000 * 0.004 + (price - 900000000) * 0.005; // 0.5%
    }

    // 상한액 적용 (매매: 9천만원, 전세: 3천만원)
    const maxFee = type === 'sale' ? 90000000 : 30000000;
    const finalFee = Math.min(fee, maxFee);

    return {
      fee: finalFee,
      maxFee,
    };
  }, [price, type]);

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="mb-6 text-xl font-semibold">부동산 중개수수료 계산</h3>
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              거래 유형
            </label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setType('sale')}
                className={`flex-1 rounded-lg px-4 py-2 transition-all ${
                  type === 'sale'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
                }`}
              >
                매매
              </button>
              <button
                type="button"
                onClick={() => setType('jeonse')}
                className={`flex-1 rounded-lg px-4 py-2 transition-all ${
                  type === 'jeonse'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
                }`}
              >
                전세
              </button>
            </div>
          </div>
          <div>
            <div className="mb-2 flex items-center gap-2">
              <label className="block text-sm font-medium text-gray-300">
                {type === 'sale' ? '매매가격' : '전세금'} (원)
              </label>
              {price > 0 && (
                <span className="text-sm text-gray-500">
                  {formatCurrencyKorean(price)}
                </span>
              )}
            </div>
            <input
              type="text"
              value={formatNumberInput(price)}
              onChange={(e) => setPrice(parseNumberInput(e.target.value))}
              className="w-full rounded-lg bg-gray-800/50 px-4 py-2 text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="500,000,000"
            />
          </div>
        </div>
      </Card>

      {result && (
        <Card className="bg-gradient-to-br from-primary-600/20 to-primary-700/20">
          <h3 className="mb-4 text-lg font-semibold">계산 결과</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-300">중개수수료 (상한액 적용)</span>
              <div className="flex flex-col items-end">
                <span className="text-xl font-bold text-primary-300">
                  {formatCurrency(result.fee)}
                </span>
                <span className="text-sm text-gray-500">
                  {formatCurrencyKorean(result.fee)}
                </span>
              </div>
            </div>
            <div className="text-xs text-gray-400">
              * {type === 'sale' ? '매매' : '전세'} 중개수수료 상한액: {formatCurrency(result.maxFee)} ({formatCurrencyKorean(result.maxFee)})
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
