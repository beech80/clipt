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
