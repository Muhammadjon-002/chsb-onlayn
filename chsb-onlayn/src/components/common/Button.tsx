import React, { ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  className = '',
  ...props
}) => {
  const variantStyles: Record<ButtonVariant, string> = {
    primary:
      'bg-blue-600 hover:bg-blue-700 text-white shadow-xs focus-visible:ring-2 focus-visible:ring-blue-500/50 active:bg-blue-800',
    secondary:
      'bg-slate-800 hover:bg-slate-900 text-white shadow-xs focus-visible:ring-2 focus-visible:ring-slate-500/50',
    outline:
      'border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs focus-visible:ring-2 focus-visible:ring-slate-300',
    danger:
      'bg-rose-600 hover:bg-rose-700 text-white shadow-xs focus-visible:ring-2 focus-visible:ring-rose-500/50',
    success:
      'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs focus-visible:ring-2 focus-visible:ring-emerald-500/50',
    ghost:
      'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 focus-visible:ring-2 focus-visible:ring-slate-200',
  };

  const sizeStyles: Record<ButtonSize, string> = {
    sm: 'px-3 py-1.5 text-xs font-medium rounded-md gap-1.5',
    md: 'px-4 py-2 text-sm font-medium rounded-lg gap-2',
    lg: 'px-5 py-2.5 text-base font-medium rounded-lg gap-2.5',
  };

  const isDisabled = disabled || isLoading;

  return (
    <button
      disabled={isDisabled}
      className={`inline-flex items-center justify-center transition-all cursor-pointer select-none font-sans outline-hidden ${
        variantStyles[variant]
      } ${sizeStyles[size]} ${isDisabled ? 'opacity-55 cursor-not-allowed shadow-none' : ''} ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          <span>{children}</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="shrink-0">{leftIcon}</span>}
          <span>{children}</span>
          {rightIcon && <span className="shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
};
