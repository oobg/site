/* eslint-disable jsx-a11y/label-has-associated-control, react/no-array-index-key */
import { useState, useMemo } from 'react';
import { Card } from '@src/shared/ui/card';
import {
  formatCurrency,
  formatCurrencyKorean,
  formatNumberInput,
  parseNumberInput,
} from '@src/shared/utils/number';
import { Disclaimer } from './disclaimer';

interface LoanProduct {
  name: string;
  loanAmount: number;
  interestRate: number;
  period: number;
}

export const LoanComparisonCalculator = () => {
  const [products, setProducts] = useState<LoanProduct[]>([
    {
      name: '대출 상품 1',
      loanAmount: 100000000,
      interestRate: 4.0,
      period: 240,
    },
    {
      name: '대출 상품 2',
      loanAmount: 100000000,
      interestRate: 3.8,
      period: 240,
    },
  ]);

  const results = useMemo(() => products.map((product) => {
    if (!product.loanAmount || !product.interestRate || !product.period) {
      return null;
    }

    const monthlyRate = product.interestRate / 100 / 12;
    const monthlyPayment = (product.loanAmount * monthlyRate * (1 + monthlyRate) ** product.period)
        / ((1 + monthlyRate) ** product.period - 1);
    const totalPayment = monthlyPayment * product.period;
    const totalInterest = totalPayment - product.loanAmount;

    return {
      ...product,
      monthlyPayment,
      totalPayment,
      totalInterest,
    };
  }).filter((r) => r !== null), [products]);

  const updateProduct = (index: number, field: keyof LoanProduct, value: string | number) => {
    const newProducts = [...products];
    newProducts[index] = {
      ...newProducts[index],
      [field]: value,
    };
    setProducts(newProducts);
  };

  const addProduct = () => {
    setProducts([...products, {
      name: `대출 상품 ${products.length + 1}`, loanAmount: 100000000, interestRate: 4.0, period: 240,
    }]);
  };

  const removeProduct = (index: number) => {
    if (products.length > 1) {
      setProducts(products.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="space-y-6">
      <Disclaimer />
      <Card>
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-xl font-semibold">대출 이자 비교 계산</h3>
          <button
            type="button"
            onClick={addProduct}
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm text-white hover:bg-primary-700"
          >
            + 상품 추가
          </button>
        </div>
        <div className="space-y-6">
          {products.map((product, index) => (
            <div key={`product-${index}`} className="rounded-lg border border-gray-700 bg-gray-800/30 p-4">
              <div className="mb-4 flex items-center justify-between">
                <input
                  type="text"
                  value={product.name}
                  onChange={(e) => updateProduct(index, 'name', e.target.value)}
                  className="flex-1 rounded-lg bg-gray-800/50 px-3 py-2 text-white focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="대출 상품명"
                />
                {products.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeProduct(index)}
                    className="ml-2 rounded-lg bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700"
                  >
                    삭제
                  </button>
                )}
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <label className="block text-sm font-medium text-gray-300">
                      대출금액 (원)
                    </label>
                    {product.loanAmount > 0 && (
                      <span className="text-sm text-gray-500">
                        {formatCurrencyKorean(product.loanAmount)}
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={formatNumberInput(product.loanAmount)}
                    onChange={(e) => updateProduct(index, 'loanAmount', parseNumberInput(e.target.value))}
                    className="w-full rounded-lg bg-gray-800/50 px-4 py-2 text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    금리 (%)
                  </label>
                  <input
                    type="text"
                    value={formatNumberInput(product.interestRate)}
                    onChange={(e) => updateProduct(index, 'interestRate', parseNumberInput(e.target.value))}
                    className="w-full rounded-lg bg-gray-800/50 px-4 py-2 text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    기간 (개월)
                  </label>
                  <input
                    type="text"
                    value={formatNumberInput(product.period)}
                    onChange={(e) => updateProduct(index, 'period', parseNumberInput(e.target.value))}
                    className="w-full rounded-lg bg-gray-800/50 px-4 py-2 text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {results.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2">
          {results.map((result, index) => (
            result && (
              <Card key={`result-${index}`} className="bg-gradient-to-br from-primary-600/20 to-primary-700/20">
                <h3 className="mb-4 text-lg font-semibold">{result.name}</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-300">월 상환액</span>
                    <div className="flex flex-col items-end">
                      <span className="text-xl font-bold text-primary-300">
                        {formatCurrency(result.monthlyPayment)}
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatCurrencyKorean(result.monthlyPayment)}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">총 상환액</span>
                    <div className="flex flex-col items-end">
                      <span className="text-xl font-bold text-primary-300">
                        {formatCurrency(result.totalPayment)}
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatCurrencyKorean(result.totalPayment)}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">총 이자</span>
                    <div className="flex flex-col items-end">
                      <span className="text-xl font-bold text-primary-300">
                        {formatCurrency(result.totalInterest)}
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatCurrencyKorean(result.totalInterest)}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            )
          ))}
        </div>
      )}
    </div>
  );
};
