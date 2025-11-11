import { type ScrapedContent, type InsertScrapedContent } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getScrapedContent(url: string): Promise<ScrapedContent | undefined>;
  getAllScrapedContent(): Promise<ScrapedContent[]>;
  createScrapedContent(content: InsertScrapedContent): Promise<ScrapedContent>;
  updateScrapedContent(url: string, content: InsertScrapedContent): Promise<ScrapedContent>;
}

export class MemStorage implements IStorage {
  private scrapedContent: Map<string, ScrapedContent>;

  constructor() {
    this.scrapedContent = new Map();
  }

  async getScrapedContent(url: string): Promise<ScrapedContent | undefined> {
    return this.scrapedContent.get(url);
  }

  async getAllScrapedContent(): Promise<ScrapedContent[]> {
    return Array.from(this.scrapedContent.values());
  }

  async createScrapedContent(insertContent: InsertScrapedContent): Promise<ScrapedContent> {
    const id = randomUUID();
    const content: ScrapedContent = {
      ...insertContent,
      id,
      scrapedAt: new Date(),
    };
    this.scrapedContent.set(insertContent.url, content);
    return content;
  }

  async updateScrapedContent(url: string, insertContent: InsertScrapedContent): Promise<ScrapedContent> {
    const id = randomUUID();
    const content: ScrapedContent = {
      ...insertContent,
      id,
      scrapedAt: new Date(),
    };
    this.scrapedContent.set(url, content);
    return content;
  }
}

export const storage = new MemStorage();
