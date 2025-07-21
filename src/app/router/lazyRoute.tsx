import { type FC, type LazyExoticComponent, type ReactNode, Suspense } from "react";

export function lazyElement(LazyComp: LazyExoticComponent<FC>, fallback?: ReactNode) {
    return <Suspense fallback={fallback || <div>로딩중입니다...</div>}><LazyComp /></Suspense>;
}
