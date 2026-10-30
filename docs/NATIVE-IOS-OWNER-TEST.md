# CLIPT iPhone owner development test

The iPhone artifact contains a prepared Xcode project with CLIPT's development web bundle and native capture engines, plus an unsigned arm64 device archive. It is not an installable signed IPA, a TestFlight upload, an App Store release or evidence of a successful physical stream.

The client points to development project akiksrlzdqvipqbbjxpw. No Mux API credentials, signing private key or service-role key are bundled. Native controls in this test build still require server authorization and completed private webhook/worker configuration. Building does not enable hosted broadcasting, paid resources or payments.

## On your Mac

1. Install Xcode with the actual iPhoneOS27+ SDK and Node22+. Add your own Apple account in Xcode. The Apple team must allow the app identifier and required capabilities; no account/password/certificate is needed in chat.
2. Pair/trust your iPhone with Xcode and enable Developer Mode. Finish any registration/provisioning prompts in Xcode. Obtain your Team ID from the Apple account and your paired device identifier from Xcode.
3. Download the successful **CLIPT iPhone owner device build** artifact, verify SHA256SUMS, and extract CLIPT-prepared-iPhone-project.tar.gz into its own folder.
4. Open Terminal in that extracted project root. Build/sign for your own device:
   `node scripts/ios-owner-test.mjs YOUR_TEAM_ID YOUR_DEVICE_ID`
5. To build/sign and install onto that same paired phone:
   `node scripts/ios-owner-test.mjs YOUR_TEAM_ID YOUR_DEVICE_ID --install`

These are development commands, not App Store distribution commands. Xcode may update development provisioning using the Apple account already signed into your Mac. The helper keeps the SDK27 flag in the actual package-resolution/build process so the Screen Live path remains compiled; simply opening a generated project without its build environment can produce a different capability set.

The cloud unsigned archive is architecture/compilation evidence and can be retained for review. Signing and physical installation still require your Apple setup. We do not claim a Personal Team supports every requested capability; resolve any capability/provisioning restriction before acceptance.

## Physical acceptance

After private setup is verified, sign into the designated development account beecher@cliptgaming.com. Start with360p/15FPS. On a second device, verify actual image/audio and LIVE discovery.

Test Camera Live preview, camera switch, microphone mute and End. Leaving Camera Live ends camera capture. Test Screen Live's system picker, switching to a game, microphone/game audio where permitted, independent mute, OS Stop, interruptions/lock, network loss/recovery, orientation and thermal/battery behavior. Verify chat/profile/game channel, sign-out stops capture, navigation preserves owned Screen Live, and test expiry/end removes the stream correctly.

This increment requires iOS27+ for Screen Live. Older iOS Screen Live has no ReplayKit extension fallback in this release. Camera capability is separately checked natively. Protected media/game audio may be blocked by the OS or source app.

Do not share Apple signing credentials, stream keys, private playback URLs or captured private content. Record the device/OS, build commit and observed results. No physical pass or production/store approval is implied by a build.

References: https://developer.apple.com/documentation/xcode/enabling-developer-mode-on-a-device and https://developer.apple.com/documentation/xcode/interacting-with-devices-using-the-command-line
