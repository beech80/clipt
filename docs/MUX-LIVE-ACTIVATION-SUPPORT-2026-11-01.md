# Mux non-test livestream creation mismatch

Prepared for the owner to send through Mux dashboard support. No credentials, stream keys, playback tokens, payment details or private media are included.

Subject: Pay as you go account still returns test:true for test:false live-stream creation

The organization Billing page shows Pay as you go. Our production Mux API access token authenticates successfully; whoami confirms the expected organization, environment_type=production, video:write and system:write.

At 2026-11-02 02:44:35 UTC our backend called:

POST https://api.mux.com/video/v1/live-streams
Content-Type: application/json

```json
{
  "test": false,
  "max_continuous_duration": 90,
  "playback_policies": ["signed"],
  "new_asset_settings": {
    "playback_policies": ["signed"],
    "max_resolution_tier": "1080p",
    "video_quality": "plus"
  },
  "reconnect_window": 60,
  "latency_mode": "standard",
  "passthrough": "clipt-obs:<internal-test-session-id>"
}
```

The response unexpectedly has test=true and max_continuous_duration=300, with idle status and one signed playback ID. We verify the returned resource identity and passthrough before using it. The same behavior occurred before and after the reported plan change.

We rejected the test resource before starting any encoder and disabled it. No broadcaster has been enabled. Please check whether non-test Video Live streaming is activated for this organization, why the explicit test=false request is changed to test=true, and whether a separate activation or minimum duration applies.

Organization dashboard identifier: t0gc3o. We can provide the actual resource/request identifiers privately through the authenticated support case if needed.

Redacted application run: https://github.com/beech80/clipt/actions/runs/41379289669

## Independent official-client reproduction

A second method ran at **2026-11-02 03:03:22.761 UTC** using the official **@mux/ts 16.0.0** SDK in the production Edge runtime. This request **omitted the optional test property**, following the official SDK production example. It retained the same 90-second duration, signed policies, plus quality and unique passthrough.

The SDK used the same explicit production Basic credentials, fixed api.mux.com host, no bearer-token fallback, zero retries, 12-second timeout, disabled logging and blocked redirects. It created one resource only. The result was independently retrieved by ID through our original HTTP client, with exact identity/passthrough validation.

Both observations agreed:

```json
{
  "created": {
    "identityValid": true,
    "passthroughMatches": true,
    "testField": "true",
    "duration": 300,
    "status": "idle",
    "playbackCount": 1,
    "signedOnly": true
  },
  "retrieved": {
    "identityValid": true,
    "passthroughMatches": true,
    "testField": "true",
    "duration": 300,
    "status": "idle",
    "playbackCount": 1,
    "signedOnly": true
  }
}
```

Two independent code/documentation reviews found no request serialization or response-validation mistake. Ninety seconds is within the documented 60-second minimum. We did not attempt to PATCH test=false, because test is not documented as an update parameter.

The test was rejected before encoder startup and the resource was disabled. Five total acceptance resources are now closed, with zero unresolved sessions. Our user broadcast switch remains off. No repeated automatic paid attempts are scheduled.

Independent SDK reproduction: https://github.com/beech80/clipt/actions/runs/41380913803
Implementation/review: https://github.com/beech80/clipt/pull/47

Please investigate why both explicit test=false and omitted-test production creation return test=true under the owner-confirmed Pay as you go plan.
