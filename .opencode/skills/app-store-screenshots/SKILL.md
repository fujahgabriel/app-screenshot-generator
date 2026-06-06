---
name: app-store-screenshots
description: AI-powered App Store screenshot designer with device mockups, canvas rendering, focal magnifier, and multi-locale ASO caption generation
license: CC BY-NC 4.0
---

## Project Overview

React + Vite + Tailwind CSS 4 app with an Express backend. Generates high-resolution App Store/Play Store screenshots with AI-generated captions, device frames, overlays, and focal magnifier.

## Key Commands

```bash
npm run dev      # Start dev server at localhost:3000
npm run build    # Build for production
npm start        # Run production server
npm run lint     # TypeScript type check (tsc --noEmit)
```

## File Structure

| File | Purpose |
|------|---------|
| `server.ts` | Express server + AI caption API (Gemini, OpenAI, Anthropic, OpenRouter) |
| `src/App.tsx` | Root state, locale management, localStorage persistence, template loading |
| `src/components/Sidebar.tsx` | AI copywriter form, screen sequencer, locale switcher, template presets |
| `src/components/CanvasWorkspace.tsx` | Canvas preview, zoom/fullscreen, storyboard, single/ZIP export |
| `src/components/CustomizePanel.tsx` | Per-slide controls: device frame, colors, typography, overlays, focal magnifier, placement |
| `src/utils/canvasRenderer.ts` | All canvas drawing — background, text, device mockup, stats card, focal magnifier |
| `src/templates.ts` | Preset projects, device sizes, Google Fonts, overlay defaults |
| `src/types.ts` | All TypeScript interfaces |

## Canvas Render Order

`renderScreenshotOnCanvas()` in `canvasRenderer.ts` draws in sequence:

1. **Background** — solid, linear-gradient, or radial-gradient
2. **Overlays** — dust particles, film grain
3. **Typography** — headline + subtext (font, size, weight, color, alignment, shadow)
4. **Device mockup** — bezel with rounded corners, screen area with uploaded screenshot or procedural placeholder
5. **Stats card** (optional) — pill-shaped stat overlay inside device screen
6. **Screen gloss** — diagonal reflection
7. **Camera accents** — dynamic island / punch-hole / iPad camera
8. **Focal point magnifier** (optional) — captures device screen region, renders zoomed in a frosted-glass panel. Dark overlay dims the rest. Panel auto-positions to follow source Y.

## Key Types (types.ts)

- `ScreenshotScreen` — all per-slide properties (device, text, background, overlays, focalPoint, statsCard)
- `ASOProject` — project metadata + globalSettings + screens[]
- `FocalPoint` — magnifier settings: sourceY, sourceH, zoom, panelW, overlayOpacity, panelOffset
- `StatsCard` — floating stats: items[] ({label, value}), opacity, yOffset, colors
- `OverlayElement` — type + enabled + scale + opacity
- `DeviceType` — iphone_portrait, iphone_69_portrait, ipad_portrait, android_portrait

## Device Sizes

| Device | Width | Height |
|--------|-------|--------|
| iPhone 6.5"-6.7" | 1242 | 2688 |
| iPhone 6.9" | 1260 | 2736 |
| iPad 12.9" | 2048 | 2732 |
| Android Phone | 1440 | 3120 |

## Important Conventions

- **Locale translations** are stored in `screen.translations[locale]` as `{headline, subtext}`. Switching locales saves current text and loads the target locale's text.
- **Global sync** — when `screen.isLocked` is true, styling changes propagate to all locked screens and globalSettings.
- **Focal magnifier** is drawn outside the device clip (after ctx.restore), but the dark overlay is clipped to the screen's rounded rect.
- **Stats card** is drawn inside the device screen clip, on top of the screenshot.
- **Overlays** are drawn on the canvas background (outside device frame).
- **Procedural screens** (prefixed `procedural:`) are drawn by `drawProceduralScreen()` when no uploaded screenshot exists.
- **CSR** — the app is a client-side rendered SPA served by Vite dev middleware or static dist files.
