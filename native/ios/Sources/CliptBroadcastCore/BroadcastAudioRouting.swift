import HaishinKit

enum BroadcastAudioRouting {
    static func settings(_ current: AudioMixerSettings, screen: Bool, screenMicrophoneEnabled: Bool,
                         microphoneMuted: Bool, systemMuted: Bool) -> AudioMixerSettings {
        var result = current
        // HaishinKit mixes on main-track callbacks. A microphone disabled in
        // the OS picker supplies none, so game audio must drive that clock.
        if screen { result.mainTrack = screenMicrophoneEnabled ? 0 : 1 }
        var microphone = result.tracks[0] ?? .init()
        microphone.isMuted = microphoneMuted
        result.tracks[0] = microphone
        var system = result.tracks[1] ?? .init()
        system.isMuted = systemMuted
        result.tracks[1] = system
        return result
    }
}
