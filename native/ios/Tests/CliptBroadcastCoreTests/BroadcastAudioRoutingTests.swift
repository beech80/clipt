import XCTest
import HaishinKit
@testable import CliptBroadcastCore

final class BroadcastAudioRoutingTests: XCTestCase {
    func testPickerMicrophoneOffMovesTheClockToGameAudioWithoutChangingItsFormat() {
        let current = AudioMixerSettings(sampleRate: 48_000, channels: 2, mainTrack: 0, tracks: [0: .init(), 1: .init()])
        let enabled = BroadcastAudioRouting.settings(current, screen: true, screenMicrophoneEnabled: true,
            microphoneMuted: false, systemMuted: false)
        let disabled = BroadcastAudioRouting.settings(enabled, screen: true, screenMicrophoneEnabled: false,
            microphoneMuted: false, systemMuted: false)
        XCTAssertEqual(enabled.mainTrack, 0)
        XCTAssertEqual(disabled.mainTrack, 1)
        XCTAssertEqual(disabled.sampleRate, current.sampleRate)
        XCTAssertEqual(disabled.channels, current.channels)
    }

    func testSourceChangesPreserveIndependentMuteChoicesAndUnrelatedTracks() {
        var current = AudioMixerSettings()
        current.tracks[7] = .init(isMuted: true)
        let microphoneMuted = BroadcastAudioRouting.settings(current, screen: true, screenMicrophoneEnabled: true,
            microphoneMuted: true, systemMuted: false)
        XCTAssertEqual(microphoneMuted.tracks[0]?.isMuted, true)
        XCTAssertEqual(microphoneMuted.tracks[1]?.isMuted, false)
        let changedSource = BroadcastAudioRouting.settings(microphoneMuted, screen: true, screenMicrophoneEnabled: false,
            microphoneMuted: true, systemMuted: false)
        XCTAssertEqual(changedSource.mainTrack, 1)
        XCTAssertEqual(changedSource.tracks[0]?.isMuted, true)
        XCTAssertEqual(changedSource.tracks[1]?.isMuted, false)
        let gameMuted = BroadcastAudioRouting.settings(changedSource, screen: true, screenMicrophoneEnabled: false,
            microphoneMuted: false, systemMuted: true)
        XCTAssertEqual(gameMuted.tracks[0]?.isMuted, false)
        XCTAssertEqual(gameMuted.tracks[1]?.isMuted, true)
        XCTAssertEqual(gameMuted.tracks[7]?.isMuted, true)
    }

    func testCameraKeepsItsExistingMicrophoneClock() {
        let current = AudioMixerSettings(sampleRate: 48_000, channels: 2, mainTrack: 0)
        let result = BroadcastAudioRouting.settings(current, screen: false, screenMicrophoneEnabled: false,
            microphoneMuted: true, systemMuted: true)
        XCTAssertEqual(result.mainTrack, 0)
        XCTAssertEqual(result.tracks[0]?.isMuted, true)
    }
}
