## Design System — Neubrutalism (warm/playful)

Always follow this design system for any UI, component, or page you build in this project, unless I explicitly say otherwise for a specific task.

### Colors
- Background: #F0EBDD (cream)
- Accent primary: #DC2626 (red)
- Accent secondary: #F5B942 (mustard)
- Text/borders: #111111 (near-black)

### Typography
- Headings: Archivo Black, all caps, bold, condensed feel
- Accent/callout phrases: Instrument Serif, italic — use sparingly for personality
- Body text: Inter, regular weight
- Load fonts via Google Fonts

### Shape & depth
- Borders: 2-3px solid black on buttons, cards, badges, inputs — nothing borderless
- Shadows: flat offset only, no blur — box-shadow: 4px 4px 0px #111111
- Corners: small-medium border-radius (not sharp, not pill-shaped)
- Optional: slight rotation (1-3deg) on image/card elements for a collage feel

### Interaction & motion
- Buttons: on hover, shift 2-3px toward the shadow and shrink the shadow to 0 (pressed effect); on click, shadow fully disappears
- Cards: on hover, lift up 2-3px and grow the shadow slightly; if tilted, optionally rotate toward 0deg
- Links: no underline by default; underline draws in on hover, or an arrow icon nudges right
- Scroll reveal: fade + slide-up as sections enter viewport
- Keep all transitions fast: 120-200ms, no soft/floaty easing

### Icons
- Use Phosphor Icons (outline weight) for standard icons
- Use Fluent Emoji (3D style) where a friendlier/playful icon fits better

### Reference
- Component structure reference: neobrutalism.dev (shadcn/ui-based) — match this button/card/badge structure and adapt colors to the palette above
