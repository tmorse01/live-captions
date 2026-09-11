interface StartStopButtonProps {
  isActive: boolean;
  disabled?: boolean;
  onStart: () => void;
  onStop: () => void;
}

export function StartStopButton({ isActive, disabled, onStart, onStop }: StartStopButtonProps) {
  return (
    <button
      type="button"
      onClick={isActive ? onStop : onStart}
      disabled={disabled}
      className="flex min-h-[56px] min-w-[120px] items-center justify-center rounded-full px-8 py-4 text-lg font-semibold text-white transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 disabled:opacity-50"
      style={{
        backgroundColor: isActive ? 'var(--color-error)' : 'var(--color-accent)',
      }}
      aria-label={isActive ? 'Stop captioning' : 'Start captioning'}
    >
      {isActive ? 'Stop' : 'Start'}
    </button>
  );
}
