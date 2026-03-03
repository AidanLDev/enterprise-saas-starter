import React, { ButtonHTMLAttributes } from 'react';

interface IButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  type?: ButtonHTMLAttributes<HTMLButtonElement>['type'];
}

export default function Button(props: Readonly<IButtonProps>) {
  return (
    <div>
      <button
        type={props.type}
        disabled={props.disabled}
        className="w-full rounded-lg bg-zinc-900 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {props.children}
      </button>
    </div>
  );
}
