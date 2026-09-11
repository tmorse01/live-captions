interface PrivacyNoticeProps {
  className?: string;
}

export function PrivacyNotice({ className = '' }: PrivacyNoticeProps) {
  return (
    <p className={`px-4 text-center text-xs leading-relaxed text-[var(--color-text-muted)] ${className}`}>
      Audio is processed in real time and never stored. No account required.
    </p>
  );
}
