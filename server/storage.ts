import { 
  type ScrapedContent, 
  type InsertScrapedContent,
  type ConversationSession,
  type InsertConversationSession,
  type ChatMessage,
  type InsertChatMessage,
  scrapedContent as scrapedContentTable,
  conversationSessions,
  chatMessages,
} from "@shared/schema";
import { db } from "./db";
import { eq, asc } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  getScrapedContent(url: string): Promise<ScrapedContent | undefined>;
  getAllScrapedContent(): Promise<ScrapedContent[]>;
  createScrapedContent(content: InsertScrapedContent): Promise<ScrapedContent>;
  updateScrapedContent(url: string, content: InsertScrapedContent): Promise<ScrapedContent>;
  
  createSession(): Promise<ConversationSession>;
  getSession(id: string): Promise<ConversationSession | undefined>;
  
  createMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getSessionMessages(sessionId: string): Promise<ChatMessage[]>;
}

export class DatabaseStorage implements IStorage {
  async getScrapedContent(url: string): Promise<ScrapedContent | undefined> {
    const [content] = await db
      .select()
      .from(scrapedContentTable)
      .where(eq(scrapedContentTable.url, url));
    return content || undefined;
  }

  async getAllScrapedContent(): Promise<ScrapedContent[]> {
    return await db.select().from(scrapedContentTable);
  }

  async createScrapedContent(insertContent: InsertScrapedContent): Promise<ScrapedContent> {
    const [content] = await db
      .insert(scrapedContentTable)
      .values({
        ...insertContent,
        id: randomUUID(),
      })
      .returning();
    return content;
  }

  async updateScrapedContent(url: string, insertContent: InsertScrapedContent): Promise<ScrapedContent> {
    const [content] = await db
      .update(scrapedContentTable)
      .set({
        ...insertContent,
        scrapedAt: new Date(),
      })
      .where(eq(scrapedContentTable.url, url))
      .returning();
    return content;
  }

  async createSession(): Promise<ConversationSession> {
    const [session] = await db
      .insert(conversationSessions)
      .values({
        id: randomUUID(),
      })
      .returning();
    return session;
  }

  async getSession(id: string): Promise<ConversationSession | undefined> {
    const [session] = await db
      .select()
      .from(conversationSessions)
      .where(eq(conversationSessions.id, id));
    return session || undefined;
  }

  async createMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const [message] = await db
      .insert(chatMessages)
      .values({
        ...insertMessage,
        id: randomUUID(),
      })
      .returning();
    return message;
  }

  async getSessionMessages(sessionId: string): Promise<ChatMessage[]> {
    return await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId))
      .orderBy(asc(chatMessages.timestamp));
  }
}

export const storage = new DatabaseStorage();
