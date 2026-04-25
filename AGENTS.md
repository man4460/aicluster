<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Chat AI / dashboard sidebar (MAWELL)

- **Canonical chat URL:** `/dashboard/chat-ai` only in `<Link>` / nav items; use `canonicalDashboardNavHref()` in `DashboardShell` for sidebar links.
- **Shared layout classes:** `src/systems/chat/personal-ai-chat-shell.ts` — do not duplicate Tailwind strings between `chat-ai-client` skeleton and `PersonalAiChat` / `PersonalAiDailyDigest`.

Details: `CHAT_AI_CODE_FOR_REVIEW.md` §1.1.
