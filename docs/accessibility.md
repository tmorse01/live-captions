# Accessibility

Live Captions is built accessibility-first because accessibility is the product's core purpose.

## Implemented features

- **ARIA live regions:** Finalized captions in a static region; interim caption in `aria-live="polite"`
- **Error alerts:** `role="alert"` with `aria-live="assertive"` for fatal errors
- **Skip link:** Keyboard users can jump directly to the caption area
- **Focus indicators:** Visible `:focus-visible` outlines on all interactive elements
- **Touch targets:** Minimum 44×48px on buttons and settings controls
- **Settings dialog:** Focus moves to close button on open; Escape to dismiss
- **Themes:** Light, dark, and high-contrast modes
- **Text scaling:** Ten caption size steps (1–10) via CSS variables, with extra-large sizes for small phones
- **Reduced motion:** Respects `prefers-reduced-motion`
- **Semantic HTML:** Proper headings, labels, fieldsets, and button types
- **Screen reader status:** Connection and session state announced via live region

## Testing checklist

- [ ] VoiceOver (iOS Safari)
- [ ] TalkBack (Android Chrome)
- [ ] NVDA/JAWS (desktop)
- [ ] Keyboard-only navigation
- [ ] 200% browser zoom
- [ ] High-contrast theme verification
