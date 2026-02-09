import * as React from 'react'

import { cn } from '@/shared/lib/utils'

const buttonVariants = {
  variant: {
    default:
      'bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring',
    outline:
      'border border-input bg-background hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring',
    link: 'text-primary underline-offset-4 hover:underline',
  },
  size: {
    default: 'h-10 px-4 py-2',
    sm: 'h-9 rounded-md px-3',
    lg: 'h-11 rounded-md px-8',
    icon: 'h-10 w-10',
  },
}

const buttonClass =
  'inline-flex items-center justify-center whitespace-nowrap rounded-[var(--radius)] text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50'

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof buttonVariants.variant
  size?: keyof typeof buttonVariants.size
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = 'default', size = 'default', asChild, ...props },
    ref
  ) => {
    const compClass = cn(
      buttonClass,
      buttonVariants.variant[variant],
      buttonVariants.size[size],
      className
    )
    if (asChild && React.isValidElement(props.children)) {
      const child = props.children as React.ReactElement<{ className?: string }>
      return React.cloneElement(child, {
        className: cn(compClass, child.props?.className),
      })
    }
    return <button ref={ref} className={compClass} {...props} />
  }
)
Button.displayName = 'Button'

export { Button }
