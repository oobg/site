export const Disclaimer = () => (
  <div className="mb-6 rounded-lg border-2 border-yellow-500/50 bg-yellow-500/10 p-4 backdrop-blur-sm">
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-2xl">⚠️</div>
      <div className="flex-1">
        <p className="text-sm font-medium text-yellow-300">
          본 계산기는 참고용이며, 실제 계산 결과와 다를 수 있습니다.
        </p>
        <p className="mt-1 text-xs text-yellow-400/80">
          정확한 계산은 관련 기관(은행, 부동산 중개업소, 세무서 등)에 문의하시기 바랍니다.
        </p>
      </div>
    </div>
  </div>
);

