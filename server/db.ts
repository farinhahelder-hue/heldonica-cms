import { eq, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users, pages, articles, media, destinations, travelRequests,
  InsertPage, InsertArticle, InsertMedia, InsertDestination, InsertTravelRequest,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) { console.error("[Database] Failed to upsert user:", error); throw error; }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot get user: database not available"); return undefined; }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Pages
export async function getPages(limit = 10) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(pages).orderBy(desc(pages.createdAt)).limit(limit);
}
export async function getPublishedPages(limit = 10) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(pages).where(eq(pages.status, 'published')).orderBy(desc(pages.publishedAt)).limit(limit);
}
export async function getPageBySlug(slug: string) {
  const db = await getDb(); if (!db) return undefined;
  const r = await db.select().from(pages).where(eq(pages.slug, slug)).limit(1);
  return r[0];
}
export async function getPublishedPageBySlug(slug: string) {
  const db = await getDb(); if (!db) return undefined;
  const r = await db.select().from(pages).where(and(eq(pages.slug, slug), eq(pages.status, 'published'))).limit(1);
  return r[0];
}
export async function createPage(data: InsertPage) {
  const db = await getDb(); if (!db) throw new Error("Database not available");
  return db.insert(pages).values(data);
}
export async function updatePage(id: number, data: Partial<InsertPage>) {
  const db = await getDb(); if (!db) throw new Error("Database not available");
  return db.update(pages).set(data).where(eq(pages.id, id));
}
export async function deletePage(id: number) {
  const db = await getDb(); if (!db) throw new Error("Database not available");
  return db.delete(pages).where(eq(pages.id, id));
}

// Articles
export async function getArticles(limit = 10) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(articles).orderBy(desc(articles.createdAt)).limit(limit);
}
export async function getPublishedArticles(limit = 10) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(articles).where(eq(articles.status, 'published')).orderBy(desc(articles.publishedAt)).limit(limit);
}
export async function getArticleBySlug(slug: string) {
  const db = await getDb(); if (!db) return undefined;
  const r = await db.select().from(articles).where(eq(articles.slug, slug)).limit(1);
  return r[0];
}
export async function getPublishedArticleBySlug(slug: string) {
  const db = await getDb(); if (!db) return undefined;
  const r = await db.select().from(articles).where(and(eq(articles.slug, slug), eq(articles.status, 'published'))).limit(1);
  return r[0];
}
export async function createArticle(data: InsertArticle) {
  const db = await getDb(); if (!db) throw new Error("Database not available");
  return db.insert(articles).values(data);
}
export async function updateArticle(id: number, data: Partial<InsertArticle>) {
  const db = await getDb(); if (!db) throw new Error("Database not available");
  return db.update(articles).set(data).where(eq(articles.id, id));
}
export async function deleteArticle(id: number) {
  const db = await getDb(); if (!db) throw new Error("Database not available");
  return db.delete(articles).where(eq(articles.id, id));
}

// Media
export async function getMedia(limit = 20) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(media).orderBy(desc(media.createdAt)).limit(limit);
}
export async function createMedia(data: InsertMedia) {
  const db = await getDb(); if (!db) throw new Error("Database not available");
  return db.insert(media).values(data);
}
export async function deleteMedia(id: number) {
  const db = await getDb(); if (!db) throw new Error("Database not available");
  return db.delete(media).where(eq(media.id, id));
}

// Destinations
export async function getDestinations(limit = 10) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(destinations).orderBy(desc(destinations.createdAt)).limit(limit);
}
export async function getPublishedDestinations(limit = 10) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(destinations).where(eq(destinations.status, 'published')).orderBy(desc(destinations.publishedAt)).limit(limit);
}
export async function getDestinationBySlug(slug: string) {
  const db = await getDb(); if (!db) return undefined;
  const r = await db.select().from(destinations).where(eq(destinations.slug, slug)).limit(1);
  return r[0];
}
export async function getPublishedDestinationBySlug(slug: string) {
  const db = await getDb(); if (!db) return undefined;
  const r = await db.select().from(destinations).where(and(eq(destinations.slug, slug), eq(destinations.status, 'published'))).limit(1);
  return r[0];
}
export async function createDestination(data: InsertDestination) {
  const db = await getDb(); if (!db) throw new Error("Database not available");
  return db.insert(destinations).values(data);
}
export async function updateDestination(id: number, data: Partial<InsertDestination>) {
  const db = await getDb(); if (!db) throw new Error("Database not available");
  return db.update(destinations).set(data).where(eq(destinations.id, id));
}
export async function deleteDestination(id: number) {
  const db = await getDb(); if (!db) throw new Error("Database not available");
  return db.delete(destinations).where(eq(destinations.id, id));
}

// Travel Requests
export async function getTravelRequests(limit = 50) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(travelRequests).orderBy(desc(travelRequests.createdAt)).limit(limit);
}
export async function createTravelRequest(data: InsertTravelRequest) {
  const db = await getDb(); if (!db) throw new Error("Database not available");
  return db.insert(travelRequests).values(data);
}
export async function updateTravelRequestStatus(id: number, status: 'new' | 'contacted' | 'in_progress' | 'closed') {
  const db = await getDb(); if (!db) throw new Error("Database not available");
  return db.update(travelRequests).set({ status }).where(eq(travelRequests.id, id));
}

export function calculateReadTime(content: string | null | undefined): number {
  if (!content) return 0;
  const wordCount = content.trim().split(/\s+/).length;
  return Math.ceil(wordCount / 200);
}
