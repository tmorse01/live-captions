interface ClearCaptionsButtonProps {
  onClear: () => void;
}

export function ClearCaptionsButton({ onClear }: ClearCaptionsButtonProps) {
  return (
    <div className="flex justify-center px-4 pb-2">
      <button
        type="button"
        onClick={onClear}
        className="min-h-[44px] px-4 text-sm text-[var(--color-subtle)] underline hover:text-[var(--color-text)] focus:outline-none focus-visible:ring-2"
      >
        Clear captions
      </button>
    </div>
  );
}
