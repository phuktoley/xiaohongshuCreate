import { eq, desc, and, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, personas, generations, type InsertPersona, type InsertGeneration } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
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
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
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

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============ Persona Functions ============

export async function createPersona(data: InsertPersona) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(personas).values(data);
  return result[0].insertId;
}

export async function getPersonasByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(personas).where(eq(personas.userId, userId)).orderBy(desc(personas.createdAt));
}

export async function getPersonaById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(personas).where(eq(personas.id, id)).limit(1);
  return result[0] || null;
}

export async function updatePersona(id: number, data: Partial<InsertPersona>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(personas).set(data).where(eq(personas.id, id));
}

export async function deletePersona(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(personas).where(eq(personas.id, id));
}

// ============ Generation Functions ============

export async function createGeneration(data: InsertGeneration) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(generations).values(data);
  return result[0].insertId;
}

export async function getGenerationsByUserId(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(generations).where(eq(generations.userId, userId)).orderBy(desc(generations.createdAt)).limit(limit);
}

export async function getFavoritesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(generations).where(
    and(eq(generations.userId, userId), eq(generations.isFavorite, true))
  ).orderBy(desc(generations.createdAt));
}

export async function toggleFavorite(id: number, isFavorite: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(generations).set({ isFavorite }).where(eq(generations.id, id));
}

export async function deleteGeneration(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(generations).where(eq(generations.id, id));
}


// ============ Feishu Config Functions ============

import { feishuConfigs } from "../drizzle/schema";

export async function getFeishuConfig(userId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(feishuConfigs).where(eq(feishuConfigs.userId, userId)).limit(1);
  return result[0] || null;
}

export async function saveFeishuConfig(
  userId: number, 
  appId: string, 
  appSecret: string,
  appToken?: string,
  tableId?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Upsert: 如果存在则更新，否则插入
  await db.insert(feishuConfigs).values({
    userId,
    appId,
    appSecret,
    appToken: appToken || null,
    tableId: tableId || null,
  }).onDuplicateKeyUpdate({
    set: { 
      appId, 
      appSecret,
      appToken: appToken || null,
      tableId: tableId || null,
    },
  });
}


// ============ Draft Functions ============

import { drafts, contents, type InsertDraft, type InsertContent } from "../drizzle/schema";

export async function saveDraft(data: InsertDraft) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(drafts).values(data);
  return result[0].insertId;
}

export async function getDraftsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(drafts).where(eq(drafts.userId, userId)).orderBy(desc(drafts.createdAt));
}

export async function getDraftById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(drafts).where(eq(drafts.id, id)).limit(1);
  return result[0] || null;
}

export async function updateDraft(id: number, data: Partial<InsertDraft>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(drafts).set(data).where(eq(drafts.id, id));
}

export async function deleteDraft(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(drafts).where(eq(drafts.id, id));
}

// ============ Content Functions ============

export async function saveContent(data: InsertContent) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(contents).values(data);
  return result[0].insertId;
}

export async function saveContents(dataList: InsertContent[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  if (dataList.length === 0) return [];
  
  const result = await db.insert(contents).values(dataList);
  return result;
}

export async function getContentsByUserId(userId: number, limit = 100) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(contents).where(eq(contents.userId, userId)).orderBy(desc(contents.createdAt)).limit(limit);
}

export async function getContentById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(contents).where(eq(contents.id, id)).limit(1);
  return result[0] || null;
}

export async function getContentsByIds(ids: number[]) {
  const db = await getDb();
  if (!db) return [];
  
  if (ids.length === 0) return [];

  return db.select().from(contents).where(inArray(contents.id, ids));
}

export async function toggleContentFavorite(id: number, isFavorite: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(contents).set({ isFavorite }).where(eq(contents.id, id));
}

export async function markContentExported(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(contents).set({ 
    isExported: true, 
    exportedAt: new Date() 
  }).where(eq(contents.id, id));
}

export async function markContentsExported(ids: number[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  for (const id of ids) {
    await db.update(contents).set({ 
      isExported: true, 
      exportedAt: new Date() 
    }).where(eq(contents.id, id));
  }
}

export async function deleteContent(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(contents).where(eq(contents.id, id));
}

export async function getFavoriteContents(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(contents).where(
    and(eq(contents.userId, userId), eq(contents.isFavorite, true))
  ).orderBy(desc(contents.createdAt));
}
