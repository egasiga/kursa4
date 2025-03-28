import { pgTable, text, serial, integer, boolean, json, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User table for authentication and account management
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Meme templates table
export const memeTemplates = pgTable("meme_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  imageUrl: text("image_url").notNull(),
  userId: integer("user_id").references(() => users.id),
  isPublic: boolean("is_public").default(false),
  textAreas: json("text_areas").default([]), // Array of {x, y, width, height, defaultText}
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMemeTemplateSchema = createInsertSchema(memeTemplates).omit({
  id: true,
  createdAt: true,
});

// Saved memes table
export const savedMemes = pgTable("saved_memes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  imageUrl: text("image_url").notNull(),
  templateId: integer("template_id").references(() => memeTemplates.id),
  userId: integer("user_id").references(() => users.id),
  textContent: json("text_content").default([]), // Array of {areaIndex, text, style}
  appliedFilters: json("applied_filters").default([]), // Array of filter objects
  aiStyle: text("ai_style").default("none"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSavedMemeSchema = createInsertSchema(savedMemes).omit({
  id: true,
  createdAt: true,
});

// Collages table
export const collages = pgTable("collages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  imageUrl: text("image_url").notNull(),
  userId: integer("user_id").references(() => users.id),
  layout: text("layout").notNull(), // layout name/type
  sourceImages: json("source_images").default([]), // Array of image URLs
  textContent: json("text_content").default([]), // Array of {x, y, text, style}
  appliedFilters: json("applied_filters").default([]), // Array of filter objects
  aiStyle: text("ai_style").default("none"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCollageSchema = createInsertSchema(collages).omit({
  id: true,
  createdAt: true,
});

// AI Styles table
export const aiStyles = pgTable("ai_styles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  previewUrl: text("preview_url"),
  apiParams: json("api_params").default({}), // Parameters to send to AI API
  source: text("source").default("magenta"), // Source of the style (e.g., "magenta", "sharp", "huggingface")
});

export const insertAiStyleSchema = createInsertSchema(aiStyles).omit({
  id: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type MemeTemplate = typeof memeTemplates.$inferSelect;
export type InsertMemeTemplate = z.infer<typeof insertMemeTemplateSchema>;

export type SavedMeme = typeof savedMemes.$inferSelect;
export type InsertSavedMeme = z.infer<typeof insertSavedMemeSchema>;

export type Collage = typeof collages.$inferSelect;
export type InsertCollage = z.infer<typeof insertCollageSchema>;

export type AiStyle = typeof aiStyles.$inferSelect;
export type InsertAiStyle = z.infer<typeof insertAiStyleSchema>;
