# Demo Custom Game Metadata

This folder contains safe metadata for the submission video. These files do not
contain JavaScript, executable uploads, tracking pixels, or third-party runtime
code.

## Recommended Demo: Spotify Beat Tiles

Use `spotify-beat-tiles-custom-game.json` for the video demo.

1. Sign in as a Creator.
2. Open Creator -> Custom games.
3. Upload `spotify-beat-tiles-custom-game.json` with the JSON file input, or
   paste the file into the "Import metadata JSON" box and click "Import JSON".
4. Review the populated fields and submit for admin review.
5. Sign in as Admin and approve the submission.
6. Approval maps the metadata to BrandQuest's trusted first-party Beat Tiles
   runtime, so the approved campaign becomes playable without running arbitrary
   uploaded JavaScript.

The app parses known metadata fields only, ignores unknown fields, validates the
payload with Zod, and stores only metadata in DynamoDB.

## Alternate Demo: Spotify Vibe Rush

`spotify-vibe-rush-custom-game.json` remains available as a runner-style custom
game example. Use Beat Tiles for the primary demo because it has clearer timing,
combo, and leaderboard moments.
