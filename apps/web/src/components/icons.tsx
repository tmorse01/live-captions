import {
  Captions as LucideCaptions,
  Loader2 as LucideLoader2,
  Mic as LucideMic,
  Play as LucidePlay,
  Settings as LucideSettings,
  Square as LucideSquare,
  WifiOff as LucideWifiOff,
  X as LucideX,
  type LucideProps,
} from 'lucide-react';

interface IconProps {
  className?: string;
}

const iconDefaults: Pick<LucideProps, 'aria-hidden' | 'strokeWidth'> = {
  'aria-hidden': true,
  strokeWidth: 2,
};

export function BrandMark({ className, size = 20 }: IconProps & { size?: number }) {
  return <LucideCaptions className={className} size={size} {...iconDefaults} />;
}

export function SettingsIcon({ className }: IconProps) {
  return <LucideSettings className={className} size={24} {...iconDefaults} />;
}

export function PlayIcon({ className }: IconProps) {
  return (
    <LucidePlay
      className={className}
      size={28}
      fill="currentColor"
      stroke="currentColor"
      {...iconDefaults}
    />
  );
}

export function StopIcon({ className }: IconProps) {
  return (
    <LucideSquare
      className={className}
      size={28}
      fill="currentColor"
      stroke="currentColor"
      {...iconDefaults}
    />
  );
}

export function CloseIcon({ className }: IconProps) {
  return <LucideX className={className} size={24} {...iconDefaults} />;
}

export function LoadingIcon({ className }: IconProps) {
  return (
    <LucideLoader2 className={`icon-spin ${className ?? ''}`} size={28} {...iconDefaults} />
  );
}

export function MicIcon({ className, size = 24 }: IconProps & { size?: number }) {
  return <LucideMic className={className} size={size} {...iconDefaults} />;
}

export function WifiOffIcon({ className, size = 24 }: IconProps & { size?: number }) {
  return <LucideWifiOff className={className} size={size} {...iconDefaults} />;
}
