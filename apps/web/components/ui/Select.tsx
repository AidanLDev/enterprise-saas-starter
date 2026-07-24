import { ChangeEvent, ReactNode } from 'react';

interface ISelectOption {
  value: string;
  label: string;
}

interface ISelectProps {
  label?: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
  options: ISelectOption[];
  required?: boolean;
  disabled?: boolean;
  className?: string;
  children?: ReactNode;
}

export default function Select({
  label,
  value,
  onChange,
  options,
  required = false,
  disabled = false,
  className = 'w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50',
  children,
}: Readonly<ISelectProps>) {
  const select = (
    <select
      value={value}
      onChange={onChange}
      required={required}
      disabled={disabled}
      className={className}
    >
      {children ??
        options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
    </select>
  );

  if (!label) return select;

  return (
    <label className="block space-y-1">
      <span className="text-sm text-zinc-600 dark:text-zinc-400">{label}</span>
      {select}
    </label>
  );
}
