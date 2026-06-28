# BrandQuest Architecture

BrandQuest runs as a Vercel-hosted Next.js app with Auth.js, server-side
validation, and one existing Amazon DynamoDB table named `BrandQuest`.

Amazon DynamoDB is used for high-volume game attempts, leaderboard events,
reward claims, campaign analytics, and player progression.

## System Architecture

![BrandQuest architecture](./brandquest-architecture.svg)

```mermaid
flowchart LR
  Player["Players"] --> App["Vercel + Next.js App Router"]
  Creator["Creators"] --> App
  Admin["Admins"] --> App
  App --> Auth["Auth.js: Google OAuth + admin credentials"]
  App --> Server["Server Actions + API Routes"]
  Server --> Validation["Zod, permissions, anti-cheat validation"]
  Validation --> Dynamo["Amazon DynamoDB BrandQuest table"]
  Dynamo --> Records["Users, campaigns, attempts, leaderboards, analytics, rewards, custom reviews"]
```

## Core Data Flow

![BrandQuest data flow](./data-flow.svg)

```mermaid
sequenceDiagram
  participant Creator
  participant Next as Next.js Server
  participant DDB as DynamoDB BrandQuest
  participant Player
  Creator->>Next: Create campaign
  Next->>Next: Validate creator role and campaign payload
  Next->>DDB: Put campaign records
  Player->>Next: Load arcade
  Next->>DDB: Query live campaigns
  Player->>Next: Submit attempt
  Next->>Next: Validate session, attempt limit, score, duration
  Next->>DDB: Write attempt, participation, profile, leaderboard data
  Next->>DDB: Append analytics events
  Creator->>Next: View analytics
  Next->>DDB: Read attempts and events
```

## Custom Game Safety

![BrandQuest custom game safety flow](./custom-game-safety.svg)

```mermaid
flowchart LR
  Upload["Creator uploads metadata JSON"] --> Validate["Zod validation: no scripts, safe URLs"]
  Validate --> Pending["DynamoDB pending review record"]
  Pending --> Admin{"Admin decision"}
  Admin -->|Approve| Runtime["Trusted first-party runtime: Beat Tiles or Brand Rush Runner"]
  Admin -->|Reject| Reason["Rejection reason stored and shown to creator"]
  Runtime --> Campaign["Live playable campaign"]
```

## DynamoDB Single-table Access Patterns

- `USER#{userId}` / `PROFILE` stores user role and profile.
- `EMAIL#{email}` / `USER` supports Auth.js email lookup.
- `CREATOR#{creatorId}` / `CAMPAIGN#{campaignId}` lists creator campaigns.
- `CAMPAIGN#{campaignId}` / `META` reads campaign detail.
- `CAMPAIGNS#STATUS#live` lists player arcade campaigns.
- `CAMPAIGN#{campaignId}` / `ATTEMPT#...` stores campaign attempts.
- `PLAYER#{playerId}` / `ATTEMPT#...` stores player attempt history.
- `PLAYER#{playerId}` / `CAMPAIGN#{campaignId}` stores participation.
- `CAMPAIGN#{campaignId}` / `EVENT#...` stores analytics events.
- `CUSTOM_REVIEW#{status}` lists custom-game review queues.

The hackathon MVP reads bounded campaign attempts/events for analytics. At
larger scale, the same table can add rollup items and GSIs for time-windowed
leaderboards and analytics without changing the app contract.

## Safety Notes

- AWS SDK imports are server-only.
- No client component imports DynamoDB.
- Scores are never trusted client-side.
- Uploaded custom-game JSON is metadata only.
- Approved custom games map to trusted app code; no uploaded JavaScript runs.
- The app does not create AWS resources automatically.
