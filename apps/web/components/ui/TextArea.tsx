import { ChangeEvent } from 'react';

interface ITextAreaProps {
  label: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  rows?: number;
}

export default function TextArea({
  label,
  value,
  onChange,
  placeholder = '',
  required = false,
  disabled = false,
  rows = 3,
}: Readonly<ITextAreaProps>) {
  return (
    <>
      <label className="block space-y-1">
        <span className="text-sm text-zinc-600 dark:text-zinc-400">{label}</span>
        <textarea
          value={value}
          onChange={onChange}
          rows={rows}
          disabled={disabled}
          required={required}
          placeholder={placeholder}
          className="w-full resize-none rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition-colors focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500"
        />
      </label>
    </>
  );
}
