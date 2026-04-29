# Module Launcher Overrides

Use this file with `design-system/MASTER.md` for launcher pages.

## Page Goal

- Let users identify available modules instantly.
- Encourage conversion for locked modules without harming clarity.

## Responsive Behavior

- Desktop (`>=1024`):
  - multi-column buffet grid
  - visible section split: active vs locked
  - support quick scanning with icon, title, status, and CTA
- Tablet (`768-1023`):
  - 2-column or adaptive grid
  - locked section can use horizontal snap for shorter page height
- Mobile (`<768`):
  - list-first or compact card stack
  - one thumb reachable controls
  - fixed bottom navigation

## State Definitions

- Active:
  - high contrast text
  - bright icon background or gradient
  - direct action such as "Open System"
- Locked:
  - frosted/softened surface
  - lock indicator and package CTA
  - clear unlock context (price, plan, or benefit)

## CTA Rules

- Active card CTA should be immediate and prominent.
- Locked card CTA should be secondary but always visible.
- Keep CTA wording short and action-oriented.

## Content Rules

- Module name max 1-2 lines.
- Secondary description optional on mobile if it causes clutter.
- Badges should indicate state, not repeat module names.

