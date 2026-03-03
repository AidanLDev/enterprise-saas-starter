import React from 'react';

type TextElement = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span';
type TextVariant = 'heading' | 'body' | 'caption' | 'error';

interface TextProps {
  as?: TextElement;
  variant?: TextVariant;
  className?: string;
  children: React.ReactNode;
}

const variantStyles: Record<TextVariant, string> = {
  heading: 'text-2xl font-semibold text-zinc-900 dark:text-zinc-50',
  body: 'text-sm text-zinc-500 dark:text-zinc-400',
  caption: 'text-center text-sm text-zinc-500 dark:text-zinc-400',
  error: 'rounded bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400',
};

const defaultElement: Record<TextVariant, TextElement> = {
  heading: 'h1',
  body: 'p',
  caption: 'p',
  error: 'p',
};

export default function Text({ as, variant = 'body', className, children }: Readonly<TextProps>) {
  const Component = as ?? defaultElement[variant];
  const styles = [variantStyles[variant], className].filter(Boolean).join(' ');

  return <Component className={styles}>{children}</Component>;
}
