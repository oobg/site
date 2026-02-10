import type { ComponentProps } from "react";
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
  if (PREPARING_ROUTES.includes(to)) {
    const { replace: _r, state: _s, ...buttonRest } = rest;
    return (
      <button
        type="button"
        {...buttonRest}
        onClick={(e) => {
          const label = PREPARING_ROUTE_LABELS[to] ?? "이 페이지";
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
