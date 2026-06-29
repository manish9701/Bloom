/**
 * AI Service — Google AI (Gemini)
 * Vision   : gemini-2.5-flash  (space analysis + product recommendations)
 * Image    : gemini-2.5-flash  (composite room edits + product photos)
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

const VISION_MODEL = "gemini-2.0-flash-exp";
const IMAGE_MODEL  = "gemini-2.0-flash-exp";

let genAI: GoogleGenerativeAI | null = null;

function getGoogleAI(): GoogleGenerativeAI | null {
  if (genAI) return genAI;
  
  const key = process.env.EXPO_PUBLIC_GOOGLE_AI_KEY?.trim();
  if (!key || key === "your_google_ai_api_key_here") {
    console.warn("[AI] No Google AI key found. Running in demo mode.");
    return null;
  }
  
  try {
    genAI = new GoogleGenerativeAI(key);
    console.log("[AI] Google AI initialized successfully");
    return genAI;
  } catch (e) {
    console.warn("[AI] Failed to initialize Google AI:", e);
    return null;
  }
}

// ─── Space Type ───────────────────────────────────────────────────────────────

export type SpaceType = "indoor" | "outdoor" | "collection" | "commercial";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AnalysisResult = {
  items: DetectedItem[];
  vibe: string;
  palette: string[];
  issues: string[];
  strengths: string[];
  summary: string;
  category: string;
  spaceType: SpaceType;
};

export type DetectedItem = {
  id: string;
  label: string;
  emoji: string;
  confidence: number;
  color: string;
  bbox?: { x: number; y: number; w: number; h: number };
};

export type AIProductAlternative = {
  name: string;
  brand: string;
  price: number;
  description: string;
  searchQuery: string;
  shopLinks: { store: string; url: string }[];
};

export type AIProduct = {
  id: string;
  name: string;
  brand: string;
  description: string;
  reason: string;
  price: number;
  originalPrice?: number;
  category: string;
  action: "add" | "replace" | "upgrade";
  searchQuery: string;
  cropUri: string | null;
  shopLinks: { store: string; url: string; imageSearchUrl: string }[];
  placementHint: string;
  matchScore: number;
  tags: string[];
  relatedItemLabel?: string;
  alternatives?: AIProductAlternative[];
};

const ITEM_COLORS = [
  "#C8714A", "#D4920A", "#4D9E6A", "#7B6BD4",
  "#4A90D4", "#D46A6A", "#6A8ED4", "#D49A6A",
];

// ─── Space category helpers ───────────────────────────────────────────────────

export const SPACE_CATEGORIES: Record<string, { emoji: string; spaceType: SpaceType }> = {
  "Living Room":        { emoji: "🛋️",  spaceType: "indoor" },
  "Bedroom":            { emoji: "🛏️",  spaceType: "indoor" },
  "Kitchen":            { emoji: "🍳",  spaceType: "indoor" },
  "Home Office":        { emoji: "💻",  spaceType: "indoor" },
  "Bathroom":           { emoji: "🚿",  spaceType: "indoor" },
  "Kids Room":          { emoji: "🧸",  spaceType: "indoor" },
  "Dining Room":        { emoji: "🍽️",  spaceType: "indoor" },
  "Garden / Balcony":   { emoji: "🌿",  spaceType: "outdoor" },
  "Terrace / Rooftop":  { emoji: "🏡",  spaceType: "outdoor" },
  "Landscape":          { emoji: "🌳",  spaceType: "outdoor" },
  "Lego Collection":    { emoji: "🧱",  spaceType: "collection" },
  "Diecast / Hot Wheels":{ emoji: "🚗", spaceType: "collection" },
  "Book Shelf":         { emoji: "📚",  spaceType: "collection" },
  "Figurines / Display":{ emoji: "🗿",  spaceType: "collection" },
  "Café / Restaurant":  { emoji: "☕",  spaceType: "commercial" },
  "Retail Store":       { emoji: "🏪",  spaceType: "commercial" },
};

function inferSpaceType(category: string): SpaceType {
  return SPACE_CATEGORIES[category]?.spaceType ?? "indoor";
}

// ─── Helper to convert URI to base64 ──────────────────────────────────────────

export async function uriToBase64(uri: string): Promise<string> {
  const res = await fetch(uri);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// ─── Space Analysis ───────────────────────────────────────────────────────────

export async function analyzeSpace(imageUri: string): Promise<AnalysisResult> {
  const ai = getGoogleAI();
  if (!ai) return mockAnalysis();

  try {
    const model = ai.getGenerativeModel({ model: VISION_MODEL });
    const base64 = await uriToBase64(imageUri);

    const prompt = `Analyze this photo as an interior/exterior/collection stylist.

Identify the EXACT space type:
- Indoor: Living Room, Bedroom, Kitchen, Home Office, Bathroom, Kids Room, Dining Room
- Outdoor: Garden / Balcony, Terrace / Rooftop, Landscape
- Collections: Lego Collection, Diecast / Hot Wheels, Book Shelf, Figurines / Display
- Commercial: Café / Restaurant, Retail Store, Gym

Return ONLY raw JSON (no markdown, no backticks, no comments):
{
  "category": "exact type from list above",
  "spaceType": "indoor",
  "items": [
    { "label": "exact item visible in photo", "emoji": "emoji", "confidence": 90, "bbox": { "x": 0.1, "y": 0.2, "w": 0.3, "h": 0.4 } }
  ],
  "vibe": "2-3 word aesthetic",
  "palette": ["#hex1", "#hex2", "#hex3"],
  "issues": ["specific actionable problem"],
  "strengths": ["specific strength"],
  "summary": "2 sentences: what is in the photo and one key improvement"
}

Rules:
- items: 4–6 things you can ACTUALLY see in the photo, specific labels
- bbox: top-left corner (x,y) and size (w,h) as 0–1 fractions of image dimensions
- palette: 3 hex colors actually dominant in the photo
- spaceType must be: "indoor" | "outdoor" | "collection" | "commercial"`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: base64,
        },
      },
    ]);

    const response = result.response;
    const text = response.text();
    const raw = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    const p = JSON.parse(raw);
    const category = p.category ?? "Space";

    return {
      category,
      spaceType: (p.spaceType as SpaceType) ?? inferSpaceType(category),
      items: (p.items ?? []).map((item: any, i: number) => ({
        id: String(i + 1),
        label: item.label,
        emoji: item.emoji,
        confidence: item.confidence,
        color: ITEM_COLORS[i % ITEM_COLORS.length],
        bbox: item.bbox,
      })),
      vibe: p.vibe ?? "Modern",
      palette: p.palette ?? [],
      issues: p.issues ?? [],
      strengths: p.strengths ?? [],
      summary: p.summary ?? "",
    };
  } catch (e) {
    console.warn("analyzeSpace failed:", e);
    return mockAnalysis();
  }
}

// ─── Crop detected regions ────────────────────────────────────────────────────

async function getImageDimensions(uri: string): Promise<{ w: number; h: number }> {
  try {
    const { manipulateAsync, SaveFormat } = await import("expo-image-manipulator");
    const info = await manipulateAsync(uri, [], { format: SaveFormat.JPEG });
    return { w: info.width, h: info.height };
  } catch {
    return { w: 1000, h: 1000 };
  }
}

export async function cropDetectedItems(
  imageUri: string,
  items: DetectedItem[],
): Promise<Record<string, string>> {
  const crops: Record<string, string> = {};

  try {
    const { manipulateAsync, SaveFormat } = await import("expo-image-manipulator");
    const { w: imgW, h: imgH } = await getImageDimensions(imageUri);

    for (const item of items) {
      if (!item.bbox) continue;
      try {
        const { bbox } = item;
        const originX = Math.max(0, Math.round(bbox.x * imgW));
        const originY = Math.max(0, Math.round(bbox.y * imgH));
        const cropW   = Math.max(4, Math.round(bbox.w * imgW));
        const cropH   = Math.max(4, Math.round(bbox.h * imgH));
        const safeW   = Math.min(cropW, imgW - originX);
        const safeH   = Math.min(cropH, imgH - originY);
        if (safeW < 4 || safeH < 4) continue;

        const result = await manipulateAsync(
          imageUri,
          [{ crop: { originX, originY, width: safeW, height: safeH } }],
          { compress: 0.85, format: SaveFormat.JPEG, base64: true },
        );
        if (result.base64) {
          crops[item.label] = `data:image/jpeg;base64,${result.base64}`;
        }
      } catch {
        // skip
      }
    }
  } catch (e) {
    console.warn("cropDetectedItems failed:", e);
  }

  return crops;
}

// ─── Product recommendations ──────────────────────────────────────────────────

function buildProductPrompt(
  spaceType: SpaceType,
  category: string,
  vibe: string,
  budget: number,
  userPrompt: string | undefined,
  detectedItems: DetectedItem[] | undefined,
): string {
  const styleDirection = userPrompt
    ? `The user wants: "${userPrompt}".`
    : `Current vibe: ${vibe}. Enhance it.`;
  const itemsList = detectedItems
    ? detectedItems.map(d => `- ${d.label} (${d.confidence}% confident)`).join("\n")
    : "";

  const categoryGuide: Record<SpaceType, string> = {
    indoor: `furniture, lighting, textiles, decor objects, plants, organisation`,
    outdoor: `planters, garden lights, outdoor furniture, garden decor, irrigation, weather-resistant accessories, artificial grass, pebbles, wind chimes`,
    collection: `display risers/stands, LED strip lighting, acrylic cases, backdrop sheets, labelling systems, storage boxes, dust covers, display shelves`,
    commercial: `commercial lighting, signage, furniture, decor, planters, ambience accessories`,
  };

  const brandGuide: Record<SpaceType, string> = {
    indoor: `Philips, Wipro, Godrej, IKEA, Fabindia, Urban Ladder, Pepperfry, Ugaoo, Stitchnest, Woodkart, D-Line`,
    outdoor: `Ugaoo, Nurserylive, Kraft Seeds, Cello, Asian Paints Royale, Greenfield, Winni, National Garden`,
    collection: `IKEA, Pepperfry, Fab India, Amazon Basics, Miniso, PhotoStudio, Neatly, Hama`,
    commercial: `Havells, Philips, IKEA, Urban Ladder, Nilkamal, Crown Paints`,
  };

  return `You are a ${spaceType === "collection" ? "collector display expert" : spaceType === "outdoor" ? "landscape & garden designer" : "room stylist"} for Indian homes. This is a ${category}.
${styleDirection}
TOTAL BUDGET: ₹${budget.toLocaleString("en-IN")} — the SUM of ALL product prices MUST be ≤ ₹${budget.toLocaleString("en-IN")}.
${itemsList ? `Detected in the space:\n${itemsList}\n` : ""}
Suggest between 3 and 8 real, specific products available in India — as many as genuinely make sense for this space (not always 5). Mix categories: ${categoryGuide[spaceType]}.
Use real brands: ${brandGuide[spaceType]}.

Return ONLY a raw JSON array (no markdown, no backticks):
[
  {
    "name": "exact product name",
    "brand": "real brand name",
    "description": "one line description",
    "reason": "why it fits THIS specific space",
    "price": 1499,
    "originalPrice": 2499,
    "category": "Lighting",
    "action": "add",
    "placementHint": "precise placement location",
    "matchScore": 92,
    "tags": ["tag1", "tag2"],
    "relatedItemLabel": null,
    "alternatives": [
      { "name": "budget alternative", "brand": "brand", "price": 799, "description": "one line" },
      { "name": "premium alternative", "brand": "brand", "price": 2499, "description": "one line" }
    ]
  }
]

CRITICAL RULES:
- Minimum 3 products, maximum 8 products — quality over quantity
- Sum of all prices MUST be ≤ ₹${budget.toLocaleString("en-IN")}
- Each product individually ≤ ₹${Math.floor(budget * 0.5).toLocaleString("en-IN")} (no single item hogging the budget)
- action: "add" | "replace" | "upgrade"
- matchScore: 75–98
- 2 alternatives per product at different price points`;
}

export async function getAIProductRecommendations(
  imageUri: string,
  category: string,
  vibe: string,
  budget: number,
  userPrompt?: string,
  detectedItems?: DetectedItem[],
  cropMap?: Record<string, string>,
  spaceType: SpaceType = "indoor",
): Promise<AIProduct[]> {
  const ai = getGoogleAI();
  if (!ai) return mockProducts(budget, spaceType);

  try {
    const model = ai.getGenerativeModel({ model: VISION_MODEL });
    const base64 = await uriToBase64(imageUri);
    const promptText = buildProductPrompt(spaceType, category, vibe, budget, userPrompt, detectedItems);

    const result = await model.generateContent([
      promptText,
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: base64,
        },
      },
    ]);

    const response = result.response;
    const text = response.text();
    const raw = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let products: any[] = JSON.parse(raw);

    // Enforce budget — filter out if total exceeds, then trim to fit
    let runningTotal = 0;
    products = products.filter(p => {
      const price = p.price || 0;
      if (runningTotal + price <= budget) {
        runningTotal += price;
        return true;
      }
      return false;
    });

    return products.map((p, i) => ({
      id: `ai-${i + 1}`,
      name: p.name || "Product",
      brand: p.brand || "Brand",
      description: p.description || "",
      reason: p.reason || "",
      price: p.price || 999,
      originalPrice: p.originalPrice,
      category: p.category || "Decor",
      action: p.action || "add",
      searchQuery: `${p.brand || ""} ${p.name || ""}`.trim(),
      cropUri: null,
      shopLinks: buildShopLinks(p.name, p.brand),
      placementHint: p.placementHint || "",
      matchScore: p.matchScore || 85,
      tags: p.tags || [],
      relatedItemLabel: p.relatedItemLabel || undefined,
      alternatives: (p.alternatives || []).map((alt: any) => ({
        name: alt.name || "",
        brand: alt.brand || "",
        price: alt.price || 999,
        description: alt.description || "",
        searchQuery: `${alt.brand || ""} ${alt.name || ""}`.trim(),
        shopLinks: buildShopLinks(alt.name, alt.brand).map(l => ({ store: l.store, url: l.url })),
      })),
    }));
  } catch (e) {
    console.warn("getAIProductRecommendations failed:", e);
    return mockProducts(budget, spaceType);
  }
}

export function buildShopLinks(name: string, brand: string): AIProduct["shopLinks"] {
  const q = encodeURIComponent(`${brand} ${name}`);
  return [
    { store: "Amazon",   url: `https://www.amazon.in/s?k=${q}`,          imageSearchUrl: `https://www.amazon.in/s?k=${q}` },
    { store: "Flipkart", url: `https://www.flipkart.com/search?q=${q}`,  imageSearchUrl: `https://www.flipkart.com/search?q=${q}` },
  ];
}

// ─── Product Image Generation ─────────────────────────────────────────────────

export async function generateProductImage(
  name: string,
  brand: string,
  category: string,
): Promise<string | null> {
  const ai = getGoogleAI();
  if (!ai) return null;

  try {
    const model = ai.getGenerativeModel({ model: IMAGE_MODEL });

    const prompt = `Professional studio product photograph. ${brand} ${name}. ${category} item.
Pure white background. Soft even studio lighting, subtle drop shadow.
Slightly elevated 3/4 angle view. Sharp crisp focus. High-end retail photography.
Minimal and clean. No text, no watermarks, no props.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    
    // Note: Gemini API doesn't directly return images yet through the SDK
    // This is a placeholder - in production, you'd use imagen or another service
    console.warn("[AI] Image generation not yet supported via SDK");
    return null;
  } catch (e) {
    console.warn("[AI] generateProductImage failed:", e);
    return null;
  }
}

// ─── Composite Image Generation ───────────────────────────────────────────────

export type PlacementResult = {
  compositeUri: string;
  success: boolean;
};

export async function generateComposite(
  imageUri: string,
  products: Array<{ name: string; brand: string; placementHint: string; action: string }>,
  vibe: string,
  userPrompt?: string,
): Promise<PlacementResult> {
  const ai = getGoogleAI();
  if (!ai) return { compositeUri: imageUri, success: false };

  try {
    const model = ai.getGenerativeModel({ model: IMAGE_MODEL });
    const base64 = await uriToBase64(imageUri);

    const addItems    = products.filter(p => p.action === "add" || p.action === "upgrade");
    const removeItems = products.filter(p => p.action === "replace");

    const addList = addItems
      .map((p, i) => `${i + 1}. "${p.name}" by ${p.brand} → ${p.placementHint}`)
      .join("\n");
    const removeList = removeItems
      .map((p, i) => `${i + 1}. Remove item at: ${p.placementHint}`)
      .join("\n");

    const fullItemsManifest = products
      .map((p, i) => `${i + 1}. ${p.action.toUpperCase()}: "${p.name}" by ${p.brand} — placement: ${p.placementHint}`)
      .join("\n");

    const styleHint = userPrompt
      ? `Style direction: "${userPrompt}".`
      : `Target aesthetic: ${vibe}.`;

    const prompt = `You are editing THIS EXACT PHOTO. Preserve the camera angle, perspective, walls, floor, ceiling, and all existing furniture layout. Match the original lighting and color tone exactly.

${styleHint}

⚠️ MANDATORY ITEM CHECKLIST — You MUST visually place EVERY item below into the scene. Do NOT skip any item:
${fullItemsManifest}

INSTRUCTIONS:
${addList ? `ADD each of these items into the scene at the stated location:\n${addList}` : ""}${removeList ? `\n\nREMOVE only these elements:\n${removeList}` : ""}

VERIFICATION: Before finalizing, confirm each item from the mandatory checklist is visible in the output. If an item does not fit naturally, place it in the closest logical position.

CRITICAL RULES:
- Do NOT change any existing elements not in the remove list
- Do NOT reimagine or restyle the overall space
- All ${addItems.length} items to add MUST appear in the final image
- Match original photo perspective, scale, and proportions exactly`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: base64,
        },
      },
    ]);

    // Note: Gemini API image generation returns differently
    // This is a placeholder implementation
    console.warn("[AI] Composite generation not fully implemented for Gemini SDK");
    
    return { compositeUri: imageUri, success: false };
  } catch (e) {
    console.warn("[AI] generateComposite failed:", e);
    return { compositeUri: imageUri, success: false };
  }
}

// ─── Mock Fallbacks ───────────────────────────────────────────────────────────

function mockAnalysis(): AnalysisResult {
  return {
    category: "Living Room",
    spaceType: "indoor",
    items: [
      { id: "1", label: "TV Unit",       emoji: "📺", confidence: 96, color: "#C8714A", bbox: { x: 0.1, y: 0.3, w: 0.8, h: 0.5 } },
      { id: "2", label: "Sofa",          emoji: "🛋️", confidence: 88, color: "#D4920A", bbox: { x: 0.0, y: 0.5, w: 0.5, h: 0.4 } },
      { id: "3", label: "Ceiling Light", emoji: "💡", confidence: 79, color: "#4D9E6A", bbox: { x: 0.35,y: 0.0, w: 0.3, h: 0.15} },
      { id: "4", label: "Books",         emoji: "📚", confidence: 91, color: "#7B6BD4", bbox: { x: 0.7, y: 0.2, w: 0.25,h: 0.3 } },
    ],
    vibe: "Modern Warm",
    palette: ["#8B7355", "#C4A882", "#4A4A4A"],
    issues: ["Cable clutter visible", "Flat uniform lighting"],
    strengths: ["Good natural proportions", "Warm wood tones"],
    summary: "A warm space with good bones. Adding ambient lighting and tidying cables would elevate it from functional to curated.",
  };
}

function mockProducts(budget: number, spaceType: SpaceType = "indoor"): AIProduct[] {
  const indoor: AIProduct[] = [
    {
      id: "mock-1", name: "Smart LED Bulb 12W", brand: "Wipro",
      description: "Color-changing smart bulb, Alexa & Google Home compatible",
      reason: "Adds warm ambient lighting to balance harsh overhead lights",
      price: 799, originalPrice: 1299, category: "Lighting", action: "upgrade",
      searchQuery: "wipro smart led bulb 12w", cropUri: null,
      shopLinks: buildShopLinks("Smart LED Bulb 12W", "Wipro"),
      placementHint: "in a table lamp near the seating area",
      matchScore: 93, tags: ["Smart Home", "Lighting"],
      alternatives: [
        { name: "LED Filament Bulb 8W", brand: "Philips", price: 349, description: "Warm vintage Edison style", searchQuery: "philips filament bulb", shopLinks: buildShopLinks("LED Filament Bulb", "Philips").map(l => ({ store: l.store, url: l.url })) },
        { name: "Smart Bulb Pack of 2", brand: "Syska", price: 649, description: "Voice controlled, 16M colors", searchQuery: "syska smart bulb", shopLinks: buildShopLinks("Smart Bulb", "Syska").map(l => ({ store: l.store, url: l.url })) },
      ],
    },
    {
      id: "mock-2", name: "Cable Management Box", brand: "D-Line",
      description: "Conceals power strips and tangled cables cleanly",
      reason: "Hides the cable mess behind your entertainment unit",
      price: 649, originalPrice: 999, category: "Organisation", action: "add",
      searchQuery: "cable management box white", cropUri: null,
      shopLinks: buildShopLinks("Cable Management Box", "D-Line"),
      placementHint: "behind the TV unit on the floor",
      matchScore: 89, tags: ["Organisation", "Minimal"],
      alternatives: [
        { name: "Cable Raceway Kit 10ft", brand: "Yecaye", price: 399, description: "Wall-mount cable cover strips", searchQuery: "cable raceway kit", shopLinks: buildShopLinks("Cable Raceway", "Yecaye").map(l => ({ store: l.store, url: l.url })) },
        { name: "Cable Box Organiser", brand: "IKEA", price: 549, description: "Minimalist white box, hides adapters", searchQuery: "ikea cable box", shopLinks: buildShopLinks("Cable Box", "IKEA").map(l => ({ store: l.store, url: l.url })) },
      ],
    },
    {
      id: "mock-3", name: "Money Plant Ceramic Pot", brand: "Ugaoo",
      description: "Low maintenance indoor plant in white ceramic pot",
      reason: "Adds life and organic texture to the tech-heavy space",
      price: 499, originalPrice: 799, category: "Plants", action: "add",
      searchQuery: "money plant ceramic pot white", cropUri: null,
      shopLinks: buildShopLinks("Money Plant Ceramic Pot", "Ugaoo"),
      placementHint: "on top of the shelf or side table",
      matchScore: 91, tags: ["Plants", "Decor"],
      alternatives: [
        { name: "Snake Plant Sansevieria", brand: "Nurserylive", price: 349, description: "Air purifying, extremely low maintenance", searchQuery: "snake plant sansevieria", shopLinks: buildShopLinks("Snake Plant", "Nurserylive").map(l => ({ store: l.store, url: l.url })) },
        { name: "ZZ Plant with Pot", brand: "Ugaoo", price: 599, description: "Glossy leaves, survives low light", searchQuery: "zz plant ugaoo", shopLinks: buildShopLinks("ZZ Plant", "Ugaoo").map(l => ({ store: l.store, url: l.url })) },
      ],
    },
  ];

  return indoor.slice(0, Math.min(5, Math.floor(budget / 500)));
}
