import type { SVGProps } from 'react';

interface ArrowUpIconProps extends SVGProps<SVGSVGElement> {
  className?: string;
}

export const ArrowUpIcon = ({ className = 'h-6 w-6', ...props }: ArrowUpIconProps) => (
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
      d="M5 10l7-7m0 0l7 7m-7-7v18"
    />
  </svg>
);
