# CARBOOM — Street Racing

A 3D car driving game built as a Telegram Mini App. Drive through a procedural city, collect coins, beat traffic, upgrade your ride.

## Run & Operate

- `pnpm --filter @workspace/car-game run dev` — run the game (port 25726)
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, not currently used by game)
- `pnpm run typecheck` — full typecheck across all packages

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Game: React + Vite + Three.js (r3f not used — raw Three.js for performance)
- State/persistence: localStorage via `SaveSystem.ts` singleton
- Controls: keyboard, touch buttons, steering wheel drag, device tilt
- Audio: Web Audio API procedural engine (no assets)
- Telegram: `TelegramApp.ts` wraps `window.Telegram.WebApp`

## Where things live

- `artifacts/car-game/src/game/` — all engine modules:
  - `GameEngine.ts` — main game loop, wires all systems
  - `CarPhysics.ts` — Ackermann steering, drift, nitro
  - `Car3D.ts` — Three.js car mesh builder + 4 car presets
  - `World.ts` — procedural grid city (60m blocks, 12m roads, 400m map)
  - `Traffic.ts` — 20 AI cars with lane following + player avoidance
  - `Camera.ts` — chase / cockpit / hood / cinematic modes
  - `Weather.ts` — clear / rain / fog / storm (particle + fog)
  - `Controls.ts` — keyboard + touch + tilt unified input
  - `Audio.ts` — Web Audio API procedural SFX
  - `SaveSystem.ts` — localStorage persistence, XP/levels, daily rewards
- `artifacts/car-game/src/pages/` — React UI screens:
  - `SplashScreen.tsx`, `MainMenu.tsx`, `GameView.tsx`
  - `HUD.tsx`, `TouchControls.tsx`, `PauseMenu.tsx`
  - `Garage.tsx`, `Settings.tsx`, `Achievements.tsx`
- `artifacts/car-game/src/telegram/TelegramApp.ts` — Telegram Mini App SDK wrapper

## Architecture decisions

- Pure frontend — no backend needed; all state in localStorage
- GameEngine polls every 80ms and passes stats to React HUD (avoids React overhead in render loop)
- Three.js geometry primitives only — no external 3D assets required
- Camera C-key cycles: chase → cockpit → hood → cinematic → chase
- `onDone` callback in SplashScreen: screen state machine lives in App.tsx

## Product

**CARBOOM** is a full-featured 3D street racing game:
- Drive a car through a procedural city with AI traffic
- Collect coins scattered on the road, earn XP and level up
- Daily rewards with streak bonuses
- 4 vehicles (Sports, Muscle, SUV, Supercar) with 5 upgrades each
- Paint shop with 12 color options
- 15 achievements
- Day/night cycle + 4 weather modes
- Mobile-first touch controls (buttons / steering wheel / tilt)
- Telegram Mini App integration (haptics, viewport, share)

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Screenshot tool always shows splash screen because it reloads the page fresh — the actual preview pane shows the game correctly after the 2-3s splash animation
- Vite optimizes `three` on first load causing one auto-reload; subsequent loads are instant
- `useRef` without initial value causes TS2554 in strict mode — always pass `undefined` explicitly
- GameEngine must be destroyed in useEffect cleanup to avoid WebGL context leak
- `setControlButton('_camera_switch', ...)` is the bridge for camera switching from React → engine

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
