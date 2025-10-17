import type { ReactNode, ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  className?: string;
}

// test commit
export function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonProps) {
  const baseClasses =
    "font-medium rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-accent/50";

  const variantClasses = {
    primary:
      "bg-gradient-to-r from-accent to-accent-hover text-white hover:shadow-lg hover:-translate-y-0.5",
    secondary:
      "bg-background-secondary text-text-secondary hover:text-accent hover:bg-background-tertiary",
    outline: "border border-accent text-accent hover:bg-accent hover:text-white",
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2",
    lg: "px-6 py-3 text-lg",
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
