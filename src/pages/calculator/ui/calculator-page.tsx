import { useState, useEffect } from 'react';
import { Container } from '@src/shared/ui/container';
import { Disclaimer } from './components/disclaimer';
import { JeonseLoanCalculator } from './components/jeonse-loan-calculator';
import { CarLoanCalculator } from './components/car-loan-calculator';
import { HousingLoanCalculator } from './components/housing-loan-calculator';
import { SavingsCalculator } from './components/savings-calculator';
import { LoanRepaymentCalculator } from './components/loan-repayment-calculator';
import { PensionCalculator } from './components/pension-calculator';
import { RealEstateFeeCalculator } from './components/real-estate-fee-calculator';
import { JeonseConversionCalculator } from './components/jeonse-conversion-calculator';
import { LoanLimitCalculator } from './components/loan-limit-calculator';
import { TaxCalculator } from './components/tax-calculator';
import { HousingSubscriptionCalculator } from './components/housing-subscription-calculator';
import { PersonalPensionCalculator } from './components/personal-pension-calculator';
import { IrpCalculator } from './components/irp-calculator';
import { InvestmentReturnCalculator } from './components/investment-return-calculator';
import { RealEstateRoiCalculator } from './components/real-estate-roi-calculator';
import { MonthlyRentConversionCalculator } from './components/monthly-rent-conversion-calculator';
import { LoanComparisonCalculator } from './components/loan-comparison-calculator';
import { RealEstateTaxCalculator } from './components/real-estate-tax-calculator';
import { HousingSubscriptionScoreCalculator } from './components/housing-subscription-score-calculator';
import { InflationCalculator } from './components/inflation-calculator';

type CalculatorTab = {
  id: string;
  label: string;
  component: React.ComponentType;
};

const calculatorTabs: CalculatorTab[] = [
  { id: 'jeonse-loan', label: '전세대출이자', component: JeonseLoanCalculator },
  { id: 'car-loan', label: '차량할부', component: CarLoanCalculator },
  { id: 'housing-loan', label: '주택대출 (DSR/LTV/DTI)', component: HousingLoanCalculator },
  { id: 'savings', label: '적금/예금', component: SavingsCalculator },
  { id: 'loan-repayment', label: '대출 상환', component: LoanRepaymentCalculator },
  { id: 'pension', label: '연금', component: PensionCalculator },
  { id: 'real-estate-fee', label: '부동산 중개수수료', component: RealEstateFeeCalculator },
  { id: 'jeonse-conversion', label: '전세 전환율', component: JeonseConversionCalculator },
  { id: 'loan-limit', label: '대출 한도', component: LoanLimitCalculator },
  { id: 'tax', label: '세금', component: TaxCalculator },
  { id: 'housing-subscription', label: '주택청약종합저축', component: HousingSubscriptionCalculator },
  { id: 'personal-pension', label: '개인연금저축', component: PersonalPensionCalculator },
  { id: 'irp', label: 'IRP', component: IrpCalculator },
  { id: 'investment-return', label: '복리/단리 투자', component: InvestmentReturnCalculator },
  { id: 'real-estate-roi', label: '부동산 ROI', component: RealEstateRoiCalculator },
  { id: 'monthly-rent-conversion', label: '월세 전환율', component: MonthlyRentConversionCalculator },
  { id: 'loan-comparison', label: '대출 비교', component: LoanComparisonCalculator },
  { id: 'real-estate-tax', label: '부동산 세금', component: RealEstateTaxCalculator },
  { id: 'housing-subscription-score', label: '주택청약 점수', component: HousingSubscriptionScoreCalculator },
  { id: 'inflation', label: '인플레이션', component: InflationCalculator },
];

export const CalculatorPage = () => {
  const [activeTab, setActiveTab] = useState<string>(calculatorTabs[0].id);

  useEffect(() => {
    const defaultTitle = 'Raven - Portfolio & Blog';
    document.title = '계산기 | Raven';
    return () => {
      document.title = defaultTitle;
    };
  }, []);

  const ActiveComponent = calculatorTabs.find((tab) => tab.id === activeTab)?.component || calculatorTabs[0].component;

  return (
    <Container size="lg" className="py-12 pb-32 min-h-screen">
      <div className="mb-8 text-center">
        <h1 className="mb-4 bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-3xl font-bold text-transparent sm:text-5xl">
          금융 계산기
        </h1>
        <p className="text-lg text-gray-400">다양한 금융 계산을 간편하게 해보세요</p>
      </div>

      <Disclaimer />

      <div className="mb-6">
        <div className="flex flex-wrap gap-2 overflow-x-auto pb-2">
          {calculatorTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg shadow-primary-500/50'
                  : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <ActiveComponent />
      </div>
    </Container>
  );
};

