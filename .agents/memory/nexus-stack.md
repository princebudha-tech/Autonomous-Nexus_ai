---
name: NEXUS stack decisions
description: Backend architecture, key constraints, and integration decisions for NEXUS AI OS
---

## Backend
- **Runtime**: Node.js + Express 5 (TypeScript, ESM). Do NOT switch to Python FastAPI.
- **Monorepo**: pnpm workspaces. API server at `artifacts/api-server/`, DB at `lib/db/`, OpenAPI spec at `lib/api-spec/`.
- **AI**: Anthropic via `@workspace/integrations-anthropic-ai` package (wraps ANTHROPIC_API_KEY). Model: `claude-opus-4-5`.
- **DB**: PostgreSQL via Drizzle ORM. All tables in `lib/db/src/schema/nexus.ts`. Run `pnpm --filter @workspace/db run push` after schema changes.
- **Validation**: NO zod in api-server — it's not a dependency. Use plain JS validation (check type, length, enum membership manually). The `@workspace/api-zod` lib has pre-built Zod schemas for original endpoints only.
- **Codegen law**: All API types and React Query hooks generated from `lib/api-spec/openapi.yaml` by Orval. Run `pnpm --filter @workspace/api-spec run codegen` after spec changes. Never write fetchers by hand.
- **SSE streaming**: Coding agent uses SSE (`text/event-stream`) — set `X-Accel-Buffering: no` header.
- **Automation sandbox**: Sandboxed to `nexus-workspace/` dir (auto-created); destructive ops route through pending actions.

## Routes
All new routes export a default router and are barrel-exported from `routes/nexus/index.ts`, then mounted in `routes/index.ts`.

Current route modules:
- memory, agents, sandbox, actions, telemetry, logs (original)
- vision, coding, research, automation, tasks, notifications (added in v3 session)

## Agent Registry
Agents in `agentRegistry` (agents.ts): Planner, Reasoning, Coder, Memory, Vision, Research, Automation, Sandbox, Browser, Security.
`markAgentActive(name)` / `markAgentIdle(name)` — only work if name is in registry.

## DB Tables (nexus.ts)
conversations, messages (original)
agentPlans, memoryRecords, pendingActions, nexusLogs (original nexus)
tasks, notifications, visionAnalyses, codingSessions, researchResults, automationLogs (v3 additions)

**Why no zod in api-server**: esbuild cannot resolve `zod` or `zod/v4` at build time since it's not listed in api-server/package.json dependencies. Use plain JS guards instead.
