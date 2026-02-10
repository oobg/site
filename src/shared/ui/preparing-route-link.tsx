import type { ButtonHTMLAttributes, ComponentProps } from "react";
import { Link } from "react-router-dom";

import {
  PREPARING_ROUTE_LABELS,
  PREPARING_ROUTES,
} from "@/shared/config/routes";
import { toast } from "@/shared/lib/toast";

type PreparingRouteLinkProps = ComponentProps<typeof Link>;

export function PreparingRouteLink({
  to,
  children,
  onClick,
  ...rest
}: PreparingRouteLinkProps) {
  const toStr = typeof to === "string" ? to : to?.pathname ?? "";
  if (PREPARING_ROUTES.includes(toStr)) {
    // replace, state, type, ref는 Link/anchor 전용이라 button에 넘기지 않음
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- 구조 분해로 제외만 함
    const { replace: _r, state: _s, type: _t, ref: _ref, ...buttonRest } = rest;
    return (
      <button
        {...(buttonRest as ButtonHTMLAttributes<HTMLButtonElement>)}
        type="button"
        onClick={e => {
          const label = PREPARING_ROUTE_LABELS[toStr] ?? "이 페이지";
          toast(`${label}는 준비 중입니다.`);
          onClick?.(e as unknown as React.MouseEvent<HTMLAnchorElement>);
        }}
      >
        {children}
      </button>
    );
  }
  return (
    <Link to={to} onClick={onClick} {...rest}>
      {children}
    </Link>
  );
}
