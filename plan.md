# VibeCurator — Major Feature Expansion Plan

## What we're solving

The app currently only does "rooms" and has a rough, unfinished design. We're expanding it into a **universal space styler** (rooms, gardens, kitchens, workspaces, landscapes, collections) with a polished premium design, smarter image handling, multiple product options per item, and an editable gallery.

***

## 1. Universal Space Types

### Problem

`analyzeSpace()` and `getAIProductRecommendations()` are hardcoded to Indian home rooms. Garden, kitchen, workspace, Lego collection, car shelf — all fail gracefully but give generic/irrelevant suggestions.

### Plan

**A. Space type detection auto-magic**

* Gemini already returns `category` from `analyzeSpace()`. Extend the prompt to cover:

  * Indoor: `Living Room`, `Bedroom`, `Kitchen`, `Home Office / Workspace`, `Bathroom`, `Kids Room`

  * Outdoor: `Garden / Balcony`, `Terrace / Rooftop`, `Landscape`

  * Collections: `Lego Collection`, `Diecast / Hot Wheels`, `Books / Shelf`, `Figurines / Display`

  * Commercial: `Café / Restaurant`, `Retail Store`, `Gym`

* Return `spaceType` field: `"indoor"` | `"outdoor"` | `"collection"`

**B. Category-aware product recommendations**

* In `getAIProductRecommendations()`, pass `spaceType` to tailor the prompt:

  * `indoor` → current flow (furniture, lighting, decor, textiles)

  * `outdoor` → planters, garden lights, weather furniture, irrigation, lawn decor

  * `collection` → display cases, LED lighting, risers, organisers, protective cases, backdrop sheets

* Add `spaceType` to `AnalysisResult` type

**Files**: `lib/aiService.ts`

***

## 2. Design Overhaul

### Problem

Fonts are default, layouts feel incomplete, icons are small, cards don't breathe, hero sections are mediocre.

### Plan

**A. Fonts — load Poppins**

* `app/_layout.tsx`: add `useFonts` with `Poppins_400Regular`, `Poppins_600SemiBold`, `Poppins_700Bold`, `Poppins_900Black`

* Return `null` (splash hold) until fonts load

* Add font tokens to `theme.ts`: `fonts.display`, `fonts.heading`, `fonts.body`, `fonts.label`

* Apply across all screens — headings use `Poppins_900Black`, subheadings `Poppins_700Bold`, body `Poppins_400Regular`

**B. Home screen (`index.tsx`) polish**

* Hero section: larger title, tighter type scale, better CTA button with shimmer

* Space type quick-pick chips below hero (Garden, Kitchen, Workspace, Collection, etc.) — tap to pre-set prompt

* Analysis card: more visual — show palette swatches bigger, item chips more styled

* Empty state: center-aligned with better illustration feel

**C. Recommendations screen (`recommendations.tsx`) polish**

* Product cards: add proper elevation/shadow, rounded-xl corners, better image container with skeleton

* Before/after toggle: pill style, proper active indicator

* Restyle button: full-width with gradient, cleaner

* Bottom sheet: bigger product image area (240px), better section dividers

**D. Tab bar**

* Icons: increase size to 24, add a subtle background pill on active tab

* Tab labels: Poppins\_600SemiBold

**E. Gallery**

* Cards: slight parallax on scroll, better gradient, richer card footer

* Detail screen: clean two-panel before/after view

**Files**: `app/_layout.tsx`, `lib/theme.ts`, `app/(tabs)/index.tsx`, `app/recommendations.tsx`, `app/(tabs)/gallery.tsx`, `app/gallery-detail.tsx`, `app/(tabs)/_layout.tsx`

***

## 3. Full-Image Viewer

### Problem

Product images are small thumbnails. Composite/room images are not viewable full-screen. Users can't zoom or inspect.

### Plan

**A. Image viewer modal (new component)**

* Create `components/ImageViewer.tsx`: full-screen modal with:

  * Pinch-to-zoom using `react-native-gesture-handler` (already installed) + `react-native-reanimated` (already installed)

  * Single tap to dismiss

  * Share button (top-right)

  * Image source + caption prop

**B. Wire up on tap**

* Hero image in recommendations → tap to open full screen composite/before

* Product image in bottom sheet → tap to expand

* Gallery card → short-press = detail, long-press = full image

* Gallery detail hero → tap to open full screen

**Files**: new `app/components/ImageViewer.tsx`, wire in `recommendations.tsx`, `gallery.tsx`, `gallery-detail.tsx`

***

## 4. Multiple Product Options (Alternatives)

### Problem

Each card shows one product. User might not like that specific item but would take an alternative.

### Plan

**A. `AIProduct` type extension** Add `alternatives?: AIProductAlternative[]` field:

```
type AIProductAlternative = {
  name: string;
  brand: string;
  price: number;
  description: string;
  searchQuery: string;
  shopLinks: ShopLink[];
}
```

**B. `getAIProductRecommendations()` prompt update**

* Ask AI to return 2-3 alternatives per product in the JSON

* Structure:

  ```
  {
    "name": "...",
    "alternatives": [
      { "name": "...", "brand": "...", "price": 999 },
      { "name": "...", "brand": "...", "price": 1499 }
    ]
  }
  ```

**C. UI — Alternatives swiper in bottom sheet**

* In `ShopSheet`, below the product hero image: horizontal scroll of alternative chips (brand + price)

* Tap an alternative → swap displayed product name/price/links in the sheet

* Swipe carousel of 3 alternatives (small cards: brand, name, price, shop button)

* Active alternative highlighted with accent border

**Files**: `lib/aiService.ts` (types + prompt), `app/recommendations.tsx` (ShopSheet component)

***

## 5. Gallery — Show Products + Edit Curation

### Problem

Gallery detail shows no products. Users can't revisit or modify their curation.

### Plan

**A. Extend `GlowUp` type to store products**

```
type GlowUp = {
  ...existing...
  products?: AIProduct[];           // saved selected products
  selectedIds?: string[];           // which were toggled on
}
```

**B. Save products when compositing**

* In `runComposite()` in `recommendations.tsx`, pass `products` array to `saveGlowUp()`

**C. Gallery detail screen — products section**

* After stats row, add "Products in this look" section

* Horizontal scroll of product mini-cards (image if available, name, brand, price, shop link)

* Each card is tappable → opens product detail sheet (reuse `ShopSheet` component)

**D. "Edit this look" button**

* In gallery detail, add an "Edit Curation" button

* Navigates back to `recommendations` screen with the original `imageUri`, `analysis` and pre-filled `selectedIds`

* Recommendations screen needs to accept `initialSelectedIds` param to pre-check the right cards

**Files**: `lib/mockData.ts` (GlowUp type), `lib/store.ts` (updated save), `app/recommendations.tsx` (save products, accept initialSelectedIds), `app/gallery-detail.tsx` (products section + edit button)

***

## 6. Fix: Eager Product Images + Delta Composite (Carried Over)

These were pending from last session:

**A. Eager images** — Already implemented in last session (`eagerLoadProductImages`). Verify it's correct. ✓

**B. Delta composite** — `runComposite()` currently always composites from original `imageUri`. Keep as-is (delta was premature optimisation — Gemini API doesn't actually support stateful edits, passing prev composite + "only add X" works but is fragile). Instead, add a clear loading indicator and make the "Restyle" UX cleaner.

***

## Execution Order

1. **`lib/aiService.ts`** — spaceType, alternatives in products, updated prompts

2. **`lib/mockData.ts`** — extend GlowUp type

3. **`lib/store.ts`** — save products with GlowUp

4. **`lib/theme.ts`** — add font tokens

5. **`app/_layout.tsx`** — load Poppins fonts

6. **`app/(tabs)/_layout.tsx`** — tab bar polish

7. **`app/components/ImageViewer.tsx`** — new full-screen image component

8. **`app/(tabs)/index.tsx`** — space type chips, design polish

9. **`app/recommendations.tsx`** — alternatives in sheet, design polish, save products

10. **`app/(tabs)/gallery.tsx`** — design polish

11. **`app/gallery-detail.tsx`** — products section, edit button

***

## Verification

* TypeScript: `npx tsc --noEmit` passes clean after all changes

* No new packages needed (gesture handler + reanimated already installed)

* All screens render in Expo Go without crashes

* AI prompts updated but mock fallbacks still work offline

***

## Scope Not Included (Defer)

* Real-time image search for products (needs separate API)

* AR placement (needs ARKit/ARCore)

* Social sharing of curated spaces

* Push notifications

* User accounts / cloud sync
