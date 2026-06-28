# BrandQuest

Playable ads. Real rewards.

BrandQuest is a full-stack playable-ads platform. Creators launch interactive
mini-game campaigns with incentives, players compete on validated
leaderboards, and brands get measurable engagement instead of passive
impressions.

## Product Flows

### Player

- Sign in with Google.
- Browse `/player` for live campaigns from DynamoDB.
- Open a campaign, play a built-in template, and submit a score.
- Score submissions go through `POST /api/attempts`.
- Attempts update DynamoDB-backed leaderboards, participation records, XP, and
  badges.

### Creator

- Sign in with Google and choose Creator during onboarding.
- Create campaigns with title, brand, preview title/text, thumbnail URL,
  template, incentive/prize, max attempts, and schedule.
- View only campaigns owned by the signed-in creator.
- See analytics computed from real attempts/events, including unique players,
  attempts, average score, top score, funnel, and recent engagement.
- Submit custom-game metadata for admin review.

### Admin

- Admin access is protected separately from normal Google role onboarding.
- New users cannot self-select admin.
- Admin credentials are configured by server-side environment variables only.
- Admins approve, reject, or comment on custom-game submissions.
- Approval creates a safe first-party campaign using the trusted Brand Rush
  Runner runtime. Uploaded JavaScript is never executed.

## Playable Templates

Fully playable in this app:

- Brand Quiz
- Memory Match
- Reaction Tap
- Word Scramble
- Pattern Recall
- Brand Rush Runner

Roadmap templates are visible in the catalog but disabled for publishing until
their playable runtime exists. This prevents broken campaigns from going live.

## Custom Game Safety

Custom game submissions are metadata/config only:

- brand name
- game title
- preview copy
- thumbnail URL
- reward/incentive
- scoring method
- expected score range
- time limit
- instructions/security notes

BrandQuest does not execute arbitrary uploaded JavaScript, run uploaded files,
or trust custom-game client scores. Production custom games should run only
after review in a sandboxed iframe with a secure score API.

## Demo Asset

Use `demo-assets/spotify-vibe-rush-custom-game.json` for the submission video.
Paste it into the Custom Games form's Import JSON box, submit it, then approve
it as admin. Approval maps it to Brand Rush Runner as a trusted first-party
playable campaign.

## DynamoDB

The app uses a single existing DynamoDB table. It does not create AWS resources.

- Table: `BrandQuest`
- Region: `us-east-1`
- Partition key: `pk`
- Sort key: `sk`

Access patterns:

- `USER#{userId}` / `PROFILE` for users
- `EMAIL#{email}` / `USER` for email lookup
- `CREATOR#{creatorId}` / `CAMPAIGN#{campaignId}` for creator campaign lists
- `CAMPAIGN#{campaignId}` / `META` for campaign detail
- `CAMPAIGNS#STATUS#live` for player arcade live campaigns
- `CAMPAIGN#{campaignId}` / `ATTEMPT#...` for campaign attempts/leaderboards
- `PLAYER#{playerId}` / `ATTEMPT#...` for player attempt history
- `PLAYER#{playerId}` / `CAMPAIGN#{campaignId}` for participation
- `CAMPAIGN#{campaignId}` / `EVENT#...` for analytics events
- `CUSTOM_REVIEW#{status}` for admin review queues

Some hackathon-MVP reads aggregate bounded campaign attempts/events for
analytics. At production scale, these should be replaced or augmented with
pre-aggregated rollup items and GSIs for high-volume leaderboards and analytics
windows.

## Environment Variables

Required for real persistence/auth:

- `USE_DYNAMODB`
- `AWS_REGION`
- `BRANDQUEST_DYNAMODB_TABLE`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `AUTH_SECRET`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`

Required for credential-based admin access:

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD_HASH`
- `ADMIN_PASSWORD_SALT`

Never prefix secrets with `NEXT_PUBLIC_`. AWS keys and auth secrets must remain
server-side only.

## Local Development

```bash
pnpm install
npm run typecheck
npm run build
npm run dev
```

Open `http://localhost:3000`.

## Deployment

The app is configured for Vercel and uses only server-side DynamoDB calls. Set
the required env vars in Vercel for Production, Preview, and Development. Do not
commit `.env.local`, `.vercel`, `.next`, `node_modules`, or admin credential
files.

## Security Choices

- All important inputs are validated with Zod.
- Scores are revalidated server-side.
- Campaign ownership and admin access are checked server-side.
- Role cookies are onboarding hints only, not authorization.
- DynamoDB is selected only when `USE_DYNAMODB=true`; otherwise the app uses
  clean empty states and no fake campaign fallback.
- No AWS SDK imports are used in client components.
- No arbitrary uploaded custom-game code is executed.
