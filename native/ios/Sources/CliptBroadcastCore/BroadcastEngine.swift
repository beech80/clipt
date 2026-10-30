#if os(iOS)
import AVFoundation
import HaishinKit
import RTMPHaishinKit
import Logboard
import UIKit
import VideoToolbox

@MainActor
public protocol NativeScreenCapture: AnyObject {
    func start(selection: BroadcastSelection, encoder: BroadcastEncoder, mixer: MediaMixer) async throws
    func stop() async
    var onTermination: (() -> Void)? { get set }
}

@MainActor
public final class CliptBroadcastEngine {
    public static let shared = CliptBroadcastEngine()
    public private(set) var state = "idle" { didSet { preview?.setStatus(state) } }
    private var operation = UUID()
    private var selection: BroadcastSelection?
    private var credential: NativeBroadcastSession?
    private var deadline: Date?
    private let api = BroadcastSessionAPI()
    private var mixer: MediaMixer?
    private var connection: RTMPConnection?
    private var output: RTMPStream?
    private var screen: (any NativeScreenCapture)?
    private var preview: BroadcastPreviewController?
    private var heartbeatTask: Task<Void, Never>?
    private var monitorTask: Task<Void, Never>?
    private var expiryTask: Task<Void, Never>?
    private var leaseTask: Task<Void, Never>?
    private var heartbeatLastSucceeded: Date?
    private var observers: [NSObjectProtocol] = []
    private var microphoneMuted = false
    private var systemMuted = false
    private var cameraPosition: AVCaptureDevice.Position = .back
    private var reconnecting = false
    private var encoderSupport: [String: Bool] = [:]

    private init() {
        // Even library diagnostics must never print an RTMP publish name/key.
        LBLogger.with(kHaishinKitIdentifier).appender = NullAppender.shared
        LBLogger.with(kRTMPHaishinKitIdentifier).appender = NullAppender.shared
        let center = NotificationCenter.default
        observers.append(center.addObserver(forName: UIApplication.didEnterBackgroundNotification, object: nil, queue: .main) { [weak self] _ in
            Task { @MainActor in
                guard let self, self.selection?.mode == "camera" else { return }
                await self.stop(finalState: "ended")
            }
        })
        observers.append(center.addObserver(forName: AVAudioSession.interruptionNotification, object: nil, queue: .main) { [weak self] note in
            guard let raw = note.userInfo?[AVAudioSessionInterruptionTypeKey] as? UInt,
                  raw == AVAudioSession.InterruptionType.began.rawValue else { return }
            Task { @MainActor in await self?.stop(finalState: "failed") }
        })
        observers.append(center.addObserver(forName: ProcessInfo.thermalStateDidChangeNotification, object: nil, queue: .main) { [weak self] _ in
            if ProcessInfo.processInfo.thermalState == .critical {
                Task { @MainActor in await self?.stop(finalState: "failed") }
            }
        })
        observers.append(center.addObserver(forName: UIApplication.protectedDataWillBecomeUnavailableNotification, object: nil, queue: .main) { [weak self] _ in
            Task { @MainActor in await self?.stop(finalState: "ended") }
        })
    }

    var microphoneAllowed: Bool { selection?.microphone == true }
    var microphoneIsMuted: Bool { microphoneMuted }

    public var enabled: Bool { Bundle.main.object(forInfoDictionaryKey: "CLIPTNativeBroadcastEnabled") as? Bool == true }

    public func capabilities() -> [String: Any] {
        guard enabled, supportsHardwareH264(width: 640, height: 360), ProcessInfo.processInfo.thermalState != .critical else {
            return ["protocolVersion": 1, "platform": "ios", "modes": [], "qualityIds": [],
                    "microphone": false, "cameraSwitch": false, "backgroundScreen": false, "systemAudio": "unsupported"]
        }
        let cameras = AVCaptureDevice.DiscoverySession(deviceTypes: [.builtInWideAngleCamera], mediaType: .video, position: .unspecified).devices
        var modes: [String] = cameras.isEmpty ? [] : ["camera"]
        let backgroundScreen = screenAvailable
        if backgroundScreen { modes.append("screen") }
        // Higher profiles require a real hardware encoder and sufficient camera formats.
        // Screen capture defaults to the same conservative tested preset selection.
        let profiles: [(String, Int32, Int32, Double)] = [("360p15",640,360,15), ("480p30",854,480,30), ("720p30",1280,720,30), ("1080p30",1920,1080,30)]
        let quality = profiles.filter { profile in
            guard supportsHardwareH264(width: profile.1, height: profile.2) else { return false }
            return cameras.isEmpty ? backgroundScreen && profile.0 == "360p15" : cameras.contains { camera in
                camera.formats.contains { format in
                    let dimensions = CMVideoFormatDescriptionGetDimensions(format.formatDescription)
                    return dimensions.width >= profile.1 && dimensions.height >= profile.2 && format.videoSupportedFrameRateRanges.contains { $0.maxFrameRate >= profile.3 }
                }
            }
        }.map { $0.0 }
        return ["protocolVersion": 1, "platform": "ios", "modes": modes, "qualityIds": quality,
                "microphone": true, "cameraSwitch": cameras.contains { $0.position == .front } && cameras.contains { $0.position == .back },
                "backgroundScreen": backgroundScreen, "systemAudio": backgroundScreen ? "permission-dependent" : "unsupported"]
    }

    private func supportsHardwareH264(width: Int32, height: Int32) -> Bool {
        let cacheKey = String(width) + "x" + String(height)
        if let supported = encoderSupport[cacheKey] { return supported }
        guard #available(iOS 17.4, *) else { return false }
        var session: VTCompressionSession?
        let specification = [kVTVideoEncoderSpecification_RequireHardwareAcceleratedVideoEncoder: true] as CFDictionary
        let result = VTCompressionSessionCreate(allocator: kCFAllocatorDefault,
            width: width, height: height, codecType: kCMVideoCodecType_H264,
            encoderSpecification: specification, imageBufferAttributes: nil,
            compressedDataAllocator: nil, outputCallback: nil, refcon: nil,
            compressionSessionOut: &session)
        let supported = result == noErr && session != nil
        if let session { VTCompressionSessionInvalidate(session) }
        encoderSupport[cacheKey] = supported
        return supported
    }

    private var screenAvailable: Bool {
        #if CLIPT_IOS27_SCREEN_CAPTURE && canImport(ScreenCaptureKit)
        if #available(iOS 27.0, *) { return ScreenCaptureSession.isAvailable }
        #endif
        return false
    }

    public func start(grant: String, selection requested: BroadcastSelection, presenter: UIViewController) async throws {
        guard enabled else { throw BroadcastFailure.unsupported }
        guard ["idle", "ended", "failed"].contains(state) else { throw BroadcastFailure.busy }
        let caps = capabilities()
        guard (caps["modes"] as? [String])?.contains(requested.mode) == true,
              (caps["qualityIds"] as? [String])?.contains(requested.quality) == true else { throw BroadcastFailure.unsupported }
        let encoder = try requested.encoder()
        let current = UUID()
        operation = current
        selection = requested
        state = "requesting-permission"
        var provisionalMixer: MediaMixer?
        var provisionalScreen: (any NativeScreenCapture)?
        do {
            if requested.mode == "camera" {
                guard await AVCaptureDevice.requestAccess(for: .video) else { throw BroadcastFailure.permissionDenied }
            }
            if requested.microphone {
                guard await AVCaptureDevice.requestAccess(for: .audio) else { throw BroadcastFailure.permissionDenied }
            }
            try ensure(current)
            let (session, expiry) = try await api.redeem(grant: grant, requested: requested)
            guard operation == current else { await api.stop(session); throw BroadcastFailure.cancelled }
            credential = session
            deadline = expiry
            try ensure(current)
            let audio = AVAudioSession.sharedInstance()
            try audio.setCategory(.playAndRecord, mode: requested.mode == "screen" ? .default : .videoChat,
                options: requested.mode == "screen" ? [.defaultToSpeaker, .allowBluetooth, .mixWithOthers] : [.defaultToSpeaker, .allowBluetooth])
            try audio.setPreferredSampleRate(Double(encoder.audioSampleRate))
            try audio.setActive(true)
            microphoneMuted = !requested.microphone
            systemMuted = !requested.systemAudio
            let media = MediaMixer(captureSessionMode: requested.mode == "camera" ? .single : .manual,
                                   multiTrackAudioMixingEnabled: requested.mode == "screen")
            mixer = media
            provisionalMixer = media
            await media.setMonitoringEnabled(false)
            await media.setAudioMixerSettings(AudioMixerSettings(sampleRate: Double(encoder.audioSampleRate), channels: 2,
                mainTrack: requested.microphone ? 0 : 1, tracks: [0: .init(), 1: .init()]))
            await media.setVideoMixerSettings(VideoMixerSettings(mode: .passthrough))
            try ensure(current)
            if requested.mode == "camera" {
                cameraPosition = requested.cameraPosition == "front" ? .front : .back
                guard let camera = camera(at: cameraPosition) else { throw BroadcastFailure.capture }
                await media.setSessionPreset(encoder.width >= 1920 || encoder.height >= 1920 ? .hd1920x1080 : (encoder.width >= 1280 || encoder.height >= 1280 ? .hd1280x720 : .vga640x480))
                try await media.attachVideo(camera)
                try ensure(current)
                if requested.microphone { try await media.attachAudio(AVCaptureDevice.default(for: .audio)) }
                await media.setVideoOrientation(requested.orientation == "portrait" ? .portrait : .landscapeRight)
                try await media.setFrameRate(Double(encoder.fps))
                try ensure(current)
                let view = BroadcastPreviewController(engine: self)
                preview = view
                presenter.present(view, animated: !UIAccessibility.isReduceMotionEnabled)
                await media.addOutput(view.videoView)
                await media.startRunning()
            } else {
                #if CLIPT_IOS27_SCREEN_CAPTURE && canImport(ScreenCaptureKit)
                if #available(iOS 27.0, *) {
                    let capture = ScreenCaptureSession()
                    screen = capture
                    provisionalScreen = capture
                    capture.onTermination = { [weak self] in Task { @MainActor in await self?.stop(finalState: "ended") } }
                    await media.startRunning()
                    try await capture.start(selection: requested, encoder: encoder, mixer: media)
                } else { throw BroadcastFailure.unsupported }
                #else
                throw BroadcastFailure.unsupported
                #endif
            }
            try ensure(current)
            try await applyMute()
            state = "connecting"
            try await connect(session: session, encoder: encoder, mixer: media, operation: current)
            try ensure(current)
            state = "publishing"
            UIApplication.shared.isIdleTimerDisabled = requested.mode == "camera"
            startLifecycleTasks(operation: current)
        } catch {
            if operation == current { await stop(finalState: "failed") }
            else {
                provisionalScreen?.onTermination = nil
                await provisionalScreen?.stop()
                await provisionalMixer?.stopRunning()
                try? await provisionalMixer?.attachVideo(nil)
                try? await provisionalMixer?.attachAudio(nil)
            }
            // Do not pass library, provider or network errors into JS/logs.
            throw error as? BroadcastFailure ?? BroadcastFailure.capture
        }
    }

    private func ensure(_ current: UUID) throws {
        guard operation == current, state != "stopping", state != "ended", state != "failed" else { throw BroadcastFailure.cancelled }
        if let deadline, deadline <= Date() { throw BroadcastFailure.expired }
    }

    private func connect(session: NativeBroadcastSession, encoder: BroadcastEncoder, mixer: MediaMixer, operation current: UUID) async throws {
        let link = RTMPConnection(timeout: 10, requestTimeout: 10_000)
        let stream = RTMPStream(connection: link)
        try await stream.setVideoSettings(VideoCodecSettings(videoSize: CGSize(width: encoder.width, height: encoder.height),
            bitRate: encoder.bitrate, profileLevel: kVTProfileLevel_H264_Main_AutoLevel as String,
            scalingMode: .letterbox, maxKeyFrameIntervalDuration: Int32(encoder.keyframeSeconds),
            allowFrameReordering: false, expectedFrameRate: Double(encoder.fps)))
        var video = await stream.videoSettings
        video.frameInterval = (1 / Double(encoder.fps)) - 0.001
        try await stream.setVideoSettings(video)
        try await stream.setAudioSettings(AudioCodecSettings(bitRate: encoder.audioBitrate, sampleRate: Double(encoder.audioSampleRate), format: .aac))
        await stream.setVideoInputBufferCounts(5)
        connection = link
        output = stream
        do {
            _ = try await link.connect(session.ingestUrl)
            try ensure(current)
            _ = try await stream.publish(session.streamKey)
            try ensure(current)
            await mixer.addOutput(stream)
        } catch {
            try? await link.close()
            if connection === link { connection = nil; output = nil }
            throw error
        }
    }

    private func startLifecycleTasks(operation current: UUID) {
        heartbeatLastSucceeded = Date()
        leaseTask = Task { [weak self] in
            while !Task.isCancelled {
                do { try await Task.sleep(nanoseconds: 5_000_000_000) } catch { return }
                guard let self, self.operation == current else { return }
                if let last = self.heartbeatLastSucceeded, Date().timeIntervalSince(last) >= 85 {
                    await self.stop(finalState: "failed"); return
                }
            }
        }
        expiryTask = Task { [weak self] in
            guard let self, let deadline = self.deadline else { return }
            let interval = max(0, deadline.timeIntervalSinceNow)
            do { try await Task.sleep(nanoseconds: UInt64(interval * 1_000_000_000)) } catch { return }
            if self.operation == current { await self.stop(finalState: "ended") }
        }
        heartbeatTask = Task { [weak self] in
            var failures = 0
            while !Task.isCancelled {
                do { try await Task.sleep(nanoseconds: 30_000_000_000) } catch { return }
                guard let self, self.operation == current, let session = self.credential else { return }
                do { try await self.api.heartbeat(session); self.heartbeatLastSucceeded = Date(); failures = 0 }
                catch BroadcastFailure.unauthorized { await self.stop(finalState: "failed"); return }
                catch { failures += 1; if failures >= 3 { await self.stop(finalState: "failed"); return } }
            }
        }
        monitorTask = Task { [weak self] in
            while !Task.isCancelled {
                do { try await Task.sleep(nanoseconds: 2_000_000_000) } catch { return }
                guard let self, self.operation == current else { return }
                if let link = self.connection, await link.connected { continue }
                await self.reconnect(operation: current)
                return
            }
        }
    }

    private func reconnect(operation current: UUID) async {
        guard !reconnecting, let session = credential, let requested = selection, let media = mixer,
              let encoder = try? requested.encoder() else { return }
        reconnecting = true
        state = "reconnecting"
        defer { reconnecting = false }
        for delay in [UInt64(1), 2, 4, 8, 16] {
            do {
                try await Task.sleep(nanoseconds: delay * 1_000_000_000)
                try ensure(current)
                if let old = output { await media.removeOutput(old) }
                try? await connection?.close()
                try await connect(session: session, encoder: encoder, mixer: media, operation: current)
                state = "publishing"
                monitorTask = Task { [weak self] in
                    do { try await Task.sleep(nanoseconds: 2_000_000_000) } catch { return }
                    guard let self, self.operation == current else { return }
                    self.startMonitor(operation: current)
                }
                return
            } catch { if operation != current { return } }
        }
        await stop(finalState: "failed")
    }

    private func startMonitor(operation current: UUID) {
        monitorTask = Task { [weak self] in
            while !Task.isCancelled {
                do { try await Task.sleep(nanoseconds: 2_000_000_000) } catch { return }
                guard let self, self.operation == current else { return }
                if let link = self.connection, await link.connected { continue }
                await self.reconnect(operation: current)
                return
            }
        }
    }

    public func stop() async { await stop(finalState: "ended") }

    private func stop(finalState: String) async {
        guard state != "stopping" else { return }
        operation = UUID()
        state = "stopping"
        heartbeatTask?.cancel(); heartbeatTask = nil
        monitorTask?.cancel(); monitorTask = nil
        expiryTask?.cancel(); expiryTask = nil
        leaseTask?.cancel(); leaseTask = nil
        heartbeatLastSucceeded = nil
        // Halt capture before attempting network cleanup. Keys disappear from
        // retained application state immediately even if the network is absent.
        let session = credential
        credential = nil
        let media = mixer
        mixer = nil
        let capture = screen
        screen = nil
        capture?.onTermination = nil
        await capture?.stop()
        if let media {
            await media.stopRunning()
            try? await media.attachAudio(nil)
            try? await media.attachVideo(nil)
            if let output { await media.removeOutput(output) }
        }
        try? await connection?.close()
        connection = nil
        output = nil
        deadline = nil
        selection = nil
        UIApplication.shared.isIdleTimerDisabled = false
        preview?.dismiss(animated: !UIAccessibility.isReduceMotionEnabled)
        preview = nil
        try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
        state = finalState
        if let session { Task { await api.stop(session) } }
    }

    public func setMuted(microphone: Bool, systemAudio: Bool) async throws {
        guard selection != nil else { throw BroadcastFailure.unavailable }
        // A permission initially denied/disabled cannot be silently enabled.
        if !microphone && selection?.microphone != true { throw BroadcastFailure.permissionDenied }
        if !systemAudio && selection?.systemAudio != true { throw BroadcastFailure.permissionDenied }
        microphoneMuted = microphone
        systemMuted = systemAudio
        try await applyMute()
    }

    private func applyMute() async throws {
        guard let mixer else { throw BroadcastFailure.unavailable }
        var settings = await mixer.audioMixerSettings
        var microphone = settings.tracks[0] ?? .init()
        microphone.isMuted = microphoneMuted
        settings.tracks[0] = microphone
        var system = settings.tracks[1] ?? .init()
        system.isMuted = systemMuted
        settings.tracks[1] = system
        await mixer.setAudioMixerSettings(settings)
    }

    public func switchCamera() async throws {
        guard selection?.mode == "camera", let mixer else { throw BroadcastFailure.unsupported }
        let next: AVCaptureDevice.Position = cameraPosition == .front ? .back : .front
        guard let device = camera(at: next) else { throw BroadcastFailure.unsupported }
        try await mixer.attachVideo(device)
        cameraPosition = next
        if let requested = selection { try await mixer.setFrameRate(Double(requested.encoder().fps)) }
    }

    private func camera(at position: AVCaptureDevice.Position) -> AVCaptureDevice? {
        AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: position)
    }
}
#endif
