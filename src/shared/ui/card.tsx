import { type HTMLAttributes, forwardRef } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ hover = false, className = '', children, ...props }, ref) => {
    const baseStyles = 'rounded-lg bg-gray-800 p-6 border border-gray-700';
    const hoverStyles = hover ? 'transition-transform hover:scale-105 hover:shadow-lg' : '';

    return (
      <div ref={ref} className={`${baseStyles} ${hoverStyles} ${className}`} {...props}>
        {children}
      </div>
    );
  },
);

Card.displayName = 'Card';

