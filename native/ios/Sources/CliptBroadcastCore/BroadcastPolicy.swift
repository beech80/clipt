import Foundation

public enum BroadcastFailure: Error {
    case unsupported, invalidSelection, busy, permissionDenied, cancelled
    case invalidGrant, unauthorized, unavailable, expired, interrupted, network, capture
}

public struct BroadcastSelection: Codable, Equatable, Sendable {
    public let mode: String
    public let quality: String
    public let orientation: String
    public let microphone: Bool
    public let systemAudio: Bool
    public let cameraPosition: String

    public init(json: [String: Any]) throws {
        guard Set(json.keys) == Set(["mode", "quality", "orientation", "microphone", "systemAudio", "cameraPosition"]) else {
            throw BroadcastFailure.invalidSelection
        }
        self = try JSONDecoder().decode(Self.self, from: JSONSerialization.data(withJSONObject: json))
        _ = try encoder()
    }

    public func encoder() throws -> BroadcastEncoder {
        guard ["camera", "screen"].contains(mode), ["portrait", "landscape"].contains(orientation),
              ["front", "back"].contains(cameraPosition), !(mode == "camera" && systemAudio) else {
            throw BroadcastFailure.invalidSelection
        }
        let preset: (Int, Int, Int, Int)
        switch quality {
        case "360p15": preset = (640, 360, 15, 1_000_000)
        case "480p30": preset = (854, 480, 30, 1_500_000)
        case "720p30": preset = (1280, 720, 30, 2_500_000)
        case "1080p30": preset = (1920, 1080, 30, 4_500_000)
        default: throw BroadcastFailure.invalidSelection
        }
        return BroadcastEncoder(width: orientation == "portrait" ? preset.1 : preset.0,
            height: orientation == "portrait" ? preset.0 : preset.1,
            fps: preset.2, bitrate: preset.3)
    }
}

public struct BroadcastEncoder: Equatable, Sendable {
    public let width: Int
    public let height: Int
    public let fps: Int
    public let bitrate: Int
    public let audioBitrate = 64_000
    public let audioSampleRate = 48_000
    public let keyframeSeconds = 2
}

struct NativeBroadcastSession: Decodable {
    let protocolVersion: Int
    let sessionId: String
    let ingestUrl: String
    let streamKey: String
    let stopToken: String
    let expiresAt: String
    let maxDurationSeconds: Int
    let selection: BroadcastSelection

    func validate(requested: BroadcastSelection, now: Date = Date()) throws -> Date {
        guard protocolVersion == 1, UUID(uuidString: sessionId) != nil, selection == requested,
            let url = URLComponents(string: ingestUrl), url.scheme == "rtmps",
            url.host == "global-live.mux.com", (url.port == nil || url.port == 443),
            url.path == "/app", url.user == nil, url.password == nil, url.query == nil, url.fragment == nil,
            Self.isOpaque(stopToken), streamKey.count >= 16, streamKey.count <= 4096,
            streamKey.unicodeScalars.allSatisfy({ $0.value >= 33 && $0.value <= 126 }),
            !streamKey.contains("/"), !streamKey.contains("?"), !streamKey.contains("#"),
            (1...86_400).contains(maxDurationSeconds) else { throw BroadcastFailure.unauthorized }
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        let preciseDate = formatter.date(from: expiresAt)
        formatter.formatOptions = [.withInternetDateTime]
        guard let expiry = preciseDate ?? formatter.date(from: expiresAt), expiry > now else { throw BroadcastFailure.expired }
        return min(expiry, now.addingTimeInterval(TimeInterval(maxDurationSeconds)))
    }

    static func isOpaque(_ token: String) -> Bool {
        (64...2048).contains(token.count) && token.utf8.allSatisfy {
            (65...90).contains($0) || (97...122).contains($0) || (48...57).contains($0) || $0 == 45 || $0 == 95
        }
    }
}
