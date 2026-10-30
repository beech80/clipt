import XCTest
@testable import CliptBroadcastCore

final class BroadcastPolicyTests: XCTestCase {
    private func selection(_ changes: [String: Any] = [:]) throws -> BroadcastSelection {
        var json: [String: Any] = ["mode": "screen", "quality": "360p15", "orientation": "landscape",
            "microphone": true, "systemAudio": true, "cameraPosition": "back"]
        json.merge(changes) { _, new in new }
        return try BroadcastSelection(json: json)
    }
    private func session(_ changes: [String: Any] = [:], requested: BroadcastSelection? = nil) throws -> NativeBroadcastSession {
        let selected = try requested ?? selection()
        var json: [String: Any] = ["protocolVersion": 1, "sessionId": UUID().uuidString,
            "ingestUrl": "rtmps://global-live.mux.com:443/app", "streamKey": "test-stream-key-0123456789",
            "stopToken": String(repeating: "x", count: 64), "expiresAt": "2030-01-01T00:00:00.000Z",
            "maxDurationSeconds": 300, "selection": try JSONSerialization.jsonObject(with: JSONEncoder().encode(selected))]
        json.merge(changes) { _, new in new }
        return try JSONDecoder().decode(NativeBroadcastSession.self, from: JSONSerialization.data(withJSONObject: json))
    }
    func testDefaultPresetUsesBitsPerSecondAndBoundedKeyframeInterval() throws {
        let value = try selection().encoder()
        XCTAssertEqual(value.width, 640)
        XCTAssertEqual(value.height, 360)
        XCTAssertEqual(value.fps, 15)
        XCTAssertEqual(value.bitrate, 1_000_000)
        XCTAssertEqual(value.audioBitrate, 64_000)
        XCTAssertEqual(value.audioSampleRate, 48_000)
        XCTAssertEqual(value.keyframeSeconds, 2)
    }
    func testPortraitSwapsDimensionsWithoutChangingPreset() throws {
        let value = try selection(["orientation": "portrait", "quality": "720p30"]).encoder()
        XCTAssertEqual(value.width, 720)
        XCTAssertEqual(value.height, 1280)
        XCTAssertEqual(value.fps, 30)
    }
    func testRejectsUnknownAndSmuggledOptions() throws {
        for change in [["mode": "browser"], ["quality": "8k"], ["orientation": "auto"],
             ["cameraPosition": "external"], ["microphone": "true"], ["streamKey": "secret"]] as [[String: Any]] {
            XCTAssertThrowsError(try selection(change))
        }
        XCTAssertThrowsError(try selection(["mode": "camera", "systemAudio": true]))
    }
    func testOnlyAcceptsLongUrlSafeGrants() {
        XCTAssertTrue(NativeBroadcastSession.isOpaque(String(repeating: "aZ1_-", count: 20)))
        XCTAssertFalse(NativeBroadcastSession.isOpaque("short"))
        XCTAssertFalse(NativeBroadcastSession.isOpaque(String(repeating: "x", count: 64) + "\n"))
        XCTAssertFalse(NativeBroadcastSession.isOpaque(String(repeating: "x", count: 64) + "/"))
        XCTAssertFalse(NativeBroadcastSession.isOpaque(String(repeating: "x", count: 2049)))
    }
    func testSessionBindingAndDurationAreIndependentlyEnforced() throws {
        let selected = try selection()
        let now = Date(timeIntervalSince1970: 1_800_000_000)
        let value = try session(requested: selected)
        XCTAssertEqual(try value.validate(requested: selected, now: now), now.addingTimeInterval(300))
        XCTAssertThrowsError(try value.validate(requested: selection(["microphone": false]), now: now))
        XCTAssertThrowsError(try session(["protocolVersion": 2]).validate(requested: selected, now: now))
        XCTAssertThrowsError(try session(["sessionId": "not-a-uuid"]).validate(requested: selected, now: now))
        XCTAssertThrowsError(try session(["maxDurationSeconds": 86_401]).validate(requested: selected, now: now))
    }
    func testRejectsArbitraryIngestHostsAndPlaintext() throws {
        let selected = try selection()
        for host in ["rtmp://global-live.mux.com/app", "rtmps://evil.example/app", "rtmps://global-live.mux.com:444/app",
            "rtmps://user:pass@global-live.mux.com/app", "rtmps://global-live.mux.com/app?key=x", "rtmps://global-live.mux.com/wrong"] {
            XCTAssertThrowsError(try session(["ingestUrl": host]).validate(requested: selected))
        }
    }
    func testRejectsExpiredOrMalformedCredentialMaterial() throws {
        let selected = try selection()
        for invalid in [["expiresAt": "2000-01-01T00:00:00Z"], ["expiresAt": "later"],
            ["stopToken": "short"], ["streamKey": "some-key-with-newline\n"], ["streamKey": "a/key/cannot/be/a/path"], ["streamKey": "short"]] as [[String: Any]] {
            XCTAssertThrowsError(try session(invalid).validate(requested: selected))
        }
    }
    func testExpiryNeverExtendsPastServerDeadline() throws {
        let selected = try selection()
        let formatter = ISO8601DateFormatter()
        let now = try XCTUnwrap(formatter.date(from: "2029-12-31T23:59:00Z"))
        XCTAssertEqual(try session().validate(requested: selected, now: now), now.addingTimeInterval(60))
    }
}
