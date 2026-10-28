# Dependency security closure — October 27, 2026

The `deepmerge` advisory GHSA-gcqx-w48m-w2h4 entered the lockfile through `vite-plugin-pwa -> workbox-build -> @rollup/plugin-node-resolve -> deepmerge`.

The active Vite configuration uses React and Tailwind only. Application code has no `virtual:pwa` import. VitePWA appears only in old generated timestamp configuration files, not the active build. The package was therefore unused in the current application.

Removed the unused PWA devDependency and 259 lockfile nodes reachable exclusively through it. All retained package versions and integrity fields were preserved. No forced downgrade, advisory suppression, fake patched version or vendored fork was used. Existing service-worker consumers were not removed or redesigned.

Added a guard against reintroducing the unused vulnerable chain. Updated the older dependency test so removed packages need not stay installed, while every retained instance must use its reviewed patched override.

Review: https://github.com/beech80/clipt/pull/12 , merged as `775fe678d2df2575e7eedc7367e3fafebe69578b`.

Clean installation, compiler checks, unit tests, browser fixtures, audit, CSS checks and production build passed. Latest combined main verification: https://github.com/beech80/clipt/actions/runs/40618038499 . Audit result: **0 vulnerabilities**. The later media-operation changes passed 710 unit tests and 96 operation tests in addition to the monitor/browser checks.

The existing working directory's four security files were synchronized only after their contents matched the expected base (allowing the already-reviewed qs patch), preserving unrelated user changes. An isolated npm lockfile-only uninstall also completed with zero vulnerabilities; no package install scripts were executed by that preparation.

This closes the recorded dependency finding. It does not claim future advisories cannot appear or that physical-device acceptance is complete. Automatic web deployment holds remain in place; the live UI bundle did not need replacement for this build-only cleanup.

Advisory: https://github.com/advisories/GHSA-gcqx-w48m-w2h4 .
