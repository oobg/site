import type { SVGProps } from 'react';

interface ArrowLeftIconProps extends SVGProps<SVGSVGElement> {
  className?: string;
}

export const ArrowLeftIcon = ({ className = 'h-4 w-4', ...props }: ArrowLeftIconProps) => (
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
      d="M15 19l-7-7 7-7"
    />
  </svg>
);
