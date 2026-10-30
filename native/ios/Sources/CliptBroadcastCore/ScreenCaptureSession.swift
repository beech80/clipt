#if os(iOS) && CLIPT_IOS27_SCREEN_CAPTURE && canImport(ScreenCaptureKit)
import AVFoundation
import HaishinKit
import ScreenCaptureKit
import UIKit

@available(iOS 27.0, *)
@MainActor
final class ScreenCaptureSession: NSObject, NativeScreenCapture, SCContentSharingPickerObserver, SCStreamDelegate, SCStreamOutput {
    static var isAvailable: Bool {
        SCContentSharingPicker.shared.isAvailable &&
        (Bundle.main.object(forInfoDictionaryKey: "UIBackgroundModes") as? [String])?.contains("screen-capture") == true
    }
    var onTermination: (() -> Void)?
    private let picker = SCContentSharingPicker.shared
    private var stream: SCStream?
    private var pending: CheckedContinuation<Void, Error>?
    private var timer: Task<Void, Never>?
    private var selection: BroadcastSelection?
    private var encoder: BroadcastEncoder?
    private var mixer: MediaMixer?
    private var stopped = false
    private var microphoneOutputAttached = false
    // Drop excess incoming frames rather than accumulating native Tasks/buffers.
    private nonisolated let slots = DispatchSemaphore(value: 4)
    private nonisolated let sampleQueue = DispatchQueue(label: "com.clipt.broadcast.screen", qos: .userInitiated)

    func start(selection: BroadcastSelection, encoder: BroadcastEncoder, mixer: MediaMixer) async throws {
        guard Self.isAvailable, pending == nil, stream == nil else { throw BroadcastFailure.unsupported }
        self.selection = selection
        self.encoder = encoder
        self.mixer = mixer
        stopped = false
        var config = SCContentSharingPickerConfiguration()
        config.showsMicrophoneControl = selection.microphone
        // Full display is the only path here. No camera overlay silently added.
        config.showsCameraControl = false
        picker.defaultConfiguration = config
        picker.add(self)
        picker.isActive = true
        try await withTaskCancellationHandler {
            try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, Error>) in
                pending = continuation
                timer = Task { [weak self] in
                    do { try await Task.sleep(nanoseconds: 60_000_000_000) } catch { return }
                    guard let self, self.pending != nil else { return }
                    self.failPending(BroadcastFailure.cancelled)
                    await self.stop()
                }
                picker.present()
            }
        } onCancel: {
            Task { @MainActor [weak self] in await self?.stop() }
        }
    }

    func stop() async {
        stopped = true
        timer?.cancel(); timer = nil
        picker.remove(self)
        picker.isActive = false
        failPending(BroadcastFailure.cancelled)
        let previous = stream
        stream = nil
        microphoneOutputAttached = false
        try? await previous?.stopCapture()
        mixer = nil
        selection = nil
        encoder = nil
    }

    private func failPending(_ error: Error) {
        let current = pending
        pending = nil
        current?.resume(throwing: error)
    }

    nonisolated func contentSharingPicker(_ picker: SCContentSharingPicker, didCancelFor stream: SCStream?) {
        Task { @MainActor [weak self] in
            guard let self else { return }
            if self.pending != nil { self.failPending(BroadcastFailure.cancelled) }
            else { self.onTermination?() }
        }
    }
    nonisolated func contentSharingPickerStartDidFailWithError(_ error: Error) {
        Task { @MainActor [weak self] in
            self?.failPending(BroadcastFailure.permissionDenied)
            self?.onTermination?()
        }
    }
    nonisolated func contentSharingPicker(_ picker: SCContentSharingPicker, didUpdateWith filter: SCContentFilter, for stream: SCStream?) {
        Task { @MainActor [weak self] in await self?.use(filter: filter, updating: stream) }
    }

    private func use(filter: SCContentFilter, updating previous: SCStream?) async {
        guard !stopped, let requested = selection, let encoder else { return }
        let configuration = SCStreamConfiguration()
        // Keep the captured source's aspect ratio. Letterboxing into the chosen
        // encoder dimensions happens in VideoToolbox, never by stretching a HUD.
        let bounds = filter.contentRect
        guard bounds.width > 0, bounds.height > 0 else { failPending(BroadcastFailure.capture); return }
        let scale = min(CGFloat(encoder.width) / bounds.width, CGFloat(encoder.height) / bounds.height)
        configuration.width = max(2, Int(bounds.width * scale) / 2 * 2)
        configuration.height = max(2, Int(bounds.height * scale) / 2 * 2)
        configuration.pixelFormat = kCVPixelFormatType_32BGRA
        configuration.capturesAudio = requested.systemAudio
        configuration.sampleRate = encoder.audioSampleRate
        configuration.channelCount = 2
        configuration.excludesCurrentProcessAudio = true
        do {
            if let previous, previous === self.stream {
                try await previous.updateContentFilter(filter)
                try await previous.updateConfiguration(configuration)
                let enableMicrophone = requested.microphone && filter.isMicrophoneEnabled
                if enableMicrophone && !microphoneOutputAttached {
                    try previous.addStreamOutput(self, type: .microphone, sampleHandlerQueue: sampleQueue)
                    microphoneOutputAttached = true
                } else if !enableMicrophone && microphoneOutputAttached {
                    try previous.removeStreamOutput(self, type: .microphone)
                    microphoneOutputAttached = false
                }
                return
            }
            guard pending != nil, stream == nil else { return }
            let capture = SCStream(filter: filter, configuration: configuration, delegate: self)
            stream = capture
            try capture.addStreamOutput(self, type: .screen, sampleHandlerQueue: sampleQueue)
            if requested.systemAudio { try capture.addStreamOutput(self, type: .audio, sampleHandlerQueue: sampleQueue) }
            if requested.microphone && filter.isMicrophoneEnabled {
                try capture.addStreamOutput(self, type: .microphone, sampleHandlerQueue: sampleQueue)
                microphoneOutputAttached = true
            }
            try await capture.startCapture()
            guard !stopped else { try? await capture.stopCapture(); return }
            timer?.cancel(); timer = nil
            let continuation = pending
            pending = nil
            continuation?.resume()
        } catch {
            failPending(BroadcastFailure.capture)
            onTermination?()
        }
    }

    nonisolated func stream(_ stream: SCStream, didStopWithError error: Error) {
        Task { @MainActor [weak self] in
            guard let self, !self.stopped else { return }
            self.failPending(BroadcastFailure.capture)
            self.onTermination?()
        }
    }

    nonisolated func stream(_ stream: SCStream, didOutputSampleBuffer sampleBuffer: CMSampleBuffer, of type: SCStreamOutputType) {
        guard CMSampleBufferDataIsReady(sampleBuffer), slots.wait(timeout: .now()) == .success else { return }
        Task { @MainActor [weak self, slots] in
            defer { slots.signal() }
            guard let self, !self.stopped, self.stream === stream, let mixer = self.mixer else { return }
            switch type {
            case .screen: await mixer.append(sampleBuffer)
            case .audio: if self.selection?.systemAudio == true { await mixer.append(sampleBuffer, track: 1) }
            case .microphone: if self.selection?.microphone == true { await mixer.append(sampleBuffer, track: 0) }
            @unknown default: break
            }
        }
    }
}
#endif
