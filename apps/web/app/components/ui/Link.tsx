import React from 'react';
import NextLink from 'next/link';

interface ILinkProps {
  href: string;
  children: React.ReactNode;
}

export default function Link(props: Readonly<ILinkProps>) {
  return (
    <NextLink
      href={props.href}
      className="text-right text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 underline"
    >
      {props.children}
    </NextLink>
  );
}
