/* eslint-disable jsx-a11y/label-has-associated-control */
import { useState, useMemo } from 'react';
import { Card } from '@src/shared/ui/card';
import { Disclaimer } from './disclaimer';

export const HousingSubscriptionScoreCalculator = () => {
  const [membershipPeriod, setMembershipPeriod] = useState<number>(60);
  const [totalPayment, setTotalPayment] = useState<number>(6000000);
  const [homelessPeriod, setHomelessPeriod] = useState<number>(120);
  const [numberOfMembers, setNumberOfMembers] = useState<number>(1);

  const result = useMemo(() => {
    if (!membershipPeriod || !totalPayment || !homelessPeriod) {
      return null;
    }

    // 주택청약 점수 계산 (간단화된 버전)
    // 실제로는 더 복잡한 계산식이 적용됨
    const membershipScore = Math.min(membershipPeriod * 0.5, 50); // 가입기간 점수 (최대 50점)
    const paymentScore = Math.min((totalPayment / 1000000) * 0.1, 30); // 납입액 점수 (최대 30점)
    const homelessScore = Math.min(homelessPeriod * 0.1, 20); // 무주택기간 점수 (최대 20점)
    const memberBonus = numberOfMembers > 1 ? 5 : 0; // 가입자 수 보너스

    const totalScore = membershipScore + paymentScore + homelessScore + memberBonus;

    // 예상 당첨 가능성 (점수 기반, 단순화)
    let probability = '낮음';
    if (totalScore >= 80) {
      probability = '매우 높음';
    } else if (totalScore >= 60) {
      probability = '높음';
    } else if (totalScore >= 40) {
      probability = '보통';
    }

    return {
      membershipScore,
      paymentScore,
      homelessScore,
      memberBonus,
      totalScore,
      probability,
    };
  }, [membershipPeriod, totalPayment, homelessPeriod, numberOfMembers]);

  return (
    <div className="space-y-6">
      <Disclaimer />
      <Card>
        <h3 className="mb-6 text-xl font-semibold">주택청약 점수 계산</h3>
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              가입기간 (개월)
            </label>
            <input
              type="number"
              value={membershipPeriod}
              onChange={(e) => setMembershipPeriod(Number(e.target.value))}
              className="w-full rounded-lg bg-gray-800/50 px-4 py-2 text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="60"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              총 납입액 (원)
            </label>
            <input
              type="number"
              value={totalPayment}
              onChange={(e) => setTotalPayment(Number(e.target.value))}
              className="w-full rounded-lg bg-gray-800/50 px-4 py-2 text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="6000000"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              무주택기간 (개월)
            </label>
            <input
              type="number"
              value={homelessPeriod}
              onChange={(e) => setHomelessPeriod(Number(e.target.value))}
              className="w-full rounded-lg bg-gray-800/50 px-4 py-2 text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="120"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              가입자 수
            </label>
            <input
              type="number"
              value={numberOfMembers}
              onChange={(e) => setNumberOfMembers(Number(e.target.value))}
              className="w-full rounded-lg bg-gray-800/50 px-4 py-2 text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="1"
              min="1"
            />
          </div>
        </div>
      </Card>

      {result && (
        <Card className="bg-gradient-to-br from-primary-600/20 to-primary-700/20">
          <h3 className="mb-4 text-lg font-semibold">계산 결과</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-300">가입기간 점수</span>
              <span className="text-xl font-bold text-primary-300">
                {result.membershipScore.toFixed(1)}점
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">납입액 점수</span>
              <span className="text-xl font-bold text-primary-300">
                {result.paymentScore.toFixed(1)}점
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">무주택기간 점수</span>
              <span className="text-xl font-bold text-primary-300">
                {result.homelessScore.toFixed(1)}점
              </span>
            </div>
            {result.memberBonus > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-300">가입자 수 보너스</span>
                <span className="text-xl font-bold text-green-400">
                  +{result.memberBonus}점
                </span>
              </div>
            )}
            <div className="mt-4 border-t border-gray-700 pt-3">
              <div className="flex justify-between">
                <span className="text-gray-300">총 점수</span>
                <span className="text-2xl font-bold text-primary-300">
                  {result.totalScore.toFixed(1)}점
                </span>
              </div>
              <div className="mt-2 flex justify-between">
                <span className="text-gray-300">예상 당첨 가능성</span>
                <span className="text-xl font-bold text-primary-300">
                  {result.probability}
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
