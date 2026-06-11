# SilverConnect Global — Elder-First UI/UX Design System

## Core Philosophy
Every pixel serves seniors 60+. "If grandpa can't use it in 3 taps, redesign it."

## Typography
| Element | Size | Weight | Usage |
|---------|------|--------|-------|
| Body | 20px (1.25rem) | Regular | All readable text |
| Subheading | 26px (1.625rem) | Semibold | Section headers |
| Heading | 32px (2rem) | Bold | Page titles |
| CTA Button | 32px (2rem) | Bold | Primary actions |

## Touch Targets
- **Minimum:** 56px × 56px (industry standard: 44px)
- **Buttons:** 64px height minimum
- **Emergency button:** 72px, pulsing red
- **Spacing between targets:** 12px minimum

## Color & Contrast
- WCAG AAA: 7:1 minimum contrast ratio
- Primary: Blue #1E40AF (on white = 8.6:1)
- Emergency: Red #DC2626
- Success: Green #16A34A
- No light grey text ever

## Layout Rules
- Maximum 3 actions per screen
- Bottom navigation (4 icons with text labels, thumb-reachable)
- Full-width buttons (no small inline links)
- Labels always above inputs (never floating)
- No dropdowns — use full-width tap buttons instead

## Interaction Design
- No swipe gestures required
- No hover states (touch-only)
- No double-tap required
- Single tap everywhere
- 10-second undo window for destructive actions
- 4-hour session timeout (industry: 30min)

## Emergency UX
- Panic button always visible (72px, red, pulsing)
- Never hidden behind menus
- One-tap activation → 10s cancel window → auto-dispatch
- Full-screen red overlay during countdown

## Cognitive Load
- Plain language (Grade 6 reading level)
- Step-by-step wizards (one question per step)
- Progress bar on multi-step flows
- Large confirmation messages
- Haptic + visual + audio feedback

## CSS Custom Properties
```css
:root {
  --font-elder-body: 1.25rem;    /* 20px */
  --font-elder-sub: 1.625rem;    /* 26px */
  --font-elder-heading: 2rem;    /* 32px */
  --font-elder-cta: 2rem;        /* 32px */
  --touch-min: 56px;
  --touch-button: 64px;
  --touch-emergency: 72px;
  --spacing-target: 12px;
  --radius-elder: 16px;
  --session-timeout: 14400000;   /* 4 hours in ms */
  --undo-window: 10000;          /* 10 seconds in ms */
}
```

## Tailwind Extensions
```
text-elder-body: 20px/1.5
text-elder-subheading: 26px/1.3
text-elder-heading: 32px/1.2
text-elder-cta: 32px/1.2
text-elder-small: 18px/1.4
```
