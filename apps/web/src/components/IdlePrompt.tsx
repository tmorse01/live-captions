import { MicIcon } from './icons';

export function IdlePrompt() {
  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      <MicIcon size={32} className="text-[var(--color-accent)]" />
      <p className="text-base text-[var(--color-subtle)]">Tap Start to begin captioning</p>
      <p className="text-sm text-[var(--color-subtle)]">Open app → Start captions → Read</p>
    </div>
  );
}
