# BrandQuest — Playable ads. Real rewards.

BrandQuest turns ads into interactive game campaigns. Brands launch skill-based
challenges with real rewards, players compete on validated leaderboards, and
every attempt becomes measurable engagement.

It runs **fully and safely with zero configuration** — no database, no API keys,
no credentials required. When nothing is connected it uses a no-op data adapter
that returns empty data with real empty states, plus a built-in catalog of
**sample campaigns** you can actually play to see the whole flow.

## Roles

| Role | What they do | Entry |
| --- | --- | --- |
| **Player** | Browse the arcade, play games, climb leaderboards, win rewards, earn XP & badges | `/player` |
| **Creator** | Build playable ad campaigns (5-step builder), submit custom games, view analytics | `/creator` |
| **Admin** | Review and approve/reject custom game submissions | `/admin/review` |

There is no fake login: the role screen (`/role`) stores only the selected role
in an httpOnly cookie to decide which dashboard to show. Real identity is wired
in later (see `lib/auth/auth.config.ts`).

## Game templates

Four templates are **playable end-to-end today**: Brand Quiz, Memory Match,
Reaction Tap, and an approved Custom Game demo (sandboxed clicker). 16 more are
in the catalog as roadmap entries that creators can already configure. See
`lib/game-engine/templates.ts`.

## Security model

- **Scores are validated server-side.** The client plays a game and reports a
  number to `POST /api/attempts` — the only authoritative scoring endpoint. The
  server re-checks the score against the template's plausible max, runs
  anti-cheat heuristics (`lib/game-engine/anti-cheat.ts`), rate-limits, and only
  then is a score eligible for the leaderboard.
- **Custom games are metadata only.** No arbitrary code is uploaded or executed.
  Approved games are intended to run in a sandboxed iframe and report scores
  through the same secure score API. Every submission is admin-reviewed.
- **Authorization is server-side** (`lib/security/permissions.ts`). The client
  hiding a button is never the security boundary.

## Architecture

A live, annotated diagram is at `/architecture`. In short:

```
UI (App Router, RSC + client islands)
  -> Server Actions / Route Handlers   (validate + authorize)
    -> Zod validation + game engine     (scoring, anti-cheat, progression)
      -> DB adapter interface           (lib/db)
         -> noop (default)  |  DynamoDB (opt-in via env)
```

The whole app depends only on the `BrandQuestDB` interface, so enabling real
persistence is a single swap driven by environment variables.

## Enabling persistence (optional)

Copy `.env.example` to `.env.local` and set `USE_DYNAMODB=true` with your AWS
region and table name. The DynamoDB adapter (`lib/db/dynamodb.ts`) documents the
single-table key design. Without these, the no-op adapter keeps everything
working.

## Tech

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · shadcn/Base UI ·
Zod · Recharts.

## Project layout

```
app/
  (marketing)/      Landing page
  architecture/     System architecture diagram
  (auth)/           Role selection + sign-in
  (player)/         Arcade, profile, play, leaderboards
  (creator)/        Dashboard, 5-step builder, custom games, analytics
  (admin)/          Custom game review queue
  api/              attempts (scoring), campaigns, leaderboard
lib/
  db/               Adapter interface, noop + DynamoDB implementations, types
  game-engine/      Templates, scoring, anti-cheat, progression, sample data
  validation/       Zod schemas (campaign, attempt, custom-game, reward)
  analytics/        Event tracking + metric calculations
  security/         Permissions + rate limiting
  auth/             Role session + server actions (provider-ready)
  campaigns/        Campaign & custom-game server actions
  admin/            Review server actions
components/brandquest/  Feature components
```
