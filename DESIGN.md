# Design

## Design Language

Soft Tactility — a philosophy that blends digital efficiency with physical warmth. The aesthetic hybridizes Minimalism and Tactile Skeuomorphism: heavy whitespace, restricted palette, but brought to life through physical metaphors — paper-like surfaces, "pressed" states for inputs, and deep diffused shadows suggesting objects resting gently on a desk.

## Brand Personality

Clean, grounded, confident. Not playful or quirky. The product feels like premium stationery — calm, organized, and trustworthy.

## Colors

| Token | Hex | Usage |
|-------|-----|-------|
| primary | #45645e | Main actions, active states, brand presence |
| primary-container | #84a59d | Button backgrounds, focus rings |
| on-primary | #ffffff | Text on primary backgrounds |
| on-primary-container | #1b3b35 | Text on primary-container |
| background | #F7F5F0 | Page background (Bone — warm, paper-like) |
| surface | #f7f9ff | Neutral surface |
| surface-container-lowest | #ffffff | Elevated cards, modals |
| on-surface | #131d25 | Primary text (Slate — soft black) |
| on-surface-variant | #414846 | Secondary text, labels, placeholders |
| outline | #717976 | Borders, dividers |
| outline-variant | #c1c8c5 | Subtle borders |
| error | #ba1a1a | Error states (use sparingly) |
| error-container | #ffdad6 | Error backgrounds |

## Typography

**Font:** DM Sans (all weights: 400, 500, 600, 700)

| Style | Size | Line Height | Weight | Usage |
|-------|------|-------------|--------|-------|
| headline-xl | 40px | 48px | 700 | Hero headlines (letter-spacing: -0.02em) |
| headline-lg | 32px | 40px | 700 | Section headlines (letter-spacing: -0.01em) |
| headline-md | 24px | 32px | 700 | Card headlines |
| body-lg | 18px | 28px | 400 | Long-form body text |
| body-md | 16px | 24px | 400 | Default body text |
| label-md | 14px | 20px | 500 | Form labels, metadata |
| label-sm | 12px | 16px | 500 | Captions, tags (letter-spacing: 0.02em) |
| button | 15px | 20px | 600 | Button text |

## Elevation & Depth

Three levels of elevation, achieved through ambient shadows and tonal layers:

- **Level 0 (Base):** Bone (#F7F5F0) background. Elements appear etched or flat.
- **Level 1 (Cards):** White (#FFFFFF) surfaces with `shadow-soft` — extra-diffused shadow (0px 12px 32px) at 8% opacity using Slate tint.
- **Level 2 (Modals/Popovers):** Higher elevation with tighter, darker shadow.
- **Recessed (Inputs):** Form fields use 1px inner shadow to appear carved into surface.

Avoid harsh borders. Use tonal changes and shadows to define boundaries.

## Spacing

8px linear scale with 4px step for tight UI:

| Token | Value |
|-------|-------|
| xs | 4px |
| sm | 8px |
| base | 4px |
| md | 16px |
| lg | 24px |
| xl | 32px |
| 2xl | 48px |
| 3xl | 64px |

## Border Radius

| Element | Radius |
|---------|--------|
| Large containers (cards) | 24px |
| Buttons, inputs | 12px |
| Chips, tags | 9999px (pill) |
| Checkboxes | 4px |

## Shadows

| Token | Value |
|-------|-------|
| shadow-soft | 0px 12px 32px rgba(113, 121, 118, 0.08) |
| shadow-inner-soft | inset 0px 1px 3px rgba(113, 121, 118, 0.1) |
| shadow-glow-primary | 0 0 0 4px rgba(132, 165, 157, 0.2) |

## Components

- **Buttons:** Primary uses primary-container (#84a59d) with white text. Secondary uses white surface with shadow-soft. 600 weight typography. No heavy borders.
- **Input Fields:** 12px radius. Background #F7F5F0 (Bone). 1px inner shadow. On focus, primary ring with soft glow.
- **Cards:** White background, 24px radius, shadow-soft. Padding 24-32px.
- **Checkboxes:** Rounded-md (4px). When checked, pressed state with inner shadow.
- **Lists:** Items separated by whitespace, not hard lines.

## Anti-Patterns to Avoid

- No overused fonts (Arial, Inter, system defaults) — DM Sans only
- No gray text on colored backgrounds
- No pure black/always tint text
- No nested cards or cards-inside-cards
- No bounce/elastic easing (feels dated)
- No purple-to-blue gradients
- No rounded-square icon tiles above headings
