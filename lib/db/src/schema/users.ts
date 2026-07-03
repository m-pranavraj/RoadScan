import { pgTable, serial, text, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  passwordHash: text("password_hash").notNull().default(""),
  displayName: text("display_name"),
  onboardingCompleted: boolean("onboarding_completed").default(false),
  preferences: jsonb("preferences").$type<Record<string, unknown>>().default({}),
  theme: text("theme").default("paper"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;
