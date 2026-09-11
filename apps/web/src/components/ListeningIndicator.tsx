interface ListeningIndicatorProps {
  active: boolean;
}

export function ListeningIndicator({ active }: ListeningIndicatorProps) {
  if (!active) {
    return <div className="h-6 w-6" aria-hidden="true" />;
  }

  return (
    <div
      className="flex h-6 items-end gap-0.5"
      role="img"
      aria-label="Listening"
    >
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className="waveform-bar w-1 rounded-full bg-[var(--color-accent)]"
          style={{
            height: '100%',
            animationDelay: `${i * 0.12}s`,
          }}
        />
      ))}
    </div>
  );
}
