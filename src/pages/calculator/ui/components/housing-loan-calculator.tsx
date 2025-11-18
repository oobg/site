import { useState, useMemo } from 'react';
import { Card } from '@src/shared/ui/card';
import { formatCurrency, formatPercent } from '@src/shared/utils/number';
import { Disclaimer } from './disclaimer';

export const HousingLoanCalculator = () => {
  const [income, setIncome] = useState<number>(50000000);
  const [loanAmount, setLoanAmount] = useState<number>(300000000);
  const [housePrice, setHousePrice] = useState<number>(500000000);
  const [existingLoan, setExistingLoan] = useState<number>(0);
  const [interestRate, setInterestRate] = useState<number>(4.0);
  const [loanPeriod, setLoanPeriod] = useState<number>(240);

  const result = useMemo(() => {
    if (!income || !loanAmount || !housePrice || !interestRate || !loanPeriod) {
      return null;
    }

    const monthlyRate = interestRate / 100 / 12;
    const monthlyPayment = (loanAmount * monthlyRate * (1 + monthlyRate) ** loanPeriod)
      / ((1 + monthlyRate) ** loanPeriod - 1);
    const totalDebtPayment = monthlyPayment * 12; // 연간 원리금 상환액
    const existingLoanMonthly = existingLoan > 0
      ? (existingLoan * monthlyRate * (1 + monthlyRate) ** loanPeriod)
        / ((1 + monthlyRate) ** loanPeriod - 1)
      : 0;
    const totalExistingLoanPayment = existingLoanMonthly * 12;

    // DSR (총부채원리금상환비율) = 연간 원리금 상환액 / 연소득 * 100
    const dsr = ((totalDebtPayment + totalExistingLoanPayment) / income) * 100;

    // LTV (주택담보인정비율) = 대출금액 / 주택가격 * 100
    const ltv = (loanAmount / housePrice) * 100;

    // DTI (총부채상환비율) = 연간 원리금 상환액 / 연소득 * 100 (DSR과 유사하지만 약간 다름)
    const dti = (totalDebtPayment / income) * 100;

    return {
      dsr,
      ltv,
      dti,
      monthlyPayment,
      totalDebtPayment,
    };
  }, [income, loanAmount, housePrice, existingLoan, interestRate, loanPeriod]);

  return (
    <div className="space-y-6">
      <Disclaimer />
      <Card>
        <h3 className="mb-6 text-xl font-semibold">주택대출 계산 (DSR/LTV/DTI)</h3>
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              연소득 (원)
            </label>
            <input
              type="number"
              value={income}
              onChange={(e) => setIncome(Number(e.target.value))}
              className="w-full rounded-lg bg-gray-800/50 px-4 py-2 text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="50000000"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              대출금액 (원)
            </label>
            <input
              type="number"
              value={loanAmount}
              onChange={(e) => setLoanAmount(Number(e.target.value))}
              className="w-full rounded-lg bg-gray-800/50 px-4 py-2 text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="300000000"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              주택가격 (원)
            </label>
            <input
              type="number"
              value={housePrice}
              onChange={(e) => setHousePrice(Number(e.target.value))}
              className="w-full rounded-lg bg-gray-800/50 px-4 py-2 text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="500000000"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              기존 대출금액 (원)
            </label>
            <input
              type="number"
              value={existingLoan}
              onChange={(e) => setExistingLoan(Number(e.target.value))}
              className="w-full rounded-lg bg-gray-800/50 px-4 py-2 text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="0"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              대출금리 (%)
            </label>
            <input
              type="number"
              step="0.1"
              value={interestRate}
              onChange={(e) => setInterestRate(Number(e.target.value))}
              className="w-full rounded-lg bg-gray-800/50 px-4 py-2 text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="4.0"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              대출기간 (개월)
            </label>
            <input
              type="number"
              value={loanPeriod}
              onChange={(e) => setLoanPeriod(Number(e.target.value))}
              className="w-full rounded-lg bg-gray-800/50 px-4 py-2 text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="240"
            />
          </div>
        </div>
      </Card>

      {result && (
        <Card className="bg-gradient-to-br from-primary-600/20 to-primary-700/20">
          <h3 className="mb-4 text-lg font-semibold">계산 결과</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-300">DSR (총부채원리금상환비율)</span>
              <span className={`text-xl font-bold ${result.dsr > 40 ? 'text-red-400' : 'text-primary-300'}`}>
                {formatPercent(result.dsr)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">LTV (주택담보인정비율)</span>
              <span className={`text-xl font-bold ${result.ltv > 70 ? 'text-red-400' : 'text-primary-300'}`}>
                {formatPercent(result.ltv)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">DTI (총부채상환비율)</span>
              <span className={`text-xl font-bold ${result.dti > 40 ? 'text-red-400' : 'text-primary-300'}`}>
                {formatPercent(result.dti)}
              </span>
            </div>
            <div className="mt-4 border-t border-gray-700 pt-3">
              <div className="flex justify-between">
                <span className="text-gray-300">월 상환액</span>
                <span className="text-xl font-bold text-primary-300">
                  {formatCurrency(result.monthlyPayment)}
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

