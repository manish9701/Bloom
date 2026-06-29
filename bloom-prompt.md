# Bloom — App Prompt

Build a mobile app called **Bloom**.

## What it does

Bloom is an AI vibe curator. You photograph any space — a room, a corner, a shelf, an outfit — and the app reads the aesthetic, recommends curated shoppable products that match or upgrade the vibe, then generates a photorealistic AI image showing the space with those products already styled in. Users set a budget, optionally type a style direction, toggle which products to include, and hit "Reimagine" to see the transformation. Finished glow-ups save to a personal gallery.

## How it should look and feel

The app feels like a premium editorial magazine crossed with a luxury e-commerce app. Think Kinfolk meets Zara Home. Every screen is intentional — no clutter, no unnecessary UI chrome.

**Colour palette**: warm cream backgrounds (`#F4EFE6`), deep forest green as the primary brand colour (`#1C3A2E`), sage green for secondary accents and muted text (`#7A9E82`), terracotta-orange for prices, CTAs and highlights (`#C4714A`), warm linen for cards and skeletons (`#EDE7DA`).

**Typography**: Geist for headings and display text — bold, tight tracking, slightly editorial. DM Sans for body — clean, readable, modern. Never system fonts.

**Homepage**: Full-screen gradient from warm cream at the top fading through warm grey into deep forest green at the bottom. Feels like looking through a window into a forest at dusk. Bottom-anchored content — recent thumbnails from the gallery, a large bold headline ("Your vibe, reimagined." with the last word in italic), two CTA buttons (Upload Photo + Camera) as clean pill buttons. No icons on the buttons. A Gallery pill button top-right, text only.

**Scanning screen**: The user's photo sits in a rounded frame on a solid deep-green background. An animated scan line sweeps top to bottom over the image. Corner bracket decorations pulse. Three small chips cycle through "Vibe", "Palette", "Items" to show what's being detected. Headline below: "Reading your vibe..." in italic, slowly shimmering.

**Analysis screen**: The user's photo bleeds edge-to-edge at the top, taking up half the screen height. Below it, a white card surfaces the AI's reading of the space — summary text, bullet strengths. Further down: detected items as small cropped thumbnails in a horizontal scroll, a budget slider (₹ values, snaps to round numbers), a style direction text input with preset style chips (Japandi, Warm Boho, Scandi, etc.), then a big forest-green CTA button.

**Recommendations screen**: The photo (or the AI composite if reimagined) fills the top 46% of the screen as a hero. Stats bar below (selected count, total price, style fit %). Then a 2-column product grid — each card has a product image on top (AI-generated), brand name, product name, price, and a subtle match % bar. Tapping the image opens a full-screen viewer. Tapping the card body opens a shop sheet. A checkmark ring on each card toggles inclusion. A sticky "Reimagine this →" button floats at the bottom — turns forest green when the selection changes. After reimagining, a Before/After toggle appears on the hero.

**Full-screen image viewer**: Pure black background, edge to edge, covering the status bar. Swipe down to dismiss. Before/After toggle in the top bar if a composite exists. Product name tags scroll horizontally at the bottom.

**Gallery**: A grid of saved glow-ups. Each card shows the composite image, the room vibe label, and the date. Tap to open the full detail view.

## Overall feel

Tactile. Smooth. Every transition feels considered — images crossfade, buttons scale on press, loading states use warm shimmer skeletons instead of spinners. The colour palette stays warm and organic throughout. It should feel like an app someone would screenshot and post about.
