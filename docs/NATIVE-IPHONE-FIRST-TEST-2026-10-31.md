# CLIPT iPhone: first native broadcast test

Status as of October31,2026: the development server's configuration guards pass. A playback request without a user session returns AUTHENTICATION_REQUIRED; a redemption request without a grant returns INVALID_GRANT instead of NATIVE_DISABLED. These read-only checks create no provider stream and do not verify real Mux webhook delivery, private HLS playback or physical capture.

## What is ready

- Manual cleanup: https://github.com/beech80/clipt/actions/runs/41217511448 passed with checked0/stopped0/pending0.
- App/source validation: https://github.com/beech80/clipt/actions/runs/41222107987 passed817 application tests,12 monitor tests, typecheck, CSS, build, Chromium/WebKit regressions and dependency audit (0 vulnerabilities).
- Native builds: https://github.com/beech80/clipt/actions/runs/41222108000 passed Android minified build/tests, iPhone simulator/device-SDK builds and14 Swift tests.20 focused native session tests passed locally.
- Automatic cleanup: https://github.com/beech80/clipt/actions/runs/41226669924 passed on October31 at12:53PM Chicago with checked0/stopped0/pending0/oktrue. This verifies the schedule and scoped authentication. Actual expired-provider teardown remains a real-broadcast check. Independent SQL expiry is also running successfully.
- Development test settings are restricted to the designated confirmed beecher@cliptgaming.com account and a300-second test duration. Paid production streaming remains outside this test.
- The prepared iPhone artifact has no installable signed IPA. It contains a self-contained prepared Xcode project, bundled web assets, a built-in-only Node installer script, an unsigned arm64 archive and checksums.

## Download on your Mac

Open https://github.com/beech80/clipt/actions/runs/41111317044 and download CLIPT-development-owner-test-iPhone from Artifacts. It is available until November6,2026 at1:01PM Chicago time. Use an authenticated GitHub session.

Artifact ID13003423370; ZIP digest:
3f1370362d1f540b8645839b9bc98576de1b67bb89d53e348306938f0d0c0dce

After extracting the downloaded artifact, verify its inner archives with:
`shasum -a 256 -c SHA256SUMS`

Extract CLIPT-prepared-iPhone-project.tar.gz into its own folder. A direct Git tree comparison of artifact source475864d36aeee85e1273256a3e1b12f559dd936b with main bbc0d420508f3e376f52afb761178ac902141da6 found no differences in src/, public/, native/ios/, public native configuration, branding/host generation or the Mac installer. The subsequent changes were server code, documentation, tests and CI dependency manifests. The prepared Mac project does not include or install those npm manifests; do not run npm install inside this extracted project.

## Sign and install

1. Use a Mac with Node22+ and Xcode containing the actual iPhoneOS27+ SDK. Sign into Xcode with your own Apple account.
2. Connect and trust your iPhone. Enable Developer Mode and finish Xcode pairing/provisioning prompts. Obtain your Apple Team ID and paired iPhone device identifier in Xcode.
3. Open Terminal in the extracted prepared project's root, where scripts/ and ios/ are present.
4. Replace the two placeholders with your actual identifiers and run:

`node scripts/ios-owner-test.mjs YOUR_TEAM_ID YOUR_DEVICE_ID --install`

The helper validates the inputs, preserves the iOS27 screen-capture build configuration, and signs/installs through your existing Xcode account. It does not publish to TestFlight or the App Store. Resolve any Apple capability/provisioning restriction in Xcode; a successful unsigned cloud build does not prove your personal signing team supports every requested capability.

See docs/NATIVE-IOS-OWNER-TEST.md in the repository or the README in the archive for the same installation boundary. Never send Apple credentials, Mux secrets or stream keys through chat.

## First test: Camera Live

- Open the installed CLIPT app, sign into the designated development account beecher@cliptgaming.com, and open the existing Go Live/stream setup.
- Choose Camera Live,360p/15FPS and microphone enabled. Grant camera/microphone permission when asked.
- Start one broadcast. Verify actual moving image and audio on a second device signed into the same development environment using an approved account. The same confirmed owner account can be used as the viewer; do not confuse a production preview with the development app.
- Test camera switching and microphone mute/unmute. Verify the viewer, live discovery, chat, creator/profile and selected game context.
- Press End once. Confirm capture stops and the stream leaves live discovery after provider/server confirmation. Buffered video can outlast the end request briefly.

## Second test: Screen Live

- Start a separate Screen Live session at360p/15FPS. Use Apple's system picker and select the intended game/source.
- Switch away from CLIPT to that game. Verify continuing image/audio from the second device. Enable game audio where the OS/game permits it, and test microphone/game mute independently.
- Test the OS Stop control, denied consent, sign-out and a brief connection interruption. Confirm errors are actionable and no private credentials appear.
- Run an expiry check and confirm the authorized test ends within its300-second bound, the provider stops and live discovery clears. Reconcile any uncertain or interrupted session before creating another.

iOS Screen Live requires iOS27+ in this increment. Camera capture stops when backgrounded; Screen Live uses the system capture lifecycle. DRM/protected content and some source apps can prohibit capture or game audio. A browser tab cannot replace this native installation.

## What remains unverified

Physical iPhone/Android capture, real signed Mux webhook delivery, matching signing-ID/environment in actual private HLS playback, end-to-end termination and the full interruption/permission/thermal matrix require real-device acceptance. No physical pass or general release certification is claimed.

Record device/OS, Camera Live or Screen Live, approximate test time, whether the second device showed/heard the stream, and any error code. Keep private playback URLs, stream keys and personal captured content out of reports.
