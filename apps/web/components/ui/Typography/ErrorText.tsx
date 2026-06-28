interface IErrorText {
  errorMessage: string;
}

export default function ErrorText({ errorMessage }: Readonly<IErrorText>) {
  return (
    <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
      {errorMessage}
    </p>
  );
}
