import { ReactNode, SubmitEvent } from 'react';

interface IAuthCardProps {
  onSubmit: (e: SubmitEvent<HTMLFormElement>) => void;
  children: ReactNode;
}

export default function AuthCard({ onSubmit, children }: Readonly<IAuthCardProps>) {
  return (
    <form
      onSubmit={onSubmit}
      className="w-full max-w-sm space-y-6 rounded-xl bg-white p-8 shadow dark:bg-zinc-900"
    >
      {children}
    </form>
  );
}
