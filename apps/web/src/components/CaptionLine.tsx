interface CaptionLineProps {
  text: string;
  isFinal: boolean;
}

export function CaptionLine({ text, isFinal }: CaptionLineProps) {
  return (
    <p
      className={`leading-[var(--caption-line-height)] transition-opacity duration-150 ${
        isFinal ? 'opacity-100' : 'italic opacity-70'
      }`}
      style={{
        fontSize: 'var(--caption-font-size)',
        color: isFinal ? 'var(--color-text)' : 'var(--color-interim)',
      }}
    >
      {text}
    </p>
  );
}
