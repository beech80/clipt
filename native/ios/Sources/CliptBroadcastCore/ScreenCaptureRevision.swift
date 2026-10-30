import Foundation

// Owned by the capture session's MainActor. A superseded picker decision or a
// stopped session must never start capture or forward newly arriving samples.
struct ScreenCaptureRevision {
    private var active = false
    private var version = UUID()

    mutating func begin() {
        active = true
        version = UUID()
    }

    mutating func requestChange() -> UUID? {
        guard active else { return nil }
        version = UUID()
        return version
    }

    mutating func stop() {
        active = false
        version = UUID()
    }

    func accepts(_ candidate: UUID) -> Bool {
        active && version == candidate
    }
}
