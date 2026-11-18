# CLIPT media-only iOS build

This branch keeps the future livestream and paid-membership implementations in source control, but compiles the launch app with `VITE_STREAMING_ENABLED=false` and `VITE_MEMBERSHIPS_ENABLED=false`. The public launch surface is free and contains gaming clips, screenshots, profiles, discovery, earned Tokens, and the five-Boost system.

## First Mac setup

1. Install Xcode 26 or newer from the Mac App Store and open it once so it can install its components.
2. Install Node.js 22.12 or newer.
3. Clone this branch and run `npm ci`.
4. Create `.env.local` with the browser-public production `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_APP_ENV=production`, `VITE_STREAMING_ENABLED=false`, `VITE_MEMBERSHIPS_ENABLED=false`, and `VITE_BILLING_CHECKOUT_DISABLED=true`. Never put a service-role or Supabase secret key in the app.
5. Run `npm run ios:sync`.
6. Run `npm run ios:open`, select the CLIPT target, choose your Apple Development team and a unique bundle identifier if Xcode requires one, then choose an iPhone simulator or your registered device.

## Required checks on the Mac

1. In Xcode, confirm the `CLIPT` scheme, iOS 15 deployment target, and your Apple Development team.
2. Build and run on an iPhone Simulator, then on a physical iPhone.
3. Verify sign up, sign in, password recovery, photo selection, Take Photo, video upload, profile editing, comments, messages, earned Tokens, and all five Boost cards.
4. Confirm the camera permission dialog uses CLIPT's focused Take Photo explanation.
5. In **Product → Archive**, validate the archive before uploading it to TestFlight. Increase the build number for every later upload.

Email confirmation and password recovery from the native app intentionally open the reviewed HTTPS app at `clipt-media-only.vercel.app`; they never point at the private `capacitor://localhost` origin.

## Every web update

Run `npm ci`, `npm run typecheck`, `npm test -- --test-concurrency=1`, and `npm run ios:sync` before opening Xcode. The sync command rebuilds `dist` and copies that exact reviewed bundle into the native host.

## Release boundary

- Do not add a remote `server.url` to `capacitor.config.ts`; the native app must ship its reviewed local web bundle.
- Keep `VITE_STREAMING_ENABLED=false` for the social-media launch.
- Keep `VITE_MEMBERSHIPS_ENABLED=false` and `VITE_BILLING_CHECKOUT_DISABLED=true` until the paid tiers receive a separate reviewed launch.
- Apple signing, provisioning, archive validation, and App Store Connect submission must be completed on the Mac in Xcode.
