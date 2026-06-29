# 🌸 BLOOM — Premium Design Overhaul
### AI Vibe Curator · Mobile App (Expo/React Native)
### Complete Screen-by-Screen Design Prompt · v2.0

---

## WHAT BLOOM IS

Bloom is **not** a room stylist. Bloom is a **vibe curator** — an AI that reads the aesthetic soul of *anything* you point it at and finds the perfect pieces to complete, enhance, or transform it. Point it at your living room, your garden, your wardrobe, your sneaker collection, a shelf of toys, a tabletop setup, a café corner. If it has a vibe, Bloom sees it.

This distinction matters for every word of copy in this document.

---

## DESIGN SYSTEM FOUNDATION
> Establish this first. Every screen inherits from here.

### Color Palette

| Token | Hex | Usage |
|---|---|---|
| `--forest` | `#1C3A2E` | Primary CTA, headers, active states |
| `--sage` | `#7A9E82` | Secondary labels, icons, muted accents |
| `--cream` | `#F4EFE6` | App background, card fills |
| `--linen` | `#EDE7DA` | Subtle card backgrounds, dividers |
| `--terracotta` | `#C4714A` | "NEW" badge, warm accent, highlights |
| `--charcoal` | `#1A1A1A` | Body text, primary type |
| `--mist` | `#F9F7F3` | Elevated card backgrounds |
| `--white` | `#FFFFFF` | Top-layer elements, modals |
| `--forest-10` | `rgba(28,58,46,0.10)` | Ghost fills, tinted backgrounds |
| `--shadow` | `rgba(28,58,46,0.10)` | Consistent shadow color |

### Typography

```
Display / Hero Headlines:
  Font: Cormorant Garamond
  Weights: 400 (Regular), 600 (SemiBold), 700 (Bold)
  Use for: all large headings, price highlights, editorial moments

Body / UI:
  Font: DM Sans
  Weights: 300 (Light), 400 (Regular), 500 (Medium), 600 (SemiBold)
  Use for: labels, body text, buttons, navigation

Accent / Eyebrow Labels:
  Font: DM Sans 500
  Style: UPPERCASE · letter-spacing: 2.5px · font-size: 10–11px
  Use for: section labels like "CURATED FOR YOU", "AI ANALYSIS"
```

### Spacing & Shape Language

- Base unit: `8px`
- Border radius: Cards `20px` · Buttons `100px (pill)` · Chips `100px` · Inputs `14px`
- Card shadow: `0 4px 24px rgba(28,58,46,0.10)`
- Elevation shadow: `0 8px 40px rgba(28,58,46,0.14)`
- Safe zones: `20px` horizontal padding on all screens (consistent — not 16, not 24)

### Iconography

- Style: Phosphor Icons (thin/light weight, 1.5px stroke) OR custom fine-line
- **The Bloom flower logo:** Keep the existing 6-petal flower icon — it's perfect. Do NOT redesign it. Use `--forest` on light backgrounds, cream on dark backgrounds. Pair with the "bloom" wordmark in Cormorant Garamond 500 to the right.
- Icon size in nav: `22px`

### Motion Principles

- Default easing: `cubic-bezier(0.25, 0.46, 0.45, 0.94)`
- Duration: Micro-interactions `150ms`, Screen transitions `320ms`, Reveals `500ms`
- Page entry: Staggered fade-up (delay: `0ms`, `80ms`, `160ms`)
- Button press: Scale `0.97` on `150ms`
- No abrupt cuts. Everything breathes.

---

---

## SCREEN 1: HOMEPAGE

### Current Issues
- Eyebrow label "AI ROOM STYLING" is wrong — Bloom is not a room stylist
- Subheadline "get curated product picks · visualise instantly" is vague and passive
- The Gallery icon in the top-right should feel more distinctive — add a small theme/palette icon alongside it
- Hero headline needs to reflect the new positioning
- Footer hint text still says "rooms and offices"

---

### What to Build

**OVERALL FEEL:** Think Kinfolk magazine meets a luxury styling app. An editorial, warm, full-bleed hero with breathing room and a sense of discovery. The copy must feel like a creative tool for *everything*, not just interiors.

---

### Hero Background

**Option A (Recommended — Editorial Lifestyle):**
A high-quality photograph that *isn't* just a room — something that shows the range of Bloom's capabilities: a flat-lay of clothing beside a plant, or a styled garden corner, or a beautifully arranged shelf. Warm afternoon light, natural tones, aspirational but attainable. The image should be portrait-oriented, high-res.

Pinterest direction: `"editorial lifestyle flat lay warm tones"` or `"styled outdoor space natural light photography"` or `"curated shelf arrangement photography"`.

**Option B (Gradient Mesh — No Photo):**
A custom gradient mesh background: `#F4EFE6` (cream) at top → warm `#D6CFC3` at center → soft forest-green undertones `#2E4A3C` in the bottom quarter. Subtle grain texture overlay at 4% opacity (noise SVG filter).

**Overlay (apply over whichever bg):**
Linear gradient `transparent` at top 40% → `rgba(18, 32, 24, 0.82)` at bottom. Text always readable, hero always breathes.

---

### Header Bar

```
Layout: horizontal, transparent bg, 20px horizontal padding, 56px height
Left:   Bloom flower logo (fine line, cream) 
        + "bloom" wordmark — Cormorant Garamond 500, cream, 18px
        · Flower + wordmark together at 32px height
Right:  Gallery icon button — frosted glass pill
        (backdrop-filter: blur(12px), bg: rgba(255,255,255,0.15), 
        border: 1px solid rgba(255,255,255,0.20), border-radius: 100px, 
        padding: 8px 14px)
        · Inside: photo-stack icon (22px, cream) + optional small palette 
          circle icon (showing 3 stacked color dots: cream/sage/terracotta)
          These sit together separated by a subtle vertical divider (1px, rgba(255,255,255,0.20))
        · "Gallery" label in DM Sans 12px cream
```

---

### Hero Text Block

Position: Bottom 28% of screen, 20px from left, above CTAs.

```
EYEBROW LABEL:
  Text: "✦  AI VIBE CURATOR"
  Font: DM Sans 500, 10px, letter-spacing: 3px, UPPERCASE
  Color: rgba(244,239,230,0.65) — cream at 65% opacity
  No background chip. Just the text. The "✦" is sage green (#7A9E82).
  Margin-bottom: 12px

HEADLINE:
  Line 1: "Your vibe,"
  Line 2: "reimagined."
  Font: Cormorant Garamond 700, 54px, line-height: 1.05
  Color: #FFFFFF
  Line 2 in Cormorant Garamond Italic — the single italic word 
  creates an editorial, high-fashion feeling.
  Margin-bottom: 10px

SUBHEADLINE:
  Text: "Curated picks for anything you love. Visualise the transformation."
  Font: DM Sans 300, 15px, line-height: 1.5
  Color: rgba(244,239,230,0.70)
  Margin-bottom: 32px
```

---

### CTA Buttons

Both buttons sit in `flexDirection: row`, `gap: 12px`, full-width.

```
PRIMARY — Upload Photo:
  Width: 60% of container
  Height: 56px
  Background: #FFFFFF
  Border-radius: 100px (pill)
  Shadow: 0 8px 32px rgba(0,0,0,0.20)
  Content: [Photo-stack icon 20px charcoal] + "Upload Photo"
  Font: DM Sans 600, 15px, color: #1A1A1A
  Icon gap: 8px

SECONDARY — Camera:
  Width: remaining 40% minus gap
  Height: 56px
  Background: rgba(255,255,255,0.12)
  Border: 1.5px solid rgba(255,255,255,0.35)
  Backdrop-filter: blur(10px)
  Border-radius: 100px (pill)
  Content: [Camera icon 20px white] + "Camera"
  Font: DM Sans 500, 15px, color: #FFFFFF
```

---

### Footer Hint

```
Text: "Works with rooms, wardrobes, gardens, collections & more"
Font: DM Sans 300, 12px
Color: rgba(255,255,255,0.40)
Alignment: center
Margin-top: 16px from buttons
```

---

### Micro-detail

Add a very subtle animated shimmer: 4–5 tiny circular dots (3px, `rgba(255,255,255,0.20)`) that slowly drift upward. Creates a "living" quality without distracting.

---

---

## SCREEN 2: SCANNING SCREEN

### Current Issues
- The uploaded image must be visible and prominent — this is the first "your thing" moment
- Status card at bottom is a plain white rectangle with a dash loader — feels like a skeleton
- "Scanning image..." is boring and doesn't build anticipation
- The cream background peeking below the image breaks immersion

---

### What to Build

**OVERALL FEEL:** The moment of magic. Bloom is reading the user's uploaded photo. Make it feel like an intelligent, living system is at work — not just a spinner.

---

### Layout

```
Background: #1C3A2E (forest green) — full bleed, not cream.
This single change lifts the entire screen's premium quality.
```

---

### Header

```
Left: Bloom flower logo + "bloom" wordmark, cream
Right: Frosted glass chip with gallery icon + "Gallery"
Background: transparent (forest green shows through)
```

---

### Main Image Display

```
Container:
  Margin: 20px horizontal, 16px top from header
  Border-radius: 24px
  Overflow: hidden
  Border: 1.5px solid rgba(255,255,255,0.12)

THE USER'S UPLOADED/CAPTURED IMAGE fills this container.
This is critical — the image must be visible here, not blank.
Aspect ratio: natural (maintain the uploaded photo's ratio)
Max-height: ~55vh so scanning UI always has room below

SCANNING OVERLAY (animated, sits on top of image):
  A subtle grid of white lines —
  12 horizontal + 12 vertical at rgba(255,255,255,0.06)
  A single horizontal scan line (2px, gradient: transparent → 
  rgba(122,158,130,0.80) → transparent) sweeping slowly 
  top-to-bottom in a 2.5s loop.
  
CORNER ACCENTS:
  4 L-shaped brackets (16px each side, 2px stroke, #7A9E82)
  at each corner of the image, like a camera focus frame.
  Animate: scale 1.1 → 1.0 on mount (300ms ease).

CLOSE BUTTON:
  Top-right of image: circle 32px, rgba(0,0,0,0.40), 
  backdrop-blur(8px), "×" in white DM Sans 18px.
```

---

### Status Card (Bottom)

This is the hero moment of this screen.

```
Container:
  Position: absolute, bottom 0, full width
  Background: linear-gradient(to top, #1C3A2E 60%, transparent)
  Padding: 32px 24px 48px
  No card border — blends into the dark background.

ANIMATED LABEL ROW:
  3 pill chips animating in sequence (stagger: 0ms, 400ms, 800ms):
  
  Chip 1: "🌿 Vibe"
  Chip 2: "🎨 Palette"
  Chip 3: "📦 Items"
  
  Inactive: border 1px sage, bg transparent, label sage, 12px DM Sans
  Active: bg sage, white label, subtle glow
  Each chip pulses when active, dims as next activates.
  flexRow, gap: 8px, margin-bottom: 20px

HEADLINE:
  Text: "Reading your vibe..."
  Font: Cormorant Garamond 600 Italic, 28px, white
  Shimmer animation: white highlight sweeps text left-to-right every 2s

SUBTEXT:
  Text: "Detecting items, vibe & colour palette"
  Font: DM Sans 300, 14px, rgba(244,239,230,0.55)
  Margin-top: 6px

PROGRESS BAR:
  Width: full, height: 2px
  Background: rgba(255,255,255,0.10)
  Fill: animated gradient (sage → white) growing 0% → ~70% over 3s,
  then pulsing gently (indeterminate feel)
  Border-radius: 100px
  Margin-top: 20px
```

---

---

## SCREEN 3: AI ANALYSIS + BUDGET

### Current Issues
- The uploaded image must show at the top — the empty space here is a bug, but the design must handle it gracefully with a beautiful shimmer skeleton
- "AI ANALYSIS" card has a generic left-border accent — clinical, not premium
- Detected product thumbnails have clashing multi-color percentage labels (orange, purple, yellow) — standardise to sage
- Budget slider is bare-bones
- Style direction input is a plain box
- The section label still says "DETECTED IN YOUR SPACE" — must not say "space"

---

### What to Build

**OVERALL FEEL:** The "insight moment." Bloom has seen the thing and is sharing what it found. Warm, intelligent, editorial — not clinical.

---

### Image Hero (Top Section)

```
Height: 240px
Border-radius: 0 0 28px 28px (rounded at bottom, bleeds from top)
THE USER'S UPLOADED IMAGE fills this hero fully.

Bottom gradient overlay: rgba(18,32,24,0) → rgba(18,32,24,0.65) from 50% down

IMAGE LOADING / ERROR STATE (for the known bug):
  Show a beautiful skeleton:
  Background: linear-gradient(135deg, #E8E2D9, #D6CFC3, #E8E2D9)
  Animated shimmer sweeping left-to-right
  Centered: "✦" in sage + "LOADING" in DM Sans 11px letter-spaced
  This must display immediately — never a blank void.
```

---

### AI Analysis Card

```
Container:
  Margin: -20px 16px 0 16px (overlaps hero slightly — layered effect)
  Background: #FFFFFF
  Border-radius: 20px
  Padding: 20px
  Shadow: 0 8px 32px rgba(28,58,46,0.12)
  NO left-border accent — remove it entirely

EYEBROW:
  [Animated ✦ icon in forest green, slow spin or pulse] + "AI ANALYSIS"
  DM Sans 600, 10px, letter-spacing: 2.5px, UPPERCASE, color: #7A9E82
  Margin-bottom: 12px

ANALYSIS TEXT (Main Insight):
  1–2 sentences max displayed as hero insight.
  Font: Cormorant Garamond 500, 18px, line-height: 1.45, color: #1A1A1A

BULLET POINTS:
  [Forest green dot 6px] + text
  DM Sans 400, 13px, color: #4A4A4A, line-height: 1.5
  Max 2 bullets. "See more ↓" in sage 12px if more exist.
```

---

### Detected Items Section

```
SECTION LABEL:
  "DETECTED IN YOUR PHOTO"
  DM Sans 500, 10px, letter-spacing: 2.5px, UPPERCASE, color: #7A9E82
  Margin: 24px 0 12px

  (Not "DETECTED IN YOUR SPACE" — use "PHOTO" or "SCENE")

HORIZONTAL SCROLL ROW:
  4–6 items, gap: 10px, horizontal padding: 16px
  
  Each item:
    Container: width 72px, align center
    Image: 60×60px, border-radius: 14px, border: 1.5px solid #EDE7DA
    Shadow: 0 2px 10px rgba(0,0,0,0.08)
    Loading state: shimmer gradient #E8E2D9 → #D6CFC3 → #E8E2D9
    Label: DM Sans 500, 11px, color: #1A1A1A, marginTop: 6px, 1 line max
    Confidence %: DM Sans 400, 11px, color: #7A9E82
    ALL confidence labels same color — NO orange/purple/yellow.
```

---

### Budget Section

```
SECTION LABEL:
  "YOUR BUDGET"
  Same eyebrow style. Margin: 24px 0 8px.

BUDGET DISPLAY (centered above slider):
  "₹10k"
  Cormorant Garamond 700, 36px, color: #1C3A2E
  Subtext: "of ₹50k max" in DM Sans 300, 12px, sage

SLIDER:
  Track height: 6px
  Track color: #EDE7DA
  Fill: linear-gradient(to right, #7A9E82, #1C3A2E)
  Thumb: 26px circle, white, border: 2px solid #1C3A2E,
         inner dot: 8px forest green
         Shadow: 0 4px 12px rgba(28,58,46,0.25)
  
  Range labels below track:
  "₹1k" left, "₹50k" right, DM Sans 300, 12px, sage
```

---

### Style Direction Input

```
SECTION LABEL:
  "STYLE DIRECTION  ·  optional"
  Same eyebrow style. Margin: 24px 0 8px.

INPUT FIELD:
  Background: #F4EFE6 (cream)
  Border: 1.5px solid #EDE7DA
  Border-radius: 14px
  Height: 52px
  Padding: 0 16px
  
  Left icon: wand/sparkle 18px sage
  Placeholder: "e.g. warm boho, minimal japandi, maximalist..."
  Font: DM Sans 300 Italic, 14px, rgba(26,26,26,0.35)

QUICK STYLE CHIPS (horizontal scroll, below input):
  ["Japandi", "Warm Boho", "Modern Luxe", "Maximalist", "Scandi", "Dark Academia"]
  Inactive: border 1px #D6CFC3, bg transparent, 
            DM Sans 400 13px charcoal, padding 6px 14px, radius 100px
  Active: bg #1C3A2E, border forest, text cream
```

---

### CTA Button

```
"✦  Show Suggestions  →"
  Width: full (minus 20px each side)
  Height: 58px
  Background: #1C3A2E
  Border-radius: 100px
  Font: DM Sans 600, 16px, color: #F4EFE6
  Icon: sparkle (✦) left, arrow right
  Shadow: 0 12px 40px rgba(28,58,46,0.35)
  Press state: scale 0.97, shadow reduces
  Margin-bottom: 40px (safe area)
```

---

---

## SCREEN 4: CURATED PICKS (Before Reimagine)

### Current Issues
- Product card images are blank — implement shimmer skeleton while loading, show actual product images once loaded
- "NEW" badge uses generic green — switch to terracotta
- Stats row (5 / ₹4,945 / 87%) is just text with pipe separators — needs visual presence
- Bottom CTA says "Reimagine this space" — remove "space"
- Brand name above product is tiny and overlooked

---

### What to Build

**OVERALL FEEL:** An editorial shopping experience — a premium design magazine that lets you shop. Each product card is a carefully curated recommendation, not a marketplace listing.

---

### Hero (Uploaded Photo + Stats)

```
HERO IMAGE:
  Height: 220px
  Full width, no horizontal margins
  Border-radius: 0 0 24px 24px
  THE USER'S UPLOADED IMAGE here (not a placeholder)
  Gradient overlay: bottom 50% → rgba(18,32,24,0.70)

TOP OVERLAY BAR (absolute, top of hero):
  Padding: 16px 20px, paddingTop: 48px (safe area)
  FlexRow, space-between
  
  Left: [← back arrow in frosted glass circle 36px]
  Right: [frosted glass pill — "☆ Save look"]

ITEM/VIBE INFO (absolute, bottom 16px of hero):
  Left 20px, right 20px
  
  Category name: "Garden / Balcony" (or whatever was detected)
  Cormorant Garamond 700, 26px, white
  
  Vibe chip (next line):
    Background: rgba(255,255,255,0.15)
    Backdrop-blur: 10px
    Border: 1px solid rgba(255,255,255,0.25)
    Border-radius: 100px, padding: 4px 12px
    Content: [green dot 6px] + "lush tranquil oasis"
    DM Sans 400 Italic, 12px, white
```

---

### Stats Row

```
Container:
  A floating pill/card below the hero: margin: -10px 16px 0
  Background: #FFFFFF
  Border-radius: 20px
  Shadow: 0 4px 16px rgba(28,58,46,0.08)
  Padding: 16px 0
  FlexRow, 3 equal sections

  Each section — center aligned, flex: 1
  Dividers: 1px solid #EDE7DA between sections
    
    VALUE:
      Cormorant Garamond 700, 24px
      Color: #1A1A1A (count), #1C3A2E (price), #7A9E82 (%)
    
    LABEL:
      DM Sans 400, 11px, letter-spacing: 0.3px, rgba(26,26,26,0.45)
      Margin-top: 2px
```

---

### Section Header

```
Padding: 24px 20px 0

EYEBROW:
  "✦  CURATED FOR YOU"
  DM Sans 600, 10px, letter-spacing: 2.5px, sage #7A9E82

HEADLINE:
  "Pieces picked for you"
  Cormorant Garamond 700, 30px, charcoal
  Margin-top: 4px

SUBTEXT:
  "Tap to explore · toggle to add to your look"
  DM Sans 300, 13px, rgba(26,26,26,0.45)
  Margin: 4px 0 20px
```

---

### Product Cards Grid

```
Layout: 2-column grid, gap: 12px, paddingHorizontal: 16px

EACH CARD:
  Background: #FFFFFF
  Border-radius: 20px
  Shadow: 0 4px 20px rgba(28,58,46,0.09)
  Overflow: hidden
  Border: 1px solid #F0EDE6

  ── IMAGE AREA ──
  Height: 160px
  
  LOADING STATE (shimmer):
    linear-gradient(90deg, #E8E2D9, #D6CFC3, #E8E2D9)
    Animated: sweeping left-to-right, 1.5s loop
  
  LOADED STATE:
    Actual product image, cover fill, no padding
    (This must work — the image load bug must be fixed here)
  
  ── "NEW" BADGE ──
  Position: absolute, top: 10px, left: 10px
  Background: #C4714A (terracotta — NOT green)
  Border-radius: 6px, padding: 3px 8px
  Text: "NEW" — DM Sans 600, 10px, letter-spacing: 1px, WHITE
  
  ── CHECKBOX TOGGLE ──
  Position: absolute, top: 10px, right: 10px
  Circle 28px, bg white, border 1.5px solid #EDE7DA
  CHECKED: bg #1C3A2E, border forest, white ✓ 14px centered
  
  ── CARD BODY ──
  Padding: 12px 12px 14px

  Brand name:
    DM Sans 500, 9px, letter-spacing: 2px, UPPERCASE, sage #7A9E82
    Margin-bottom: 3px
  
  Product name:
    DM Sans 600, 13px, charcoal, line-height: 1.35
    Max 2 lines, ellipsis after
    Margin-bottom: 8px
  
  Price row:
    Sale price: Cormorant Garamond 600, 16px, forest green
    Original: DM Sans 300, 12px, #AAAAAA, strikethrough
    Flex-row, gap: 6px, align-center
    Margin-bottom: 10px

  Match bar:
    Height: 4px, border-radius: 100px
    Background: #EDE7DA
    Fill: linear-gradient(to right, #7A9E82, #1C3A2E)
    Width animates from 0% on mount (800ms, ease-out cubic)
    
    Below bar: "92% match" — DM Sans 400, 10px, sage, text-right
```

---

### Style Direction Row

```
Container: margin 24px 16px 0
Background: #F4EFE6
Border-radius: 14px
Padding: 14px 16px
FlexRow, align-center, space-between

Left: [wand icon 18px sage] + "Style direction (tap to customise)"
Font: DM Sans 400, 13px, rgba(26,26,26,0.45)

Right: [→ arrow, sage, 18px]
```

---

### Hint Banner

```
Container: margin 12px 16px 0
Background: rgba(196,113,74,0.08) — terracotta tint
Border: 1px solid rgba(196,113,74,0.20)
Border-radius: 12px
Padding: 10px 14px

Content: "✦ Toggle pieces · tap 'Reimagine' to see the transformation"
Font: DM Sans 400, 12px, color: #C4714A
```

---

### Bottom CTA

```
"✦  Reimagine this  →"
(No "space" — keep it universal)

Full-width pill, height: 58px, background: #1C3A2E
Font: Cormorant Garamond 600 Italic, 18px, cream
Icon: sparkle left, arrow right
Shadow: 0 16px 48px rgba(28,58,46,0.35)
Fixed to bottom, margin: 16px 16px + safe area
```

---

---

## SCREEN 5: REIMAGINED VIEW (Before / After Toggle)

### Current Issues
- Before/After toggle looks like a generic segmented control
- "Saved +" button is flat
- No visual distinction between Before and After states
- Product grid doesn't respond to toggle state

---

### What to Build

This is the **peak moment** of the app — the reveal. Treat it with ceremony.

---

### Hero Section

```
BEFORE/AFTER TOGGLE — redesigned:

Container:
  Position: absolute, bottom 16px, centered horizontally
  Background: rgba(18,32,24,0.55)
  Backdrop-blur: 16px
  Border-radius: 100px
  Padding: 4px
  FlexRow
  Border: 1px solid rgba(255,255,255,0.15)

Each option:
  Height: 36px, border-radius: 100px, paddingHorizontal: 20px
  
  INACTIVE: bg transparent, text rgba(255,255,255,0.55), DM Sans 500, 14px
  
  ACTIVE — Before:
    Background: white, text charcoal
    Shadow: 0 2px 8px rgba(0,0,0,0.15)
  
  ACTIVE — After:
    Background: #1C3A2E, text cream
    Left: "✦" sparkle in sage
    DM Sans 600, 14px
    Shadow: 0 2px 8px rgba(28,58,46,0.30)

TRANSITION:
  Hero image cross-fades (opacity 400ms)
  Before = original uploaded photo
  After = AI-reimagined version
  After image: warm grade overlay rgba(244,239,230,0.08) — feels editorial

"AI REIMAGINED" chip on After image:
  Top-right, 12px inset
  Frosted glass pill: "✦ AI Reimagined"
  DM Sans 400, 11px, cream, bg rgba(28,58,46,0.55), blur 8px
```

---

### Top Bar — Save Action

```
Right side of top bar: pill button
  Default: bg rgba(255,255,255,0.15), blur 10px, border rgba(255,255,255,0.20)
           [heart icon 18px white] + "Save look" — DM Sans 500, 13px, white
  
  SAVED STATE:
  bg rgba(196,113,74,0.85) — terracotta fill
  [heart filled] + "Saved!"
  Animate: icon scales 1.0 → 1.3 → 1.0 (150ms spring)
```

---

### Product Grid (Reacts to Toggle State)

```
WHEN "BEFORE" IS ACTIVE:
  Product grid opacity: 0.40
  Frosted overlay band over grid:
  "Switch to After to see your picks ✦"
  DM Sans 400, 13px, sage, center aligned

WHEN "AFTER" IS ACTIVE:
  Full opacity, normal interaction
  Grid animates in with stagger fade-up (0ms, 60ms, 120ms, 180ms per card)
```

---

---

## SCREEN 6: GALLERY

### Current Issues
- Massive empty space after the first card — looks abandoned
- Gallery card info layout is cluttered (vibe + star + % all competing)
- Filter chips reference only room types — needs to be broader
- "1 look saved" is too casual
- Empty state needs the updated positioning (not room-specific)

---

### What to Build

**OVERALL FEEL:** A personal lookbook. Something you'd want to scroll through — a design portfolio of your own styled things.

---

### Header

```
Padding: 20px 20px 0, paddingTop: 56px (safe area)

TITLE:
  "Gallery"
  Cormorant Garamond 700, 38px, charcoal

SUBTITLE:
  "Your curated looks"
  DM Sans 300, 14px, rgba(26,26,26,0.45)
  Margin-top: 2px

TOP-RIGHT ACTIONS:
  FlexRow, gap: 10px
  
  Filter/theme icon: frosted glass circle 40px, sort icon sage
  New Look button:
    Pill, bg #1C3A2E, height: 40px, paddingHorizontal: 16px
    [+ icon 16px cream] + "New Look" — DM Sans 500, 13px, cream
```

---

### Filter Chips Row

```
Horizontal scroll, margin: 16px 0 20px, paddingHorizontal: 20px
Gap: 8px

Chips: ["All", "Interiors", "Garden", "Wardrobe", "Collection", "Office"]
(Broad categories — not just room types)

Inactive: border 1px #D6CFC3, bg transparent, DM Sans 400 13px charcoal
Active: bg #1C3A2E, text cream, no border
Height: 34px, border-radius: 100px, paddingHorizontal: 14px
```

---

### Look Cards

```
CARD:
  Margin: 0 20px
  Border-radius: 24px
  Overflow: hidden
  Shadow: 0 8px 32px rgba(28,58,46,0.14)
  
  IMAGE SECTION:
    Height: 220px
    Full-width cover image (the AI-reimagined "after" image)
    
    TOP OF IMAGE (both chips):
      Left: Vibe chip — frosted glass pill, italic, "lush tranquil oasis"
            DM Sans 400 Italic, 12px, white
      Right: Match chip — frosted glass pill, "★ 87%"
             DM Sans 600, 12px, white
  
  BOTTOM CARD INFO (white bg):
    Padding: 16px 16px 18px
    
    Category: Cormorant Garamond 600, 22px, charcoal
    
    Meta row: flexRow, gap: 12px, marginTop: 6px
      [calendar icon 14px sage] "17 May 2026"
      [package icon 14px sage] "5 items"
      DM Sans 400, 13px, rgba(26,26,26,0.55)
    
    CTA row: marginTop: 14px
      "View look →" — DM Sans 600, 14px, forest green
      Right: circle 32px, bg #1C3A2E, white arrow 16px
```

---

### Empty State (no looks yet)

```
Center-aligned, margin-top: 80px

ILLUSTRATION:
  SVG line-art: a minimal styled vignette — a plant, a garment on a hanger, 
  a small bowl, a soft shadow. Thin 1.5px strokes, sage and terracotta on cream.
  Style: delicate, hand-drawn feeling. NOT just a room.
  Size: 200px wide
  
  Pinterest: "minimal line art lifestyle illustration" / "outline illustration objects"

TEXT:
  "Your first look awaits"
  Cormorant Garamond 600, 26px, charcoal, marginTop: 28px

SUBTEXT:
  "Snap anything you love or upload a photo\nto get curated picks and see it reimagined."
  DM Sans 300, 15px, rgba(26,26,26,0.50), line-height: 1.6, text-center
  Margin-top: 10px

CTA BUTTON:
  "✦  Curate my first look"
  Margin-top: 32px, centered
  Forest green pill, width: 240px
```

---

---

## UX COPY — FULL REFERENCE TABLE

| Location | Old Copy | New Copy |
|---|---|---|
| Screen 1 eyebrow | "AI ROOM STYLING" | "✦  AI VIBE CURATOR" |
| Screen 1 headline | "Your space, reimagined." | "Your vibe, *reimagined.*" |
| Screen 1 subheadline | "get curated product picks · visualise instantly" | "Curated picks for anything you love. Visualise the transformation." |
| Screen 1 footer hint | "Works with rooms, offices, and any styled space" | "Works with rooms, wardrobes, gardens, collections & more" |
| Screen 2 scanning headline | "Scanning image..." | "Reading your vibe..." |
| Screen 2 scanning sub | "Detecting items, vibe & palette" | "Detecting items, vibe & colour palette" |
| Screen 3 section label | "DETECTED PRODUCTS & ITEMS" | "DETECTED IN YOUR PHOTO" |
| Screen 3 style label | "STYLE DIRECTION (optional)" | "STYLE DIRECTION  ·  optional" |
| Screen 4 CTA | "Show Suggestions" | "✦  Show Suggestions  →" |
| Screen 4 subtext | "Tap card to shop · toggle checkbox to include" | "Tap to explore · toggle to add to your look" |
| Screen 4 hint | "Toggle products · tap 'Reimagine' to visualise" | "✦ Toggle pieces · tap 'Reimagine' to see the transformation" |
| Screen 4/5 main CTA | "Reimagine" / "Reimagined ✦" | "✦  Reimagine this  →" / "✦  Reimagined" |
| Screen 5 save | "Saved +" | "Save look" → "Saved!" |
| Screen 6 subtitle | "1 look saved" | "Your curated looks" |
| Screen 6 empty state CTA | "✦ Style my first space" | "✦  Curate my first look" |
| Screen 6 empty state subtext | "Snap a room or upload..." | "Snap anything you love or upload..." |
| Gallery filter chips | "Living Room, Balcony, Bedroom" | "Interiors, Garden, Wardrobe, Collection, Office" |
| View variations | "View variations" | "View all variations  →" |

---

---

## KNOWN BUGS TO FIX

1. **Screen 3 — Image void:** The uploaded image does not render. Implement proper image passing between screens. While loading, show the shimmer skeleton (gradient `#E8E2D9 → #D6CFC3`, sweeping animation, centered ✦ icon). Never show a blank white block.

2. **Screen 4 — Product card images:** Product images fail to load. Implement shimmer loading state (`#E8E2D9 → #D6CFC3 → #E8E2D9`, animated sweep). Once loaded, show the actual product photo. This is a critical flow — blank cards kill the shopping experience.

3. **Confidence label colours:** Standardise all confidence/match % labels to sage `#7A9E82`. Remove orange, purple, yellow variants entirely.

---

---

## EXPO / REACT NATIVE IMPLEMENTATION NOTES

```javascript
// Font imports
import { CormorantGaramond_700Bold_Italic, 
         CormorantGaramond_700Bold,
         CormorantGaramond_500Medium } from '@expo-google-fonts/cormorant-garamond'
import { DMSans_300Light, 
         DMSans_400Regular, 
         DMSans_500Medium, 
         DMSans_600SemiBold } from '@expo-google-fonts/dm-sans'

// Color tokens
export const colors = {
  forest:      '#1C3A2E',
  sage:        '#7A9E82',
  cream:       '#F4EFE6',
  linen:       '#EDE7DA',
  terracotta:  '#C4714A',
  charcoal:    '#1A1A1A',
  mist:        '#F9F7F3',
  white:       '#FFFFFF',
}

// Shadow preset
export const cardShadow = {
  shadowColor: '#1C3A2E',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.10,
  shadowRadius: 24,
  elevation: 6,
}

// Shimmer skeleton (for loading images)
// Use react-native-linear-gradient or expo-linear-gradient
// Animate background position / opacity loop on #E8E2D9 → #D6CFC3

// Frosted glass
import { BlurView } from 'expo-blur'
// intensity: 60–80 for UI elements, 30–40 for subtle overlays

// Animations
import Animated, { 
  FadeInUp, FadeInDown, 
  withSpring, withTiming 
} from 'react-native-reanimated'

// Scan line (Screen 2)
// Animated.loop + Animated.timing on translateY
// 0 → imageHeight, 2500ms, linear easing

// Match bar animation (Screen 4)
// Animate width from 0 to matchPercent% on mount
// 800ms, Easing.out(Easing.cubic)
```

---

## FINAL DEVELOPER CHECKLIST

- [ ] Install Cormorant Garamond + DM Sans via expo-google-fonts
- [ ] Set global background to `#F4EFE6` (cream) — never white
- [ ] Status bar: `dark` on light screens, `light` on dark/hero screens
- [ ] Remove all gray shadows — use forest green `rgba(28,58,46,0.10)` everywhere
- [ ] **Fix image passing to Screen 3** — uploaded image must display at top
- [ ] **Fix product card image loading in Screen 4** — shimmer → real image
- [ ] Implement BlurView for all frosted glass elements
- [ ] Add Expo Haptics: CTA press, checkbox toggle, before/after switch
- [ ] Replace all bare `<Text>` with typed components (HeadingDisplay, BodyText etc.)
- [ ] Standardise border-radius: Cards=20px, Pills=100px, Inputs=14px, Badges=6px
- [ ] All horizontal padding: `20px` — consistent everywhere
- [ ] `SafeAreaView` on all screens (top + bottom)
- [ ] "NEW" badge must use terracotta `#C4714A` — not green
- [ ] All confidence % labels: sage `#7A9E82` only
- [ ] Gallery filter chips updated to broader categories (not just room types)
- [ ] All copy updated per the UX Copy table above — no "space", "room" in universal contexts
- [ ] Bloom flower logo unchanged — keep as-is, it's perfect

---

*Bloom Premium Design System · v2.0 · May 2026*
