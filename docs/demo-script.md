# BrandQuest Demo Script

Target length: 2-3 minutes.

## 0:00 - Opening Hook

"Most ads ask people to watch or click. BrandQuest turns an ad into a playable
challenge: players compete, win rewards, and every attempt becomes measurable
engagement for the brand."

## 0:20 - Problem

"Brands spend money on impressions, but impressions do not prove attention.
Players ignore passive ads, and creators do not get useful engagement data."

## 0:35 - Solution

"BrandQuest lets creators publish mini-game campaigns with incentives. Players
sign in, play, submit server-validated scores, and compete on leaderboards.
Creators see real participation and analytics from DynamoDB."

## 0:55 - Creator Flow

Show Creator dashboard. Create a campaign or open Custom Games.

"Creators can launch normal templates, or submit a custom game idea as metadata.
For the demo I am uploading a Spotify-style Beat Tiles JSON file. It is only
metadata: title, brand, copy, reward, scoring rules, and desired runtime."

Upload `demo-assets/spotify-beat-tiles-custom-game.json`.

## 1:20 - Admin Safety Review

Sign in as Admin and open `/admin/review`.

"Custom games are not executable uploads. Admin review is required. When I
approve this, BrandQuest maps the metadata to a trusted first-party Beat Tiles
runtime already inside the app."

Approve the submission.

## 1:40 - Player Arcade and Gameplay

Sign in as Player and open `/player`.

"The approved campaign is now live in the player arcade. The player opens it
and plays Beat Tiles: four lanes, A S D F controls, falling tiles, Perfect and
Great timing feedback, combo streaks, and a visible timer."

Play for a short round, submit score.

## 2:05 - Leaderboard and Analytics

Show leaderboard.

"The score is submitted through the server. BrandQuest validates the campaign,
session, attempt limit, score range, duration, and duplicate attempt ID before
writing to DynamoDB."

Show Creator analytics.

"The creator sees real attempts, unique players, average score, top score,
funnel events, and suspicious attempt counts. No fake sample data is mixed into
the product flow."

## 2:35 - AWS Backend

"The backend uses one existing Amazon DynamoDB table named BrandQuest with a
single-table pk/sk model. It stores users, campaigns, attempts, leaderboards,
player progression, analytics events, rewards, and custom review records.
All AWS access is server-side through Next.js routes and server actions."

## 2:55 - Closing

"BrandQuest gives brands measurable play instead of passive impressions, gives
players skill-based rewards, and keeps custom games safe with metadata-only
review and server-side score validation."
