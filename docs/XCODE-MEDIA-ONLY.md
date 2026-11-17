# CLIPT media-only iOS build

This branch keeps the future livestream and paid-membership implementations in source control, but compiles the launch app with `VITE_STREAMING_ENABLED=false` and `VITE_MEMBERSHIPS_ENABLED=false`. The public launch surface is free and contains gaming clips, screenshots, profiles, discovery, earned Tokens, and the five-Boost system.

## First Mac setup

1. Install Xcode from the Mac App Store and open it once so it can install its components.
2. Install Node.js 22.12 or newer.
3. Clone this branch and run `npm ci`.
4. Create `.env.local` with the browser-public production `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_APP_ENV=production`, `VITE_STREAMING_ENABLED=false`, `VITE_MEMBERSHIPS_ENABLED=false`, and `VITE_BILLING_CHECKOUT_DISABLED=true`. Never put a service-role or Supabase secret key in the app.
5. Run `npm run ios:sync`.
6. Run `npm run ios:open`, select the CLIPT target, choose your Apple Development team and a unique bundle identifier if Xcode requires one, then choose an iPhone simulator or your registered device.

## Every web update

Run `npm ci`, `npm run typecheck`, `npm test -- --test-concurrency=1`, and `npm run ios:sync` before opening Xcode. The sync command rebuilds `dist` and copies that exact reviewed bundle into the native host.

## Release boundary

- Do not add a remote `server.url` to `capacitor.config.ts`; the native app must ship its reviewed local web bundle.
- Keep `VITE_STREAMING_ENABLED=false` for the social-media launch.
- Keep `VITE_MEMBERSHIPS_ENABLED=false` and `VITE_BILLING_CHECKOUT_DISABLED=true` until the paid tiers receive a separate reviewed launch.
- Apple signing, provisioning, archive validation, and App Store Connect submission must be completed on the Mac in Xcode.
