# Offline music downloads

Implemented in Mobile without new native dependencies or backend changes.

## Storage and playback

- Completed tracks live in application documents: `offline/<encoded account>/<encoded track>/`.
- Audio keeps its supported file extension. `track.json` stores metadata and size; cover art is optional.
- Files are downloaded to temporary paths. Only an atomically renamed metadata marker makes a track visible.
- Writes/downloads are serialized per account service, duplicate downloads are suppressed, and cancel/failure does not replace the existing list.
- Player looks up a single track locally before requiring an online URL. Missing/corrupt files fall back to streaming. No network request gates valid local playback.
- Logout/account changes stop playback and cancel pending downloads. Files are retained, scoped to their account.
- Old `downloads/tracks.json` has no account owner. The Downloads tab offers an explicit Import action. Original files remain untouched; repeated imports skip completed tracks.

## Authentication and history

- Login/account fetch remembers the account in secure storage. Subsequent launches can open the local library immediately and refresh the account in the background.
- API requests still require valid server credentials. Network/server errors during refresh preserve the local session; rejected credentials clear it.
- Progress is written to an account-scoped durable outbox. Live requests retain the existing session ID and playing flag for backend heartbeat compatibility.
- A 30-second timer while the player provider is alive retries stored history. Replays omit session ID so old progress does not become a live earnings heartbeat.
- Only acknowledged snapshots are removed; newer progress written during a request is retained.

## Verification

Run `flutter test --no-pub test/offline_downloads_test.dart` and `dart analyze lib test`.

Device acceptance checklist:
1. Log in online, download two real audio files and check progress/artwork.
2. Enable airplane mode, restart the app, open Profile > Downloads, then play, seek, pause, and change tracks.
3. Reconnect and check listening history. Online earnings/heartbeat behavior should remain unchanged.
4. Queue two downloads, cancel one, and retry a failed download; other completed tracks must remain visible.
5. Log out, log in as another account, and verify isolation. Return to the original account and verify retained downloads.
6. Import older downloads and confirm the original files are retained.
7. Remove a playing downloaded track and verify playback stops and the entry disappears.

## Deliberate limits

- File playback remains inside this app; this is not file export or DRM.
- No OS-managed background download, resume from a byte offset after app termination, quality transcoding, or HLS/DASH offline packaging.
- No new background-audio service is introduced.
- Covers are best effort; a cover request failure does not discard valid audio.
- Storage exhaustion is reported as a download failure; there is no free-space preflight API.
- Offline history updates history only; offline earnings/play-count reconciliation requires a separate backend contract.
