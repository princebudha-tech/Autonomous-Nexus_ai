---
name: NEXUS frontend architecture
description: Frontend structure, key hooks, and design language for the NEXUS UI artifact.
---

## Key hooks

- `use-voice.ts` — Web Speech API wrapper; SpeechRecognition types are hand-declared (not in TS lib by default). Wake word "Nexus". Supports push-to-talk and continuous mode.
- `use-language.ts` — EN/NE (Nepali) translations via LangContext provider (wraps App). T type is `Record<keyof typeof translations.en, string>` (not the literal union — avoids TS errors with two language objects).
- `use-weather.ts` — Open-Meteo free API (no key), falls back to Kathmandu if geolocation denied.

## HUD components

- `components/hud/arc-reactor.tsx` — Iron Man orbital SVG rings (ArcReactor + MiniArcRing). Framer Motion rotates each ring independently.
- `components/hud/voice-indicator.tsx` — VoiceIndicator (compact or full) + VoiceWaveform bar animation. No duplicate `style` props on motion elements.

## Design language

- Always dark, cyberpunk/glassmorphism. Primary: cyan `hsl(190 100% 50%)`. Font: Rajdhani + Space Mono.
- `cyber-panel`, `cyber-glow`, `cyber-glow-text` utility classes from index.css.
- Scanlines overlay on root layout.

**Why:** Consistent aesthetic is core to the product. Every new page should use CyberPanel, CyberButton, CyberBadge primitives from `components/ui/cyber.tsx`.
