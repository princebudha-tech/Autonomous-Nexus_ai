import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  jsonb,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// Memory records for semantic memory store
export const memoryRecords = pgTable("memory_records", {
  id: text("id").primaryKey(),
  content: text("content").notNull(),
  namespace: text("namespace").notNull().default("general"),
  tags: text("tags").array().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const insertMemoryRecordSchema = createInsertSchema(memoryRecords);
export type MemoryRecord = typeof memoryRecords.$inferSelect;
export type InsertMemoryRecord = z.infer<typeof insertMemoryRecordSchema>;

// Pending actions that require human confirmation
export const pendingActions = pgTable("pending_actions", {
  id: text("id").primaryKey(),
  actionType: text("action_type").notNull(),
  target: text("target"),
  description: text("description").notNull(),
  requestedBy: text("requested_by").notNull(),
  riskLevel: text("risk_level").notNull().default("medium"),
  params: jsonb("params").notNull().default({}),
  approved: boolean("approved"),
  executionOutput: text("execution_output"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
});

export const insertPendingActionSchema = createInsertSchema(pendingActions).omit(
  { approved: true, executionOutput: true, resolvedAt: true }
);
export type PendingAction = typeof pendingActions.$inferSelect;
export type InsertPendingAction = z.infer<typeof insertPendingActionSchema>;

// Agent plans with steps
export const agentPlans = pgTable("agent_plans", {
  id: text("id").primaryKey(),
  task: text("task").notNull(),
  steps: jsonb("steps").notNull().default([]),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type AgentPlan = typeof agentPlans.$inferSelect;

// Sandbox run history
export const sandboxRuns = pgTable("sandbox_runs", {
  id: serial("id").primaryKey(),
  code: text("code").notNull(),
  language: text("language").notNull(),
  stdout: text("stdout").notNull().default(""),
  stderr: text("stderr").notNull().default(""),
  exitCode: integer("exit_code").notNull().default(0),
  executionTimeMs: integer("execution_time_ms").notNull().default(0),
  blocked: boolean("blocked").notNull().default(false),
  blockReason: text("block_reason"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type SandboxRun = typeof sandboxRuns.$inferSelect;

// System log entries
export const logEntries = pgTable("log_entries", {
  id: text("id").primaryKey(),
  level: text("level").notNull(),
  message: text("message").notNull(),
  source: text("source").notNull(),
  metadata: jsonb("metadata").notNull().default({}),
  timestamp: timestamp("timestamp", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type LogEntry = typeof logEntries.$inferSelect;
