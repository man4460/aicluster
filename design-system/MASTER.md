# Mawell Design System Master

This is the single source of truth for UI/UX decisions in this project.

## Product Context

- Product: Mawell multi-module dashboard and service systems
- Platforms: desktop, tablet, mobile web
- UX direction: modern glass surfaces with soft enterprise readability
- Design language: Glassmorphism + Soft UI Evolution
- Primary gradient direction: blue to violet to pink (same direction as primary CTA)

## Core Principles

- Clarity first: always prioritize information hierarchy over decoration.
- Consistent surfaces: cards, panels, and headers must use shared glass tokens.
- Touch-ready interactions: desktop hover and mobile tap states must both be explicit.
- Progressive density: desktop can show more at once; mobile shows critical actions first.
- Accessibility baseline: visible focus, readable contrast, and reduced motion support.

## Breakpoints

- Mobile: `375` to `<768`
- Tablet: `768` to `<1024`
- Desktop: `1024+`
- XL desktop layout target: `1440`

## Tokens (Mapped to `src/app/globals.css`)

### Color Tokens

- `--background`: `#f7f6ff`
- `--foreground`: `#1e1b3a`
- `--surface`: `#ffffffcc`
- `--surface-strong`: `#ffffff`
- `--surface-border`: `#d8d9ff`
- `--ring-soft`: `#8b90ff66`
- `--brand-600`: `#5b61ff`
- `--brand-500`: `#7a7eff`
- `--brand-400`: `#9a9dff`
- `--banner-bg`: gradient token for notices and helper banners
- `--banner-border`: `#e6cbff`
- `--banner-text`: `#5a2a85`

### Effect Tokens

- `--soft-shadow`: `0 10px 30px -18px rgba(76, 58, 180, 0.28)`
- `--mawell-page-gradient`: primary page background stack
- `--mawell-card-gradient`: default card surface
- `--mawell-glass-border`: default glass border
- `--mawell-glass-highlight`: glass highlight overlay

## Shared Utility Classes

- `.mawell-card-surface`: default card for modules and widgets
- `.mawell-card-frame`: frame-only glass container
- `.mawell-glass-panel`: topbar/sidebar glass panel
- `.app-surface`, `.app-surface-strong`: reusable app cards
- `.app-gradient-text`: highlighted heading text
- `.app-btn-primary`, `.app-btn-soft`: button system
- `.app-input`: input field system
- `.app-banner`: info/warn banner container

## Layout Rules

- Top header remains sticky on dashboard pages.
- Left sidebar appears from desktop breakpoint and is hidden on mobile.
- Core workspace uses card surfaces and section headers with consistent spacing.
- Mobile uses bottom navigation for one-hand operation on high-frequency routes.

## Interaction Rules

- Buttons and links must include hover, active, and focus-visible states.
- Transition duration target: `150-300ms` for micro-interactions.
- Clickable containers must use clear affordance (`cursor-pointer`, hover highlight).
- Avoid animation-only feedback; always include color or elevation change.

## Typography

- Primary font: `Noto Sans Thai` (loaded via Next font variable)
- Fallback: `ui-sans-serif`, `system-ui`, `sans-serif`
- Headings must stay compact with high contrast.
- Body text color should stay within `foreground` and muted variants only.

## Accessibility Checklist

- Contrast target: WCAG AA minimum for text and controls
- Focus rings visible on keyboard navigation
- Respect `prefers-reduced-motion` where motion is significant
- Ensure touch targets are at least 40px in mobile contexts
- Avoid relying on color only for status meaning

## Anti-Patterns

- Hard-coded random color values in component-level CSS
- New one-off shadows when tokenized shadows already exist
- Divergent border radius scales between pages without rationale
- Hidden actions on mobile that require hover to access
- Deep nested card styles that bypass shared surface classes

