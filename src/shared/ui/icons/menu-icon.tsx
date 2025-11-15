import type { SVGProps } from 'react';

interface MenuIconProps extends SVGProps<SVGSVGElement> {
  className?: string;
}

export const MenuIcon = ({ className = 'h-6 w-6', ...props }: MenuIconProps) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 6h16M4 12h16M4 18h16"
    />
  </svg>
);
