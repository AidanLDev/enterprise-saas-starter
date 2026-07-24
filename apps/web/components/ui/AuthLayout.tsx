import { ReactNode, Suspense } from 'react';
import Text from '@/components/ui/Typography/Text';

interface IAuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: Readonly<IAuthLayoutProps>) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <Suspense fallback={<Text variant="body">Loading…</Text>}>{children}</Suspense>
    </div>
  );
}
