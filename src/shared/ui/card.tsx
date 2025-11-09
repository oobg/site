import { type HTMLAttributes, forwardRef } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({
    hover = false, className = '', children, ...props
  }, ref) => {
    const baseStyles = 'rounded-lg p-6 glass-card';
    const hoverStyles = hover ? '' : '';

    return (
      <div ref={ref} className={`${baseStyles} ${hoverStyles} ${className}`} {...props}>
        {children}
      </div>
    );
  },
);

Card.displayName = 'Card';
