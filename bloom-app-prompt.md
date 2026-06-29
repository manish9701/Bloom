# Bloom — App Build Prompt

## What it is

**Bloom** is an AI vibe curator mobile app (React Native / Expo, iOS + Android, India-first). You photograph any space, outfit, or collection. It analyses the image, recommends curated shoppable products within your budget, then generates a photorealistic AI composite showing the space with those products already styled in. Finished results save to a personal gallery.

**App name**: Bloom  
**Tagline**: "Your vibe, reimagined."  
**Eyebrow**: ✦ AI VIBE CURATOR  
**Fine print**: "Rooms · Landscapes · Clothing · Collections & more"

---

## Design System

**Colours**
- `forest` #1C3A2E — primary brand, deep green
- `sage` #7A9E82 — secondary, muted text, accents
- `cream` #F4EFE6 — page backgrounds
- `linen` #EDE7DA — card backgrounds, skeletons
- `terracotta` #C4714A — prices, CTAs, badges, highlights
- `charcoal` #1A1A1A — body text
- `white` #FFFFFF

**Typography**: Geist (display/headings — Bold, Bold Italic, SemiBold) + DM Sans (body — Light, Regular, Medium, SemiBold). Never system fonts.

**Radii**: cards 20 · pills 100 · inputs 14 · badges 6  
**Card shadow**: `shadowColor #1C3A2E, offset 0/4, opacity 0.10, radius 24, elevation 6`  
**CTA shadow**: `shadowColor #1C3A2E, offset 0/12, opacity 0.35, radius 40, elevation 14`

---

## Screens

### Screen 1 — Homepage

Full-screen vertical `LinearGradient`: `#F4EFE6 → #D6CFC3 → #2E4A3C` (cream to warm grey to forest). Fades in on mount.

**Header**: Bloom logo (32×32) left. "Gallery" pill right — text only, no icon, `rgba(0,0,0,0.30)` bg, `rgba(255,255,255,0.18)` border, white text, borderRadius 100.

**Bottom-anchored content**:
1. Recent Curations strip — horizontal scroll of up to 3 saved glow-up thumbnails (110×82, rounded corners, gradient overlay, vibe + date label). Hidden if gallery is empty.
2. Hero text — eyebrow `✦ AI VIBE CURATOR` in forest/sage, then large bold title `Your vibe,` / `reimagined.` (last word italic) in white at fontSize 40. Sub-copy in `rgba(244,239,230,0.82)` below.
3. Two CTA pill buttons — "Upload Photo" (60% width, white bg, charcoal text, heavy shadow) + "Camera" (40% width, dark blur bg, white text, `rgba(255,255,255,0.35)` border). No icons on either.
4. Fine print centered: "Rooms · Landscapes · Clothing · Collections & more" in white 40% opacity.

---

### Screen 2 — Scanning

Full forest-green background. User's photo in a rounded frame (borderRadius 24, `rgba(255,255,255,0.12)` border) with a scan overlay:
- Subtle grid lines (rgba white 6%)
- Animated scan line sweeping top-to-bottom every 2.5s in sage
- Corner bracket decorations in sage
- 3 chips cycling below: "🌿 Vibe" / "🎨 Palette" / "📦 Items" — one active at a time every 1.2s

Below the frame: headline "Reading your vibe..." (italic, Geist 28px, white, shimmer opacity animation) + sub-copy + indeterminate progress bar.

---

### Screen 3 — Analysis + Budget

Cream background. User's photo bleeds edge-to-edge at top, `height: H * 0.50`, `backgroundColor: #0C0B0F`, `contentFit: "cover"`. Dark gradient overlay at top 30% for header legibility. Floating header overlaid: logo left, Gallery + New(+) pills right (both `rgba(0,0,0,0.38)` bg). "tap to view" hint badge bottom-center. Tap anywhere on hero → ImageViewer.

Scrollable content below:
- **AI Analysis card** (white, raised shadow): sparkles icon + "AI ANALYSIS" eyebrow, summary text in Geist 18px SemiBold, 2 strength bullet points.
- **Detected Items** horizontal scroll: 60×60 cropped thumbnails per detected item, label + confidence %. Shimmer while loading.
- **Budget slider card**: range ₹1k–₹50k, custom PanResponder slider with white/forest thumb, snaps to round values (±₹500 below ₹2k, ±₹1k below ₹10k, ±₹5k above).
- **Style Direction** (optional): wand-icon text input + horizontal chip scroll — Japandi / Warm Boho / Modern Luxe / Maximalist / Scandi / Dark Academia. Forest bg when active.
- **CTA**: full-width forest pill button "✦ Show Suggestions →", cream text, height 58, CTA shadow.

---

### Screen 4 — Recommendations

**Hero** (top, `height: H * 0.46`): shows original photo, crossfades to AI composite after reimagining. Tap → ImageViewer. Back button top-left. Gallery + New(+) top-right. Room category label + vibe pill bottom-left. After first reimagine: Before/After pill toggle appears bottom-right (terracotta active state). AI spinner shown during composite generation.

**Stats bar** (below hero, white): 3 columns — Selected count | Total ₹ vs budget | Style fit %. Terracotta if over budget.

**Section header**: eyebrow only — "CURATED PRODUCTS FOR YOU". Sub: "Tap card to shop · toggle to include" in sage.

**2-column product grid**, each card `height: 264`, borderRadius 20, white bg:
- Top 148px: product image (AI-generated) or warm shimmer skeleton or icon fallback. Tap → ImageViewer.
- Badge top-left: NEW / SWAP / UPGRADE in terracotta or forest.
- Select ring top-right: circle outline, fills terracotta with ✓ when selected.
- Bottom body: brand (9px uppercase sage) · product name (13px Geist SemiBold forest, 2 lines) · price in terracotta + struck-through original price in sage · 3px match % progress bar (sage→forest gradient). Tap body → Shop sheet.

Shimmer skeleton cards while loading (warm LinearGradient animated).

**Product images**: loaded via `generateProductImage(name, brand, category)` in a concurrency queue — max 2 in-flight at a time so first cards appear fast. Fallback: icon placeholder.

**Style direction bar** below grid: collapsed shows current prompt, tap to expand inline text input + terracotta apply button.

**Sticky "Reimagine this →"** floats at bottom over scroll content (no background section). White when idle, forest when selection is dirty. Disabled at 55% opacity when loading.

**Shop bottom sheet** (slide-up Modal): product hero image (`contentFit: contain`, linen bg) · brand/name/price/discount pill · alternatives horizontal chip row · Why it works / Style match / Placement / Tags sections · Amazon (orange #FF6B00) + Flipkart (blue #2874F0) shop buttons.

**ImageViewer** (full-screen Modal): solid `#000` bg covering status bar (`statusBarTranslucent` + `StatusBar hidden`). PanResponder swipe-down to dismiss — only captures `Math.abs(dy) > Math.abs(dx) * 2.5` so horizontal tag ScrollView still works. Top bar: Close + Before/After toggle. Centre: `contentFit="contain"` full W×H. Bottom: horizontal scrollable product name tags + "Swipe down to close" hint.

---

### Screen 5 — Gallery

2-column grid of saved glow-ups. Card: composite image, vibe label, date, product count. Tap → Gallery Detail. Navigate by ID only — never pass full JSON as URL params.

### Screen 6 — Gallery Detail

Loads from store by ID. Composite hero image, original/composite toggle, product list below.

---

## AI (OpenRouter)

- **Vision**: `google/gemini-2.5-flash` — space analysis + product recommendations
- **Image**: `google/gemini-2.5-flash-image` — composite generation + product photos

**`analyzeSpace(imageUri)`** → items[], vibe, palette, issues, strengths, summary, category, spaceType  
**`getAIProductRecommendations(...)`** → AIProduct[] with id, name, brand, price, originalPrice, action (add/replace/upgrade), shopLinks (Amazon+Flipkart), placementHint, matchScore 0–100, tags, alternatives[]  
**`generateComposite(imageUri, products[], vibe)`** → { success, compositeUri }  
**`generateProductImage(name, brand, category)`** → uri (run in concurrency-2 queue)  
**`cropDetectedItems(imageUri, items[])`** → Record<label, croppedUri>

---

## Data & Navigation

Store: AsyncStorage. `saveGlowUp` · `getGallery` · `getGlowUpById(id)`.

GlowUp shape: `id, imageUri, compositeUri, variations[], label, vibe, score, date, productCount, products[], productImages{}, selectedIds[], analysisJson`

Navigation: Home tab (3 states in one file: no image → scanning → analysis) → `/recommendations` → `/gallery-detail?id=`. Gallery tab → same detail screen. Always navigate by ID, load data from store.

---

## Stack & Config

React Native (Expo ~52), Expo Router ~4, expo-image, expo-linear-gradient, expo-blur, expo-image-picker, expo-haptics, react-native-safe-area-context, @expo-google-fonts/geist, @expo-google-fonts/dm-sans, @react-native-async-storage/async-storage.

Env var: `EXPO_PUBLIC_OPENROUTER_KEY`

---

## Feel

Premium editorial — Kinfolk meets Zara Home. Every transition is intentional: images crossfade, buttons scale on press, loading uses warm shimmer skeletons not spinners. The gradient homepage fading into deep forest green is the centrepiece. Cream and terracotta warmth runs through every screen. Haptics on key interactions. Auto-saves to gallery silently after every reimagine.
