import { PlayIcon, StopIcon } from './icons';

interface ControlBarProps {
  isActive: boolean;
  disabled?: boolean;
  canDecreaseTextSize: boolean;
  canIncreaseTextSize: boolean;
  onStart: () => void;
  onStop: () => void;
  onDecreaseTextSize: () => void;
  onIncreaseTextSize: () => void;
}

function FontSizeButton({
  label,
  sublabel,
  onClick,
  disabled,
}: {
  label: string;
  sublabel: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="flex h-14 w-14 items-center justify-center rounded-full text-lg font-medium transition-opacity hover:opacity-90 disabled:opacity-40"
        style={{
          backgroundColor: 'var(--color-control-bg)',
          color: 'var(--color-control-text)',
        }}
        aria-label={sublabel}
      >
        {label}
      </button>
      <span className="text-xs text-[var(--color-subtle)]">{sublabel}</span>
    </div>
  );
}

export function ControlBar({
  isActive,
  disabled,
  canDecreaseTextSize,
  canIncreaseTextSize,
  onStart,
  onStop,
  onDecreaseTextSize,
  onIncreaseTextSize,
}: ControlBarProps) {
  return (
    <footer
      className="flex items-end justify-center gap-10 px-6 pb-8 pt-4"
      style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}
    >
      <FontSizeButton
        label="A−"
        sublabel="Smaller"
        onClick={onDecreaseTextSize}
        disabled={!canDecreaseTextSize}
      />

      <div className="flex flex-col items-center gap-1.5">
        <button
          type="button"
          onClick={isActive ? onStop : onStart}
          disabled={disabled}
          className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full bg-[#ea4335] text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          aria-label={isActive ? 'Stop captioning' : 'Start captioning'}
        >
          {isActive ? <StopIcon /> : <PlayIcon />}
        </button>
        <span className="text-xs text-[var(--color-subtle)]">{isActive ? 'Stop' : 'Start'}</span>
      </div>

      <FontSizeButton
        label="A+"
        sublabel="Larger"
        onClick={onIncreaseTextSize}
        disabled={!canIncreaseTextSize}
      />
    </footer>
  );
}
