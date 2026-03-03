import { InputHTMLAttributes } from 'react';

interface IInputProps {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: InputHTMLAttributes<HTMLInputElement>['type'];
  required?: boolean;
  disabled?: boolean;
}

export default function Input(props: Readonly<IInputProps>) {
  return (
    <>
      <label className="block space-y-1" htmlFor={`${props.label}-input`}>
        <span className="text-sm text-zinc-600 dark:text-zinc-400">{props.label}</span>
        <input
          id={`${props.label}-input`}
          type={props.type}
          required={props.required}
          value={props.value}
          onChange={props.onChange}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
        />
      </label>
    </>
  );
}
