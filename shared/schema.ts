import { pgTable, text, varchar, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const scrapedContent = pgTable("scraped_content", {
  id: varchar("id").primaryKey(),
  url: text("url").notNull().unique(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  scrapedAt: timestamp("scraped_at").notNull().defaultNow(),
});

export const conversationSessions = pgTable("conversation_sessions", {
  id: varchar("id").primaryKey(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey(),
  sessionId: varchar("session_id").notNull().references(() => conversationSessions.id),
  role: varchar("role", { length: 20 }).notNull(),
  content: text("content").notNull(),
  sources: jsonb("sources"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const insertScrapedContentSchema = createInsertSchema(scrapedContent).omit({
  id: true,
  scrapedAt: true,
});

export const insertConversationSessionSchema = createInsertSchema(conversationSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  timestamp: true,
});

export type InsertScrapedContent = z.infer<typeof insertScrapedContentSchema>;
export type ScrapedContent = typeof scrapedContent.$inferSelect;

export type InsertConversationSession = z.infer<typeof insertConversationSessionSchema>;
export type ConversationSession = typeof conversationSessions.$inferSelect;

export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;

export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  sources?: Array<{ title: string; url: string }>;
};

export type ChatRequest = {
  message: string;
  sessionId?: string;
};

export type ChatResponse = {
  message: Message;
  sessionId: string;
};
