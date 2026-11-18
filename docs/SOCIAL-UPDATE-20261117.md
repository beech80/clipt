# CLIPT social release update

This release adds a straight landscape action rail, a simpler posting screen, a Life / No Game topic option, game-cover search cards, hashtag suggestions with measured search counts, and video-only Channels.

Hashtag counts start with this release. Only signed-in explicit searches and selected search suggestions are counted. Repeated searches by the same account for the same tag within a minute count once; the server limits each account to 30 counted tags per minute. Suggestions respect caller permissions and exclude unpublished and moderated posts. The index updates whenever a caption changes.

Database changes are additive. The private search receipts have no client privileges. Only the authenticated, rate-limited RPC can increment aggregate counts. The security advisor's warning for that RPC is intentional; its elevated privileges are required to protect counters from direct client writes.

Token balances and achievements continue to use the existing server-managed wallet and achievement sync. In-app notifications continue to use database event triggers and Realtime subscriptions. This release does not claim Apple push-notification delivery while the app is closed.

## Open the packaged iOS build

1. Extract the new Xcode ZIP on your Mac into a new folder.
2. Open `ios/App/App.xcodeproj`.
3. Select the App scheme, then your iPhone or an iPhone Simulator.
4. Press Run. For a physical iPhone, choose your Apple team under Signing & Capabilities if prompted.

The ZIP includes the updated web assets. You do not need to run npm commands to try this package. Apple signing, physical-device testing and archive validation must be done on a Mac.

## Rollback

Restore the preceding Vercel deployment if a website regression is found. The additive hashtag tables and indexing trigger can remain installed with the previous frontend. Keep both Xcode folders until the updated build is verified.
