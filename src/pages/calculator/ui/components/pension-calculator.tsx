/* eslint-disable jsx-a11y/label-has-associated-control */
import { useState, useMemo } from 'react';
import { Card } from '@src/shared/ui/card';
import { formatCurrency, formatCurrencyKorean, formatNumberInput, parseNumberInput } from '@src/shared/utils/number';
import { Disclaimer } from './disclaimer';

export const PensionCalculator = () => {
  const [currentAge, setCurrentAge] = useState<number>(30);
  const [retirementAge, setRetirementAge] = useState<number>(65);
  const [lifeExpectancy, setLifeExpectancy] = useState<number>(85);
  const [targetPension, setTargetPension] = useState<number>(3000000);
  const [expectedReturn, setExpectedReturn] = useState<number>(5.0);

  const result = useMemo(() => {
    if (!currentAge || !retirementAge || !lifeExpectancy || !targetPension || !expectedReturn) {
      return null;
    }

    const savingPeriod = retirementAge - currentAge;
    const pensionPeriod = lifeExpectancy - retirementAge;
    const monthlyReturn = expectedReturn / 100 / 12;
    const totalPensionNeeded = targetPension * pensionPeriod * 12;

    // 필요한 저축액 계산 (복리)
    const requiredSavings = totalPensionNeeded / ((1 + monthlyReturn) ** (savingPeriod * 12));

    // 월 저축액 계산
    const monthlySavings = (requiredSavings * monthlyReturn)
      / ((1 + monthlyReturn) ** (savingPeriod * 12) - 1);

    return {
      savingPeriod,
      pensionPeriod,
      totalPensionNeeded,
      requiredSavings,
      monthlySavings,
    };
  }, [currentAge, retirementAge, lifeExpectancy, targetPension, expectedReturn]);

  return (
    <div className="space-y-6">
      <Disclaimer />
      <Card>
        <h3 className="mb-6 text-xl font-semibold">연금 계산</h3>
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              현재 나이
            </label>
            <input
              type="text"
              value={formatNumberInput(currentAge)}
              onChange={(e) => setCurrentAge(parseNumberInput(e.target.value))}
              className="w-full rounded-lg bg-gray-800/50 px-4 py-2 text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="30"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              은퇴 나이
            </label>
            <input
              type="text"
              value={formatNumberInput(retirementAge)}
              onChange={(e) => setRetirementAge(parseNumberInput(e.target.value))}
              className="w-full rounded-lg bg-gray-800/50 px-4 py-2 text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="65"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              기대수명
            </label>
            <input
              type="text"
              value={formatNumberInput(lifeExpectancy)}
              onChange={(e) => setLifeExpectancy(parseNumberInput(e.target.value))}
              className="w-full rounded-lg bg-gray-800/50 px-4 py-2 text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="85"
            />
          </div>
          <div>
            <div className="mb-2 flex items-center gap-2">
              <label className="block text-sm font-medium text-gray-300">
                목표 월 연금액 (원)
              </label>
              {targetPension > 0 && (
                <span className="text-sm text-gray-500">
                  {formatCurrencyKorean(targetPension)}
                </span>
              )}
            </div>
            <input
              type="text"
              value={formatNumberInput(targetPension)}
              onChange={(e) => setTargetPension(parseNumberInput(e.target.value))}
              className="w-full rounded-lg bg-gray-800/50 px-4 py-2 text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="3,000,000"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              예상 수익률 (%)
            </label>
            <input
              type="text"
              value={formatNumberInput(expectedReturn)}
              onChange={(e) => setExpectedReturn(parseNumberInput(e.target.value))}
              className="w-full rounded-lg bg-gray-800/50 px-4 py-2 text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="5.0"
            />
          </div>
        </div>
      </Card>

      {result && (
        <Card className="bg-gradient-to-br from-primary-600/20 to-primary-700/20">
          <h3 className="mb-4 text-lg font-semibold">계산 결과</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-300">저축 기간</span>
              <span className="text-xl font-bold text-primary-300">
                {result.savingPeriod}년
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">연금 수령 기간</span>
              <span className="text-xl font-bold text-primary-300">
                {result.pensionPeriod}년
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">필요한 총 저축액</span>
              <div className="flex flex-col items-end">
                <span className="text-xl font-bold text-primary-300">
                  {formatCurrency(result.requiredSavings)}
                </span>
                <span className="text-sm text-gray-500">
                  {formatCurrencyKorean(result.requiredSavings)}
                </span>
              </div>
            </div>
            <div className="mt-4 border-t border-gray-700 pt-3">
              <div className="flex justify-between">
                <span className="text-gray-300">월 저축액</span>
                <div className="flex flex-col items-end">
                  <span className="text-xl font-bold text-primary-300">
                    {formatCurrency(result.monthlySavings)}
                  </span>
                  <span className="text-sm text-gray-500">
                    {formatCurrencyKorean(result.monthlySavings)}
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
