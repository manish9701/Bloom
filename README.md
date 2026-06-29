# Bloom

**Your vibe, reimagined.** — AI vibe curator for rooms, gardens, shelves, and collections. Upload a photo, get curated shoppable picks, and visualise the transformation.

## Requirements

- **Node.js 20+** ([nodejs.org](https://nodejs.org))
- **npm** (comes with Node)
- For phone testing: **Expo Go** ([Android](https://play.google.com/store/apps/details?id=host.exp.exponent) / [iOS](https://apps.apple.com/app/expo-go/id982107779))
- Optional: **Android Studio** or **Xcode** for emulators

## Quick start (Windows)

```powershell
cd d:\Desktop\Bloom
npm install
npm start
```

**Fresh install** (if things break):

```powershell
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json -ErrorAction SilentlyContinue
npm install
npm start
```

When the dev server opens:

| Target | Action |
|--------|--------|
| **Phone** | Scan the QR code with Expo Go (same Wi‑Fi as PC) |
| **Web** | Press `w` in the terminal |
| **Android emulator** | Press `a` (Android Studio required) |

## API key (optional for first run)

Without a key, Bloom runs in **demo mode**: sample analysis + mock product picks. Reimagine (AI composite) and AI product photos need a key.

1. Copy `.env.template` → `.env`
2. Add your key from [OpenRouter](https://openrouter.ai/keys):

```env
EXPO_PUBLIC_OPENROUTER_KEY=sk-or-v1-...
```

3. Restart the dev server (`Ctrl+C`, then `npm start`)

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start Expo dev server |
| `npm run web` | Open in browser |
| `npm run android` | Android emulator / device |
| `npm run ios` | iOS simulator (Mac only) |
| `npm run typecheck` | TypeScript check |

## Project structure

```
app/           Screens (Expo Router)
  (tabs)/      Home + Gallery
  components/  ImageViewer, etc.
lib/           AI service, store, theme
assets/        Icons, logo, sample hero image
```

## Troubleshooting

**Metro won’t start** — Delete `node_modules`, run `npm install` again.

**“Unable to resolve module”** — Run from the `Bloom` folder (where `package.json` lives), not a parent folder.

**QR code won’t load on phone** — Use `npx expo start --tunnel` if PC and phone are on different networks.

**AI errors / 401** — Check `.env` has a valid `EXPO_PUBLIC_OPENROUTER_KEY` and restart Metro.

**Camera on web** — Use Upload Photo; camera works best on native (Expo Go).

## Docs in repo

- `bloom-app-prompt.md` — Product spec & design system
- `Bloom_Premium_Design_Prompt_v2_31Zywj.md` — UI polish notes
