interface IconProps {
  className?: string;
}

export function SettingsIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  );
}

export function StopIcon({ className }: IconProps) {
  return (
    <svg className={className} width="28" height="28" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="6" y="6" width="12" height="12" rx="1" fill="currentColor" />
    </svg>
  );
}

export function PlayIcon({ className }: IconProps) {
  return (
    <svg className={className} width="28" height="28" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 5v14l11-7z" fill="currentColor" />
    </svg>
  );
}
