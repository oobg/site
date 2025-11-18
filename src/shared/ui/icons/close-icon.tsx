import type { SVGProps } from 'react';

interface CloseIconProps extends SVGProps<SVGSVGElement> {
  className?: string;
}

export const CloseIcon = ({ className = 'h-6 w-6', ...props }: CloseIconProps) => (
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
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);
