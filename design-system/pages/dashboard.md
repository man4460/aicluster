# Dashboard Page Overrides

Use this file together with `design-system/MASTER.md`.
Rules here override the master only for dashboard-like pages.

## Page Goal

- Provide fast situational awareness with minimal cognitive load.
- Surface key actions and system status in one viewport on desktop.

## Layout Overrides

- Desktop:
  - left sidebar fixed width around `15-16rem`
  - top sticky glass header
  - content arranged in section blocks with `gap-3` to `gap-4`
- Tablet:
  - collapse sidebar to drawer
  - prioritize workspace width over persistent side navigation
- Mobile:
  - keep topbar compact
  - use bottom navigation for primary routes

## Component Priorities

- First paint order:
  1) header status
  2) quick actions
  3) module/service cards
  4) secondary insights
- Module cards:
  - must use shared surface classes
  - active and locked states require explicit visual differentiation

## Data Density Rules

- Desktop can show summary metrics and card grids together.
- Tablet should trim secondary text before removing primary actions.
- Mobile should show one clear action path per card row.

## Interaction Overrides

- Hover effects are additive only; never hide critical controls behind hover.
- Locked modules must always show lock or package context.
- Status chips should be short labels and never wrap.

