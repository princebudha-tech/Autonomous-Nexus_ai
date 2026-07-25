---
name: NEXUS stack decisions
description: Key architectural decisions for the NEXUS AI OS project that must stay consistent.
---

## Rules

- **Backend is Node.js/Express 5** in `artifacts/api-server`. Do NOT switch to Python/FastAPI — it breaks the monorepo.
- **Anthropic via ANTHROPIC_API_KEY secret directly** — not via Replit AI Integrations proxy (user declined upgrade). Client in `lib/integrations-anthropic-ai/src/client.ts`.
- **No vector DB** — semantic memory uses Postgres full-text/ilike search in `memory_records` table.
- **Orval codegen is the only source of API types/hooks** — always regenerate after openapi.yaml changes: `pnpm --filter @workspace/api-spec run codegen`.
- **DB schema** lives in `lib/db/src/schema/nexus.ts`; push changes with `pnpm --filter @workspace/db run push`.
- **SSE streaming** for chat — backend streams token-by-token via `text/event-stream`.

**Why:** Replacing the backend would break workspace routing and existing workflows. The user declined the Replit AI Integrations upgrade, so direct key usage is the only working path.
