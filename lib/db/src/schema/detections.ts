import { pgTable, serial, text, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const detectionsTable = pgTable("detections", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => usersTable.id, { onDelete: "set null" }),
  filename: text("filename").notNull(),
  mediaType: text("media_type").notNull().$type<"image" | "video">(),
  originalUrl: text("original_url").notNull(),
  annotatedUrl: text("annotated_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  objects: jsonb("objects").notNull().$type<DetectedObject[]>(),
  counts: jsonb("counts").notNull().$type<DetectionCounts>(),
  processingTimeMs: integer("processing_time_ms").notNull(),
  severity: text("severity").notNull().$type<"low" | "medium" | "high" | "critical">(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type DetectedObject = {
  id: string;
  className: "pothole" | "plastic_waste" | "other_litter";
  confidence: number;
  bbox: { x: number; y: number; width: number; height: number };
  frameNumber: number | null;
};

export type DetectionCounts = {
  pothole: number;
  plastic_waste: number;
  other_litter: number;
  total: number;
};

export const insertDetectionSchema = createInsertSchema(detectionsTable).omit({ id: true, createdAt: true });
export type InsertDetection = z.infer<typeof insertDetectionSchema>;
export type Detection = typeof detectionsTable.$inferSelect;
