# CLIPT Android development owner test

This package targets development project akiksrlzdqvipqbbjxpw. It includes only the existing application's public Supabase configuration. It contains no Mux API credentials, signing private key, service-role key or native transport key.

The native plugin is present and enabled in the client build. The authenticated backend independently controls whether a native session can be created. Building or installing this APK does not turn on server publishing, paid Mux creation, payments, production access or app-store distribution.

## Install after the private setup is verified

1. Open the successful **CLIPT Android owner phone test** workflow run on GitHub.
2. Download the **CLIPT-development-owner-test-Android** artifact and extract it.
3. Transfer CLIPT-development-owner-test.apk to your own Android8/API26+ phone. Verify the SHA256SUMS file when transferring through another computer.
4. Allow installation from the application opening this exact APK, then install CLIPT. This is an owner-development package, not a Play Store release.
5. Sign in with beecher@cliptgaming.com in the development account. Open Go Live and test Camera Live at360p/15FPS first. Test Screen Live from a second device after the camera test succeeds.

A browser tab or saved website cannot provide this native capture plugin. The iPhone also needs its own signed native build; this APK is Android only.

## Signing limitation

The cloud build uses a temporary developer signing key. A later build may require uninstalling this development app first if Android reports a signature mismatch. Uninstalling clears local app data. A stable owner-approved release keystore is required for normal upgradeable beta/store distribution; it is not generated or requested by this workflow.

## Acceptance checks

Verify on physical devices before claiming streaming works:

- Camera preview, rear/front switch, microphone mute/unmute and explicit End.
- Screen consent, switching to a game and continuing playback on another phone.
- Game audio where permitted; microphone and game-audio mute independently.
- Denied permission, OS Stop, leaving Camera Live, screen lock and phone interruptions.
- Wi-Fi interruption and recovery, orientation, battery/thermal behavior.
- Correct LIVE discovery, chat, profile and game channel; disappearance after verified end.
- Sign-out stops capture; navigation alone preserves owned Screen Live.
- Server expiry ends the authorized test within300seconds; repeated End is safe.

Some games/DRM content block capture or game audio. Report what was actually seen/heard, the Android version and workflow commit. Do not share stream keys, tokens, signing secrets, private playback links or captured private content.

No physical broadcast, production rollout, paid streaming or store approval is certified by a successful build. The private webhook/worker setup and the complete physical acceptance matrix remain separate gates.
