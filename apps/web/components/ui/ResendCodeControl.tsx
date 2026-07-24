import Button from '@/components/ui/Button';
import Text from '@/components/ui/Typography/Text';

interface IResendCodeControlProps {
  countdown: number;
  resending: boolean;
  onResend: () => void;
}

export default function ResendCodeControl({
  countdown,
  resending,
  onResend,
}: Readonly<IResendCodeControlProps>) {
  return (
    <Text variant="caption">
      {countdown > 0 ? (
        <>Resend code in {countdown}s</>
      ) : (
        <Button
          type="button"
          variant="link"
          fullWidth={false}
          disabled={resending}
          onClick={onResend}
          className="cursor-pointer"
        >
          {resending ? 'Resending…' : 'Resend code'}
        </Button>
      )}
    </Text>
  );
}
