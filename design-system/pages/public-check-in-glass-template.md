# Public Check-in Glass Template

Reusable glassmorphism template for public check-in flows (car wash, QR landing, and other member self-service pages).

## Source of truth

- `src/components/app-templates/AppPublicCheckInGlassTemplate.tsx`
- Exported via `src/components/app-templates/index.ts`

## Use in any module

```tsx
import {
  AppPublicCheckInGlassPage,
  appPublicCheckInGlassCardClass,
} from "@/components/app-templates";
```

```tsx
<AppPublicCheckInGlassPage>
  <div className="relative mx-auto max-w-md space-y-4">
    <section className={appPublicCheckInGlassCardClass}>
      {/* search / QR / status content */}
    </section>
  </div>
</AppPublicCheckInGlassPage>
```

## Design tokens (visual intent)

- **Page shell**: soft violet radial background + blurred blobs.
- **Card shell**: rounded `2rem`, translucent white gradient, border + ring, backdrop blur.
- **Tone**: violet/indigo primary with emerald/amber for status feedback.

## Notes

- Keep interaction logic in feature files; only move shared visual shell and layout tokens here.
- For QR variants, reuse this shell and swap inner cards (QR actions, links, posters).
