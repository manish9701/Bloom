/**
 * Bloom — Persistent Store
 * Priority: DynamoDB → localStorage (web) / AsyncStorage (native)
 */
import { Platform } from "react-native";
import { GlowUp } from "./mockData";
import { 
  getGalleryFromDynamo, 
  saveGalleryToDynamo, 
  getGlowUpFromDynamo, 
  deleteGlowUpFromDynamo,
  clearGalleryFromDynamo,
  isDynamoAvailable,
  getTableName
} from "./dynamo";

const GALLERY_KEY = "bloom_gallery_v2";

// In-memory fallback for when native module is unavailable
const memStore: Record<string, string> = {};

// ─── Storage abstraction ──────────────────────────────────────────────────────
async function storeGet(key: string): Promise<string | null> {
  // Priority 1: DynamoDB (if available and credentials configured)
  if (isDynamoAvailable()) {
    try {
      const gallery = await getGalleryFromDynamo();
      if (gallery) {
        return JSON.stringify(gallery);
      }
    } catch (e) {
      console.warn("[Store] DynamoDB read failed, falling back to localStorage:", e);
    }
  }

  // Priority 2: Platform-specific storage
  if (Platform.OS === "web") {
    try { return localStorage.getItem(key); } catch { return null; }
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const AS = require("@react-native-async-storage/async-storage").default;
    if (!AS || typeof AS.getItem !== "function") {
      return memStore[key] ?? null;
    }
    const val = await AS.getItem(key);
    return val ?? null;
  } catch {
    return memStore[key] ?? null;
  }
}

async function storeSet(key: string, value: string): Promise<void> {
  // Priority 1: DynamoDB (if available)
  if (isDynamoAvailable()) {
    try {
      const gallery = value ? JSON.parse(value) : [];
      await saveGalleryToDynamo(gallery);
      console.log(`[Store] Saved to DynamoDB table: ${getTableName()}`);
    } catch (e) {
      console.warn("[Store] DynamoDB write failed, falling back to localStorage:", e);
    }
  }

  // Priority 2: Platform-specific storage
  if (Platform.OS === "web") {
    try { localStorage.setItem(key, value); } catch {}
    return;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const AS = require("@react-native-async-storage/async-storage").default;
    if (!AS || typeof AS.setItem !== "function") {
      memStore[key] = value;
      return;
    }
    await AS.setItem(key, value);
    memStore[key] = value; // keep mem in sync
  } catch {
    memStore[key] = value;
  }
}

async function storeRemove(key: string): Promise<void> {
  // Priority 1: DynamoDB (if available)
  if (isDynamoAvailable()) {
    try {
      await clearGalleryFromDynamo();
    } catch (e) {
      console.warn("[Store] DynamoDB clear failed, falling back:", e);
    }
  }

  // Priority 2: Platform-specific storage
  if (Platform.OS === "web") {
    try { localStorage.removeItem(key); } catch {}
    return;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const AS = require("@react-native-async-storage/async-storage").default;
    if (!AS || typeof AS.removeItem !== "function") {
      delete memStore[key];
      return;
    }
    await AS.removeItem(key);
    delete memStore[key];
  } catch {
    delete memStore[key];
  }
}

// ─── Gallery API ──────────────────────────────────────────────────────────────
export async function getGallery(): Promise<GlowUp[]> {
  const raw = await storeGet(GALLERY_KEY);
  if (!raw) return [];
  try { return JSON.parse(raw) as GlowUp[]; } catch { return []; }
}

export async function saveGlowUp(glowup: GlowUp): Promise<void> {
  const existing = await getGallery();
  const filtered = existing.filter(g => g.id !== glowup.id);
  const updated = [glowup, ...filtered].slice(0, 20);
  await storeSet(GALLERY_KEY, JSON.stringify(updated));
}

export async function getGlowUpById(id: string): Promise<GlowUp | null> {
  const all = await getGallery();
  return all.find(g => g.id === id) ?? null;
}

export async function deleteGlowUp(id: string): Promise<void> {
  const existing = await getGallery();
  await storeSet(GALLERY_KEY, JSON.stringify(existing.filter(g => g.id !== id)));
}

export async function clearGallery(): Promise<void> {
  await storeRemove(GALLERY_KEY);
}
