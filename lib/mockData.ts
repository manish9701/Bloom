/**
 * Bloom — Shared Types & Mocks
 */
import { AIProduct } from "./aiService";

export type GlowUp = {
  id: string;
  imageUri: string;
  compositeUri?: string;
  /** All composite variations generated during this session */
  variations?: string[];
  vibe: string;
  date: string;
  score: number;
  label: string;
  productCount: number;
  products?: AIProduct[];
  productImages?: Record<string, string>; // product.id → generated image uri
  selectedIds?: string[];
  analysisJson?: string;
};

export const VIBE_ANALYSIS: Record<string, string> = {
  default:
    "A space with potential. A few intentional additions will shift this from functional to beautifully curated.",
};

export const MOCK_GALLERY: GlowUp[] = [];
