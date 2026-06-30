# SIGNAL

A cinematic anonymous conversation product built as a **Next.js + TypeScript + Tailwind + Framer Motion** MVP.

**Positioning:** not a dating app, not a social network, not an Omegle clone.

SIGNAL is designed as a ritual: you open it at night, tune into a frequency, meet one stranger, and share one real conversation that can never happen again.

## What is included

- Landing screen with cyberpunk / OLED-friendly atmosphere
- Frequency of the Day ritual
- Random signal option
- Lightweight intent filters: Just Listen / Just Talk / Both
- Tone filters: Calm / Deep / Funny / Debate / Random
- Connection flow with cinematic system states
- Real waiting / queue state for live matching
- Minimal anonymous chat interface
- Text relay with server-side moderation
- Hold-to-talk fallback UI for mock mode
- Real **WebRTC live audio groundwork** for live mode
- Automatic voice channel enable flow
- Secure signaling for `request-offer` / `offer` / `answer` / `ice` / `hangup`
- Better push-to-talk flow over the negotiated voice channel
- Queued push-to-talk before full voice lock
- Perfect-negotiation collision handling for voice offers
- Advanced reconnect diagnostics for voice transport
- Presence states for local and remote voice activity
- Input / output device selection for voice
- Device persistence for preferred voice devices
- Per-device mic and speaker test controls
- Audio calibration panel for mic gain and output volume
- Session-level diagnostics history charts
- Per-session aggregated voice health score
- QoS trend alerts based on recent history
- Server-side QoS persistence for voice samples
- TURN relay validation and optional server enforcement policy
- Server-side troubleshooting recommendations API
- Admin/debug export of session diagnostics
- Mobile-friendly compact diagnostics toggle
- TURN-ready ICE config layer
- Voice transcript moderation path
- Ambient audio toggle using Web Audio API
- Signal Lost exit state
- Supabase schema for ephemeral queue + session matching
- Short-lived secure relay queue for live events
- Supabase Edge Function scaffold for signaling migration
- Zero current `npm audit` vulnerabilities

## Core architecture

### Mock mode
Default local demo mode:
- no external backend required
- simulated stranger behavior
- instant UX validation

### Live mode
Secure server-backed mode:
- client connects through `/api/signal/*`
- server validates session membership
- server moderates text payloads again
- server stores only short-lived relay events
- client polls events and deletes them after consumption
- WebRTC audio negotiation runs over secure signaling messages

## Project structure

```text
app/
  api/
    frequency/route.ts
    moderate/route.ts
    signal/
      await/route.ts
      connect/route.ts
      disconnect/route.ts
      events/route.ts
      send/route.ts
      voice-moderate/route.ts
  globals.css
  layout.tsx
  page.tsx
components/
  atmosphere-background.tsx
  chat-panel.tsx
  connection-sequence.tsx
  frequency-card.tsx
  hold-to-talk.tsx
  intent-selector.tsx
  moderation-overlay.tsx
  signal-lost.tsx
  signal-shell.tsx
  voice-link-panel.tsx
  waiting-signal.tsx
  waveform.tsx
hooks/
  useAmbientAudio.ts
  useMicrophoneLevel.ts
  useSignalApp.ts
  useWebRtcGroundwork.ts
lib/
  anonymous.ts
  constants.ts
  frequency.ts
  moderation.ts
  types.ts
  utils.ts
  server/
    signal-service.ts
  signal-engine/
    index.ts
    live-engine.ts
    mock-engine.ts
  supabase/
    client.ts
    server.ts
supabase/
  schema.sql
  functions/
    _shared/
      cors.ts
      moderation.ts
    signal-router/
      index.ts
```

## Environment variables

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SIGNAL_LIVE=0
NEXT_PUBLIC_SIGNAL_STUN_URLS=stun:stun.l.google.com:19302
NEXT_PUBLIC_SIGNAL_TURN_URLS=
NEXT_PUBLIC_SIGNAL_TURN_USERNAME=
NEXT_PUBLIC_SIGNAL_TURN_CREDENTIAL=
NEXT_PUBLIC_SIGNAL_ICE_SERVERS_JSON=
SIGNAL_ENFORCE_TURN_RELAY=0
SIGNAL_DEBUG_EXPORT_TOKEN=
```

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Quality gates

```bash
npm run lint
npm run build
npx tsc --noEmit
npm audit
```

Current status:
- lint ✅
- build ✅
- typecheck ✅
- audit ✅

## Live matching flow

The schema includes `join_signal_queue(...)`, which:
- inserts or refreshes a user in the queue
- matches only compatible intent / tone combinations
- locks to the same frequency channel
- avoids rematching recent pairs
- creates a short-lived session record
- deletes queue entries once paired

Additional RPC helpers:
- `await_signal_match(...)`
- `leave_signal_queue(...)`
- `leave_signal_session(...)`
- `cleanup_expired_signal_data()`

## Secure relay

Short-lived event delivery uses `signal_events`.

Server routes:
- `/api/signal/connect`
- `/api/signal/await`
- `/api/signal/send`
- `/api/signal/events`
- `/api/signal/disconnect`
- `/api/signal/voice-moderate`
- `/api/signal/voice-qos/report`
- `/api/signal/voice-qos/history`
- `/api/signal/voice-qos/recommendations`
- `/api/signal/voice-qos/export`
- `/api/signal/voice-qos/dashboard`

These routes:
- validate active membership in the current session
- re-run moderation on live text
- flag violations in `signal_flags`
- enqueue short-lived events for the peer
- persist short-lived session-scoped voice QoS samples
- compute per-session health score, QoS trend alerts, incident timeline events, and troubleshooting recommendations on the server
- can enforce TURN relay policy on the server when `SIGNAL_ENFORCE_TURN_RELAY=1`
- support optional debug export token via `SIGNAL_DEBUG_EXPORT_TOKEN`
- provide operator/admin diagnostics as JSON export or HTML dashboard
- support secure WebRTC signaling
- moderate voice transcripts separately

## Voice system status

### What works now
- real `RTCPeerConnection` setup in live mode
- STUN configuration
- automatic voice enable flow after user activation
- local mic priming
- processed outgoing stream with light radio-style filtering
- remote audio sink wiring
- push-to-talk over the negotiated voice link
- secure signaling for request-offer / offer / answer / ICE / hangup
- perfect-negotiation style collision handling with polite / impolite resolution
- reconnect recovery that requests a fresh offer after link loss
- manual retry and force ICE restart controls
- live voice diagnostics: RTT, bitrate, jitter, packet loss, ICE state, signaling state
- local / remote presence states: offline, tuning, listening, speaking, reconnecting
- queued transmit if the user presses PTT before the voice link fully locks
- smoother remote speaking detection via smoothed waveform thresholds and hysteresis
- input/output device selection in the live voice panel
- persisted preferred input/output devices via local storage
- per-device test controls for mic and speaker routing
- audio calibration controls for mic gain and output volume
- compact mobile diagnostics with expandable deep metrics
- TURN-ready ICE server configuration via env or JSON

### Voice moderation
Current voice moderation is **best-effort**:
- uses browser speech recognition when available
- sends transcript chunks to the server moderation route
- server applies the same anti-sexual / anti-harassment / anti-contact rules
- warnings and blocks surface back into the UI

### What still remains for production
- stronger cross-browser STT instead of browser-only recognition
- better renegotiation / reconnect handling
- server-enforced audio moderation beyond transcript heuristics
- polished duplex voice UX and quality tuning

## Privacy notes

This MVP is privacy-first, but production still needs careful deployment discipline:
- anonymous client IDs are SHA-256 hashed before being sent to Supabase
- direct table access is denied by RLS
- live session access is funneled through server routes and RPCs
- relay events are short-lived and aggressively cleaned up
- no permanent transcript or voice clip storage is designed into the schema

## Edge Function scaffold

A Supabase Edge Function scaffold is included under:

```text
supabase/functions/signal-router/index.ts
```

Use it if you want to migrate signaling away from Next API routes into a separate Supabase-hosted layer.

## Notes

- Mock mode is still the easiest way to demo the experience locally.
- Live mode is now meaningfully safer than the original client-trust approach.
- The visual system uses embedded CSS effects so the in-app preview degrades gracefully without external assets.
