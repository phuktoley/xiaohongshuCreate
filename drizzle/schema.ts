import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
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

/**
 * 人设表 - 存储用户创建的人设配置
 */
export const personas = mysqlTable("personas", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  type: mysqlEnum("type", ["senior_sister", "professional", "anxious", "critic"]).notNull(),
  description: text("description"),
  greetings: json("greetings").$type<string[]>(),
  toneWords: json("toneWords").$type<string[]>(),
  emojiStyle: json("emojiStyle").$type<string[]>(),
  samplePhrases: json("samplePhrases").$type<string[]>(),
  isDefault: boolean("isDefault").default(false),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Persona = typeof personas.$inferSelect;
export type InsertPersona = typeof personas.$inferInsert;

/**
 * 生成历史表 - 存储所有生成的内容
 */
export const generations = mysqlTable("generations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  personaId: int("personaId"),
  type: mysqlEnum("type", ["title", "note", "hashtag", "cover"]).notNull(),
  scenario: mysqlEnum("scenario", ["delay", "dropout", "misconduct", "fail", "leave", "withdraw"]),
  emotion: mysqlEnum("emotion", ["empathy", "warning", "help", "success", "critic"]),
  input: text("input"),
  output: json("output").$type<Record<string, unknown>>(),
  isFavorite: boolean("isFavorite").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Generation = typeof generations.$inferSelect;
export type InsertGeneration = typeof generations.$inferInsert;

/**
 * 爆款内容数据库 - 存储分析过的高互动内容
 */
export const hotContents = mysqlTable("hotContents", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  author: varchar("author", { length: 100 }),
  likes: int("likes").default(0),
  comments: int("comments").default(0),
  scenario: mysqlEnum("scenario", ["delay", "dropout", "misconduct", "fail", "leave", "withdraw"]),
  titlePattern: varchar("titlePattern", { length: 100 }),
  coverType: mysqlEnum("coverType", ["big_text", "screenshot", "comparison", "person", "chat"]),
  emotionWords: json("emotionWords").$type<string[]>(),
  hashtags: json("hashtags").$type<string[]>(),
  analysis: text("analysis"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type HotContent = typeof hotContents.$inferSelect;
export type InsertHotContent = typeof hotContents.$inferInsert;

/**
 * 飞书配置表 - 存储用户的飞书应用配置
 */
export const feishuConfigs = mysqlTable("feishuConfigs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  appId: varchar("appId", { length: 100 }).notNull(),
  appSecret: varchar("appSecret", { length: 200 }).notNull(),
  appToken: varchar("appToken", { length: 100 }),  // 多维表格 App Token
  tableId: varchar("tableId", { length: 100 }),    // 多维表格 Table ID
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FeishuConfig = typeof feishuConfigs.$inferSelect;
export type InsertFeishuConfig = typeof feishuConfigs.$inferInsert;

/**
 * 草稿箱表 - 存储批量生成的草稿内容
 */
export const drafts = mysqlTable("drafts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 200 }),  // 草稿名称
  items: json("items").$type<Array<{
    title: string;
    note: string;
    hashtags: string[];
    cover: {
      mainText: string;
      subText: string;
      colorScheme: { primary: string; secondary: string; highlight: string; text: string; background: string };
      layout: string;
      coverType: string;
    };
    scenario: string;
    emotion: string;
    personaType: string;
    schoolName?: string;
  }>>(),
  scenario: mysqlEnum("scenario", ["delay", "dropout", "misconduct", "fail", "leave", "withdraw"]),
  emotion: mysqlEnum("emotion", ["empathy", "warning", "help", "success", "critic"]),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Draft = typeof drafts.$inferSelect;
export type InsertDraft = typeof drafts.$inferInsert;

/**
 * 完整内容表 - 存储完整的生成内容（标题+正文+标签+封面）
 */
export const contents = mysqlTable("contents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  note: text("note").notNull(),
  hashtags: json("hashtags").$type<string[]>(),
  coverMainText: varchar("coverMainText", { length: 200 }),
  coverSubText: varchar("coverSubText", { length: 200 }),
  coverColorScheme: json("coverColorScheme").$type<{ primary: string; secondary: string; highlight: string; text: string; background: string }>(),
  coverLayout: varchar("coverLayout", { length: 50 }),
  coverType: varchar("coverType", { length: 50 }),
  scenario: mysqlEnum("scenario", ["delay", "dropout", "misconduct", "fail", "leave", "withdraw"]),
  emotion: mysqlEnum("emotion", ["empathy", "warning", "help", "success", "critic"]),
  personaType: varchar("personaType", { length: 50 }),
  schoolName: varchar("schoolName", { length: 200 }),
  isFavorite: boolean("isFavorite").default(false),
  isExported: boolean("isExported").default(false),
  exportedAt: timestamp("exportedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Content = typeof contents.$inferSelect;
export type InsertContent = typeof contents.$inferInsert;
