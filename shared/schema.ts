import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").notNull().default("active"), // active, paused, completed
  tokensUsed: integer("tokens_used").default(0),
  tokensRemaining: integer("tokens_remaining").default(4000),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  state: jsonb("state"), // Complete project state for resumption
});

export const aiAgents = pgTable("ai_agents", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // architeta, frontend, backend, qa, devops
  status: text("status").notNull().default("available"), // available, working, waiting, error
  projectId: integer("project_id").references(() => projects.id),
  context: text("context"),
  rules: jsonb("rules"),
  config: jsonb("config"), // temperature, max_tokens, etc.
  tasksCompleted: integer("tasks_completed").default(0),
  tasksTotal: integer("tasks_total").default(0),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id),
  agentId: integer("agent_id").references(() => aiAgents.id),
  content: text("content").notNull(),
  type: text("type").notNull(), // user, system, ai_response, progress_report
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const projectFiles = pgTable("project_files", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id),
  path: text("path").notNull(),
  name: text("name").notNull(),
  content: text("content"),
  type: text("type").notNull(), // file, folder
  size: integer("size").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

// Insert schemas
export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAiAgentSchema = createInsertSchema(aiAgents).omit({
  id: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertProjectFileSchema = createInsertSchema(projectFiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

// Types
export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export type AiAgent = typeof aiAgents.$inferSelect;
export type InsertAiAgent = z.infer<typeof insertAiAgentSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type ProjectFile = typeof projectFiles.$inferSelect;
export type InsertProjectFile = z.infer<typeof insertProjectFileSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
