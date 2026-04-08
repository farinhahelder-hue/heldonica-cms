import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const pages = mysqlTable("pages", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  content: text("content"),
  description: text("description"),
  metaTitle: varchar("metaTitle", { length: 255 }),
  metaDescription: varchar("metaDescription", { length: 500 }),
  ogImage: text("ogImage"),
  status: mysqlEnum("status", ["draft", "published", "archived"]).default("draft").notNull(),
  authorId: int("authorId").notNull().references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  publishedAt: timestamp("publishedAt"),
});
export type Page = typeof pages.$inferSelect;
export type InsertPage = typeof pages.$inferInsert;

export const articles = mysqlTable("articles", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  content: text("content"),
  excerpt: text("excerpt"),
  metaTitle: varchar("metaTitle", { length: 255 }),
  metaDescription: varchar("metaDescription", { length: 500 }),
  ogImage: text("ogImage"),
  readTime: int("readTime"),
  status: mysqlEnum("status", ["draft", "published", "archived"]).default("draft").notNull(),
  authorId: int("authorId").notNull().references(() => users.id),
  category: varchar("category", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  publishedAt: timestamp("publishedAt"),
});
export type Article = typeof articles.$inferSelect;
export type InsertArticle = typeof articles.$inferInsert;

export const media = mysqlTable("media", {
  id: int("id").autoincrement().primaryKey(),
  filename: varchar("filename", { length: 255 }).notNull(),
  url: text("url").notNull(),
  fileKey: varchar("fileKey", { length: 255 }).notNull(),
  mimeType: varchar("mimeType", { length: 100 }),
  size: int("size"),
  uploadedBy: int("uploadedBy").notNull().references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Media = typeof media.$inferSelect;
export type InsertMedia = typeof media.$inferInsert;

export const destinations = mysqlTable("destinations", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  country: varchar("country", { length: 100 }),
  latitude: varchar("latitude", { length: 50 }),
  longitude: varchar("longitude", { length: 50 }),
  image: text("image"),
  metaTitle: varchar("metaTitle", { length: 255 }),
  metaDescription: varchar("metaDescription", { length: 500 }),
  ogImage: text("ogImage"),
  status: mysqlEnum("status", ["draft", "published", "archived"]).default("draft").notNull(),
  authorId: int("authorId").notNull().references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  publishedAt: timestamp("publishedAt"),
});
export type Destination = typeof destinations.$inferSelect;
export type InsertDestination = typeof destinations.$inferInsert;

/**
 * Travel Planning requests — formulaire heldonica.fr
 */
export const travelRequests = mysqlTable("travel_requests", {
  id: int("id").autoincrement().primaryKey(),
  // Contact
  firstName: varchar("firstName", { length: 100 }).notNull(),
  lastName: varchar("lastName", { length: 100 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 30 }),
  // Voyage
  destination: text("destination"),
  departureDate: varchar("departureDate", { length: 20 }),
  returnDate: varchar("returnDate", { length: 20 }),
  duration: varchar("duration", { length: 50 }),
  travelers: varchar("travelers", { length: 10 }),
  travelType: varchar("travelType", { length: 100 }),
  budget: varchar("budget", { length: 50 }),
  // Demande
  message: text("message"),
  howDidYouFind: varchar("howDidYouFind", { length: 100 }),
  // CRM
  status: mysqlEnum("status", ["new", "contacted", "in_progress", "closed"]).default("new").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type TravelRequest = typeof travelRequests.$inferSelect;
export type InsertTravelRequest = typeof travelRequests.$inferInsert;
