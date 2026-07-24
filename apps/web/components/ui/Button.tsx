import React, { ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'link';
type ButtonSize = 'sm' | 'md';

interface IButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  type?: ButtonHTMLAttributes<HTMLButtonElement>['type'];
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
  'aria-label'?: string;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200',
  secondary:
    'border border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800',
  danger:
    'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-900/40',
  ghost:
    'text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300',
  link: 'font-medium text-zinc-900 hover:underline dark:text-zinc-50 dark:hover:text-zinc-200',
};

const sizeClasses: Record<ButtonVariant, Record<ButtonSize, string>> = {
  primary: { sm: 'px-3 py-1.5 text-xs', md: 'py-2 text-sm' },
  secondary: { sm: 'px-3 py-1.5 text-xs', md: 'py-2 text-sm' },
  danger: { sm: 'px-2 py-1 text-xs', md: 'py-2 text-sm' },
  ghost: { sm: 'h-7 w-7 text-xs', md: 'h-9 w-9 text-sm' },
  link: { sm: 'text-xs', md: 'text-sm' },
};

export default function Button({
  onClick,
  disabled,
  children,
  type,
  variant = 'primary',
  size = 'md',
  fullWidth = variant === 'primary',
  className = '',
  ...rest
}: Readonly<IButtonProps>) {
  const isIconOnly = variant === 'ghost';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={rest['aria-label']}
      className={`inline-flex items-center justify-center rounded-lg font-medium transition-colors disabled:opacity-50 ${
        variantClasses[variant]
      } ${sizeClasses[variant][size]} ${fullWidth ? 'w-full' : ''} ${
        isIconOnly ? 'rounded-md' : ''
      } ${className}`.trim()}
    >
      {children}
    </button>
  );
}
