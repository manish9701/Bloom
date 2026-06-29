/**
 * AI Service — OpenRouter
 * Vision   : google/gemini-2.5-flash  (space analysis + product recommendations)
 * Image    : google/gemini-2.5-flash-image  (composite room edits + product photos)
 */

const BASE = "https://openrouter.ai/api/v1";
const VISION_MODEL = "google/gemini-2.5-flash";
const IMAGE_MODEL  = "google/gemini-2.5-flash-image";

function getKey(): string | null {
  return process.env.EXPO_PUBLIC_OPENROUTER_KEY ?? null;
}

function hdr(key: string) {
  return {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    "HTTP-Referer": "https://vibecurator.app",
    "X-Title": "VibeCurator",
  };
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

// ─── Extract image from OpenRouter response ───────────────────────────────────

function extractImageFromResponse(data: any): string | null {
  try {
    const msg = data?.choices?.[0]?.message;
    if (!msg) {
      console.warn("[AI] No message in response:", JSON.stringify(data).slice(0, 500));
      return null;
    }

    // PATH 1: message.images[]
    const images: any[] = msg?.images ?? [];
    if (images.length > 0) {
      const url = images[0]?.image_url?.url ?? images[0]?.url;
      if (url) { console.log("[AI] Image via msg.images"); return url; }
    }

    // PATH 2: content array parts
    const content = msg?.content;
    if (Array.isArray(content)) {
      const imgPart = content.find((p: any) =>
        p.type === "image_url" || (p.type === "image" && p.image_url)
      );
      if (imgPart?.image_url?.url) {
        console.log("[AI] Image via content[].image_url");
        return imgPart.image_url.url;
      }
      const inlinePart = content.find((p: any) => p.type === "image" && p.source?.data);
      if (inlinePart?.source?.data) {
        const mime = inlinePart.source?.media_type || "image/png";
        console.log("[AI] Image via content[].source.data");
        return `data:${mime};base64,${inlinePart.source.data}`;
      }
      const inlineLeg = content.find((p: any) => p.inline_data?.data);
      if (inlineLeg?.inline_data?.data) {
        const mime = inlineLeg.inline_data.mime_type || "image/png";
        console.log("[AI] Image via content[].inline_data");
        return `data:${mime};base64,${inlineLeg.inline_data.data}`;
      }
    }

    // PATH 3: plain data URI string
    if (typeof content === "string" && content.startsWith("data:image")) {
      console.log("[AI] Image via content string");
      return content;
    }

    // PATH 4: top-level data field
    const topImg = data?.data?.[0]?.url ?? data?.data?.[0]?.b64_json;
    if (topImg) {
      console.log("[AI] Image via data[0]");
      return topImg.startsWith("data:") ? topImg : `data:image/png;base64,${topImg}`;
    }

    console.warn("[AI] No image found. Response keys:", Object.keys(msg), "content type:", typeof content);
    return null;
  } catch (e) {
    console.warn("[AI] extractImage error:", e);
    return null;
  }
}

// ─── Space Analysis ───────────────────────────────────────────────────────────

export async function analyzeSpace(imageUri: string): Promise<AnalysisResult> {
  const key = getKey();
  if (!key) return mockAnalysis();

  try {
    const base64 = await uriToBase64(imageUri);

    const res = await fetch(`${BASE}/chat/completions`, {
      method: "POST",
      headers: hdr(key),
      body: JSON.stringify({
        model: VISION_MODEL,
        max_tokens: 1400,
        temperature: 0.3,
        messages: [{
          role: "user",
          content: [
            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64}` } },
            {
              type: "text",
              text: `Analyze this photo as an interior/exterior/collection stylist.

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
- spaceType must be: "indoor" | "outdoor" | "collection" | "commercial"`,
            },
          ],
        }],
      }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    const raw = (data.choices?.[0]?.message?.content ?? "")
      .replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

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
  const key = getKey();
  if (!key) return mockProducts(budget, spaceType);

  try {
    const base64 = await uriToBase64(imageUri);
    const promptText = buildProductPrompt(spaceType, category, vibe, budget, userPrompt, detectedItems);

    const res = await fetch(`${BASE}/chat/completions`, {
      method: "POST",
      headers: hdr(key),
      body: JSON.stringify({
        model: VISION_MODEL,
        max_tokens: 2000,
        temperature: 0.5,
        messages: [{
          role: "user",
          content: [
            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64}` } },
            { type: "text", text: promptText },
          ],
        }],
      }),
    });

    if (!res.ok) {
      console.warn(`getAIProductRecommendations HTTP ${res.status}`);
      return mockProducts(budget, spaceType);
    }

    const data = await res.json();
    const raw = (data.choices?.[0]?.message?.content ?? "")
      .replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

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
  const key = getKey();
  if (!key) return null;

  try {
    const prompt = `Professional studio product photograph. ${brand} ${name}. ${category} item.
Pure white background. Soft even studio lighting, subtle drop shadow.
Slightly elevated 3/4 angle view. Sharp crisp focus. High-end retail photography.
Minimal and clean. No text, no watermarks, no props.`;

    const res = await fetch(`${BASE}/chat/completions`, {
      method: "POST",
      headers: hdr(key),
      body: JSON.stringify({
        model: IMAGE_MODEL,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      console.warn("[AI] generateProductImage HTTP:", res.status);
      return null;
    }

    const data = await res.json();
    return extractImageFromResponse(data);
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
  const key = getKey();
  if (!key) return { compositeUri: imageUri, success: false };

  try {
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

    const res = await fetch(`${BASE}/chat/completions`, {
      method: "POST",
      headers: hdr(key),
      body: JSON.stringify({
        model: IMAGE_MODEL,
        messages: [{
          role: "user",
          content: [
            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64}` } },
            { type: "text", text: prompt },
          ],
        }],
      }),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => "");
      console.warn("[AI] Composite error:", res.status, err.slice(0, 300));
      return { compositeUri: imageUri, success: false };
    }

    const data = await res.json();
    const imgUrl = extractImageFromResponse(data);

    if (imgUrl) return { compositeUri: imgUrl, success: true };
    return { compositeUri: imageUri, success: false };
  } catch (e) {
    console.warn("[AI] generateComposite failed:", e);
    return { compositeUri: imageUri, success: false };
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
    {
      id: "mock-4", name: "Velvet Cushion Covers Set of 2", brand: "Stitchnest",
      description: "Soft velvet covers in earthy tones",
      reason: "Softens the space and introduces warm tones",
      price: 599, originalPrice: 899, category: "Textiles", action: "add",
      searchQuery: "velvet cushion cover set earthy", cropUri: null,
      shopLinks: buildShopLinks("Velvet Cushion Cover Set", "Stitchnest"),
      placementHint: "on the sofa",
      matchScore: 87, tags: ["Textiles", "Cozy"],
      alternatives: [
        { name: "Cotton Linen Cushion Cover 2pc", brand: "Fabindia", price: 449, description: "Natural woven texture, beige tones", searchQuery: "fabindia cushion cover", shopLinks: buildShopLinks("Cushion Cover", "Fabindia").map(l => ({ store: l.store, url: l.url })) },
        { name: "Boho Patterned Pillow Cover", brand: "House This", price: 699, description: "Block print, bohemian style", searchQuery: "house this cushion cover boho", shopLinks: buildShopLinks("Pillow Cover", "House This").map(l => ({ store: l.store, url: l.url })) },
      ],
    },
    {
      id: "mock-5", name: "Wooden Floating Shelf 24 inch", brand: "Woodkart",
      description: "Solid sheesham wood floating shelf",
      reason: "Creates vertical interest and display space",
      price: 1499, originalPrice: 2499, category: "Furniture", action: "add",
      searchQuery: "wooden floating shelf 24 inch wall", cropUri: null,
      shopLinks: buildShopLinks("Floating Shelf 24 inch", "Woodkart"),
      placementHint: "on the wall above the main furniture piece",
      matchScore: 84, tags: ["Furniture", "Storage"],
      alternatives: [
        { name: "Metal Pipe Shelf Industrial", brand: "Pepperfry", price: 1199, description: "Matte black pipes with wood plank", searchQuery: "industrial pipe shelf", shopLinks: buildShopLinks("Industrial Shelf", "Pepperfry").map(l => ({ store: l.store, url: l.url })) },
        { name: "KALLAX Shelf Unit", brand: "IKEA", price: 3999, description: "Modular cube storage, versatile", searchQuery: "ikea kallax shelf", shopLinks: buildShopLinks("KALLAX Shelf", "IKEA").map(l => ({ store: l.store, url: l.url })) },
      ],
    },
  ];

  const outdoor: AIProduct[] = [
    {
      id: "mock-out-1", name: "Ceramic Garden Pot Set of 3", brand: "Ugaoo",
      description: "Terracotta-style ceramic planters, 3 sizes",
      reason: "Creates a layered planting display", price: 899, originalPrice: 1299,
      category: "Planters", action: "add", searchQuery: "ceramic garden pot set ugaoo", cropUri: null,
      shopLinks: buildShopLinks("Ceramic Pot Set", "Ugaoo"), placementHint: "grouped in a corner or along the railing",
      matchScore: 92, tags: ["Planters", "Garden"],
      alternatives: [
        { name: "Terracotta Pot Pack of 5", brand: "Kraft Seeds", price: 399, description: "Classic unglazed terracotta", searchQuery: "terracotta pot pack", shopLinks: buildShopLinks("Terracotta Pot", "Kraft Seeds").map(l => ({ store: l.store, url: l.url })) },
        { name: "Hanging Planter Basket 3pc", brand: "Nurserylive", price: 649, description: "Macramé + ceramic hanging set", searchQuery: "hanging planter basket", shopLinks: buildShopLinks("Hanging Planter", "Nurserylive").map(l => ({ store: l.store, url: l.url })) },
      ],
    },
    {
      id: "mock-out-2", name: "Solar Garden Light Set of 6", brand: "Greenfield",
      description: "Waterproof solar stake lights, warm white",
      reason: "Adds warm ambiance after sunset without wiring", price: 799, originalPrice: 1499,
      category: "Lighting", action: "add", searchQuery: "solar garden stake lights set 6", cropUri: null,
      shopLinks: buildShopLinks("Solar Garden Light", "Greenfield"), placementHint: "along the garden path or balcony edge",
      matchScore: 89, tags: ["Lighting", "Solar", "Outdoor"],
      alternatives: [
        { name: "Fairy Lights 10m Waterproof", brand: "Philips", price: 549, description: "Warm LED string lights for outdoors", searchQuery: "philips fairy lights waterproof", shopLinks: buildShopLinks("Fairy Lights", "Philips").map(l => ({ store: l.store, url: l.url })) },
        { name: "Outdoor Lantern Set of 2", brand: "Cello", price: 699, description: "Battery powered, rustic look", searchQuery: "outdoor lantern set cello", shopLinks: buildShopLinks("Outdoor Lantern", "Cello").map(l => ({ store: l.store, url: l.url })) },
      ],
    },
    {
      id: "mock-out-3", name: "Weather Resistant Bistro Chair Pair", brand: "Nilkamal",
      description: "UV-stable plastic chairs, stackable",
      reason: "Creates a functional seating spot in unused outdoor space", price: 1899, originalPrice: 2499,
      category: "Furniture", action: "add", searchQuery: "weather resistant bistro chair pair", cropUri: null,
      shopLinks: buildShopLinks("Bistro Chair Pair", "Nilkamal"), placementHint: "near a wall or railing with a small table",
      matchScore: 86, tags: ["Furniture", "Outdoor"],
      alternatives: [
        { name: "Foldable Garden Chair", brand: "Cello", price: 999, description: "Lightweight, easy to store", searchQuery: "foldable garden chair cello", shopLinks: buildShopLinks("Foldable Chair", "Cello").map(l => ({ store: l.store, url: l.url })) },
        { name: "Hammock Cotton Swing", brand: "Swingzy", price: 2499, description: "Portable hanging hammock for balcony", searchQuery: "cotton hammock balcony", shopLinks: buildShopLinks("Hammock", "Swingzy").map(l => ({ store: l.store, url: l.url })) },
      ],
    },
    {
      id: "mock-out-4", name: "Artificial Grass Mat 2x4 ft", brand: "Presto",
      description: "Realistic artificial turf mat, UV resistant",
      reason: "Transforms bare concrete into a lush-looking surface", price: 999, originalPrice: 1799,
      category: "Decor", action: "add", searchQuery: "artificial grass mat 2x4 ft", cropUri: null,
      shopLinks: buildShopLinks("Artificial Grass Mat", "Presto"), placementHint: "on the floor area as a base layer",
      matchScore: 84, tags: ["Outdoor", "Decor"],
      alternatives: [
        { name: "Jute Door Mat Large", brand: "House This", price: 449, description: "Natural jute, weather resistant", searchQuery: "jute mat outdoor", shopLinks: buildShopLinks("Jute Mat", "House This").map(l => ({ store: l.store, url: l.url })) },
        { name: "Outdoor Rug Waterproof 3x5", brand: "IKEA", price: 1499, description: "Flat-woven, easy to clean", searchQuery: "ikea outdoor rug waterproof", shopLinks: buildShopLinks("Outdoor Rug", "IKEA").map(l => ({ store: l.store, url: l.url })) },
      ],
    },
    {
      id: "mock-out-5", name: "Wind Chime Bamboo 5 Tube", brand: "Craft Vatika",
      description: "Handcrafted bamboo wind chime, soothing tones",
      reason: "Adds auditory texture and a natural decorative focal point", price: 349, originalPrice: 599,
      category: "Decor", action: "add", searchQuery: "bamboo wind chime 5 tube craft vatika", cropUri: null,
      shopLinks: buildShopLinks("Bamboo Wind Chime", "Craft Vatika"), placementHint: "hanging from the ceiling or a plant hook",
      matchScore: 82, tags: ["Decor", "Handcrafted"],
      alternatives: [
        { name: "Metal Wind Chime 7 Tube", brand: "Craftter", price: 499, description: "Melodious metal tubes, silver finish", searchQuery: "metal wind chime 7 tube", shopLinks: buildShopLinks("Metal Wind Chime", "Craftter").map(l => ({ store: l.store, url: l.url })) },
        { name: "Ceramic Bell Wind Chime", brand: "Fab India", price: 699, description: "Handpainted ceramic bells", searchQuery: "ceramic wind chime fabindia", shopLinks: buildShopLinks("Ceramic Wind Chime", "Fab India").map(l => ({ store: l.store, url: l.url })) },
      ],
    },
  ];

  const collection: AIProduct[] = [
    {
      id: "mock-col-1", name: "LED Strip Light USB 2m", brand: "Syska",
      description: "RGB LED strip, USB powered, adhesive backing",
      reason: "Adds dramatic backlighting to showcase items", price: 399, originalPrice: 799,
      category: "Lighting", action: "add", searchQuery: "led strip light usb 2m syska", cropUri: null,
      shopLinks: buildShopLinks("LED Strip Light", "Syska"), placementHint: "behind the top shelf as a backlight",
      matchScore: 95, tags: ["Lighting", "Display"],
      alternatives: [
        { name: "LED Neon Flex Strip 1m", brand: "Philips", price: 599, description: "Flexible neon-look LED", searchQuery: "neon flex led strip", shopLinks: buildShopLinks("Neon LED Strip", "Philips").map(l => ({ store: l.store, url: l.url })) },
        { name: "Smart LED Strip 5m WiFi", brand: "Wipro", price: 899, description: "App controlled, 16M colors", searchQuery: "smart led strip wifi wipro", shopLinks: buildShopLinks("Smart LED Strip", "Wipro").map(l => ({ store: l.store, url: l.url })) },
      ],
    },
    {
      id: "mock-col-2", name: "Acrylic Display Risers Set of 6", brand: "Miniso",
      description: "Clear acrylic blocks in 3 heights",
      reason: "Creates depth and levels so every item is visible", price: 699, originalPrice: 1199,
      category: "Display", action: "add", searchQuery: "acrylic display riser set 6", cropUri: null,
      shopLinks: buildShopLinks("Acrylic Display Riser", "Miniso"), placementHint: "under key hero pieces on the shelf",
      matchScore: 93, tags: ["Display", "Organisation"],
      alternatives: [
        { name: "Wooden Display Blocks Set", brand: "Craftster", price: 549, description: "Pine wood cube risers, natural finish", searchQuery: "wooden display blocks set", shopLinks: buildShopLinks("Wooden Display Blocks", "Craftster").map(l => ({ store: l.store, url: l.url })) },
        { name: "Step Display Stand 3-Tier", brand: "Amazon Basics", price: 849, description: "Black ABS 3-tier riser shelf", searchQuery: "step display stand 3 tier", shopLinks: buildShopLinks("Step Display Stand", "Amazon Basics").map(l => ({ store: l.store, url: l.url })) },
      ],
    },
    {
      id: "mock-col-3", name: "Anti-Dust Display Case with Door", brand: "IKEA",
      description: "DETOLF glass cabinet, ideal for collectibles",
      reason: "Protects high-value pieces from dust while keeping them visible", price: 7999, originalPrice: 9999,
      category: "Storage", action: "upgrade", searchQuery: "ikea detolf glass cabinet", cropUri: null,
      shopLinks: buildShopLinks("DETOLF Display Case", "IKEA"), placementHint: "as the centerpiece of your display wall",
      matchScore: 91, tags: ["Display", "Protection"],
      alternatives: [
        { name: "Wall-Mount Shadow Box 30x40cm", brand: "Pepperfry", price: 899, description: "Deep shadow box frame for 3D items", searchQuery: "shadow box 30x40 display", shopLinks: buildShopLinks("Shadow Box", "Pepperfry").map(l => ({ store: l.store, url: l.url })) },
        { name: "Dust Cover Dome with Base", brand: "Craftter", price: 599, description: "Clear dome for single hero piece", searchQuery: "display dome dust cover", shopLinks: buildShopLinks("Dust Cover Dome", "Craftter").map(l => ({ store: l.store, url: l.url })) },
      ],
    },
    {
      id: "mock-col-4", name: "Gradient Backdrop Paper Roll", brand: "PhotoStudio",
      description: "Seamless gradient background paper, 1.35m wide",
      reason: "Creates a professional, distraction-free backdrop for photography and display", price: 799, originalPrice: 1499,
      category: "Backdrop", action: "add", searchQuery: "gradient backdrop paper roll studio", cropUri: null,
      shopLinks: buildShopLinks("Backdrop Paper Roll", "PhotoStudio"), placementHint: "mounted on the back wall behind the collection",
      matchScore: 87, tags: ["Display", "Photography"],
      alternatives: [
        { name: "Vinyl Marble Backdrop 60x90cm", brand: "Inditradition", price: 349, description: "Flat vinyl sheet, marble print", searchQuery: "vinyl marble backdrop photo", shopLinks: buildShopLinks("Marble Backdrop", "Inditradition").map(l => ({ store: l.store, url: l.url })) },
        { name: "Pegboard 60x90cm with Hooks", brand: "Amazon Basics", price: 1299, description: "Organise and display accessories", searchQuery: "pegboard 60x90 with hooks", shopLinks: buildShopLinks("Pegboard with Hooks", "Amazon Basics").map(l => ({ store: l.store, url: l.url })) },
      ],
    },
    {
      id: "mock-col-5", name: "Label Maker + Tape Bundle", brand: "Dymo",
      description: "Handheld label printer, includes 3 tape cartridges",
      reason: "Clean, consistent labelling adds a polished collector's look", price: 1499, originalPrice: 2499,
      category: "Organisation", action: "add", searchQuery: "dymo label maker tape bundle", cropUri: null,
      shopLinks: buildShopLinks("Label Maker Bundle", "Dymo"), placementHint: "used to label each display section",
      matchScore: 83, tags: ["Organisation", "Collector"],
      alternatives: [
        { name: "Label Maker M110", brand: "Brother", price: 1199, description: "Compact, USB rechargeable", searchQuery: "brother label maker m110", shopLinks: buildShopLinks("Label Maker M110", "Brother").map(l => ({ store: l.store, url: l.url })) },
        { name: "Adhesive Label Stickers Pack 500", brand: "Avery", price: 299, description: "Handwrite or print, clean finish", searchQuery: "avery label stickers 500", shopLinks: buildShopLinks("Adhesive Labels", "Avery").map(l => ({ store: l.store, url: l.url })) },
      ],
    },
  ];

  const pool = spaceType === "outdoor" ? outdoor : spaceType === "collection" ? collection : indoor;
  return pool.filter(p => p.price <= budget).slice(0, 5);
}
