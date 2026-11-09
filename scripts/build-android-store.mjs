// Share the reviewed public-config isolation and feature gates with iOS.
process.env.CLIPT_STORE_PLATFORM = 'android';
await import('./build-ios-store.mjs');
