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
    var onAudioSourcesChanged: (@MainActor (Bool) async -> Void)?
    private let picker = SCContentSharingPicker.shared
    private var stream: SCStream?
    private var pending: CheckedContinuation<Void, Error>?
    private var timer: Task<Void, Never>?
    private var updates: Task<Void, Never>?
    private var revision = ScreenCaptureRevision()
    private var selection: BroadcastSelection?
    private var encoder: BroadcastEncoder?
    private var mixer: MediaMixer?
    private var stopped = false
    private var acceptingSamples = false
    private nonisolated let slots = DispatchSemaphore(value: 4)
    private nonisolated let sampleQueue = DispatchQueue(label: "com.clipt.broadcast.screen", qos: .userInitiated)

    func start(selection: BroadcastSelection, encoder: BroadcastEncoder, mixer: MediaMixer) async throws {
        guard Self.isAvailable, pending == nil, stream == nil else { throw BroadcastFailure.unsupported }
        self.selection = selection
        self.encoder = encoder
        self.mixer = mixer
        stopped = false
        acceptingSamples = false
        revision.begin()
        var config = SCContentSharingPickerConfiguration()
        config.showsMicrophoneControl = selection.microphone
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
        acceptingSamples = false
        revision.stop()
        updates?.cancel(); updates = nil
        timer?.cancel(); timer = nil
        picker.remove(self)
        picker.isActive = false
        failPending(BroadcastFailure.cancelled)
        let previous = stream
        stream = nil
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

    private func failCapture(_ error: Error) {
        acceptingSamples = false
        revision.stop()
        failPending(error)
        onTermination?()
    }

    nonisolated func contentSharingPicker(_ picker: SCContentSharingPicker, didCancelFor stream: SCStream?) {
        Task { @MainActor [weak self] in
            guard let self, !self.stopped else { return }
            // Dismissing a source-change picker does not revoke the existing
            // stream. An OS Stop is handled by the stream delegate below.
            if self.pending != nil {
                self.failPending(BroadcastFailure.cancelled)
                await self.stop()
            }
        }
    }
    nonisolated func contentSharingPickerStartDidFailWithError(_ error: Error) {
        Task { @MainActor [weak self] in self?.failCapture(BroadcastFailure.permissionDenied) }
    }
    nonisolated func contentSharingPicker(_ picker: SCContentSharingPicker, didUpdateWith filter: SCContentFilter, for stream: SCStream?) {
        Task { @MainActor [weak self] in self?.queue(filter: filter) }
    }

    private func queue(filter: SCContentFilter) {
        guard !stopped, pending != nil || stream != nil || updates != nil,
              let current = revision.requestChange() else { return }
        // Stop forwarding the prior source immediately. Serialize native stop /
        // start operations, and let only the latest picker decision take effect.
        acceptingSamples = false
        let earlier = updates
        updates = Task { @MainActor [weak self] in
            await earlier?.value
            guard let self, self.revision.accepts(current), !Task.isCancelled else { return }
            await self.use(filter: filter, revision: current)
            if self.revision.accepts(current) { self.updates = nil }
        }
    }

    private func use(filter: SCContentFilter, revision current: UUID) async {
        guard !stopped, revision.accepts(current), let requested = selection, let encoder else { return }
        let previous = stream
        stream = nil
        try? await previous?.stopCapture()
        guard !stopped, revision.accepts(current), !Task.isCancelled else { return }
        let bounds = filter.contentRect
        guard bounds.width > 0, bounds.height > 0 else { failCapture(BroadcastFailure.capture); return }
        let configuration = SCStreamConfiguration()
        let scale = min(CGFloat(encoder.width) / bounds.width, CGFloat(encoder.height) / bounds.height)
        configuration.width = max(2, Int(bounds.width * scale) / 2 * 2)
        configuration.height = max(2, Int(bounds.height * scale) / 2 * 2)
        // iOS chooses its supported sample format. Pixel-format overrides and
        // in-place stream/filter updates are macOS APIs, not iPhone APIs.
        configuration.capturesAudio = requested.systemAudio
        configuration.sampleRate = encoder.audioSampleRate
        configuration.channelCount = 2
        configuration.excludesCurrentProcessAudio = true
        let microphoneEnabled = requested.microphone && filter.isMicrophoneEnabled
        await onAudioSourcesChanged?(microphoneEnabled)
        guard !stopped, revision.accepts(current), !Task.isCancelled else { return }
        let capture = SCStream(filter: filter, configuration: configuration, delegate: self)
        stream = capture
        do {
            try capture.addStreamOutput(self, type: .screen, sampleHandlerQueue: sampleQueue)
            if requested.systemAudio { try capture.addStreamOutput(self, type: .audio, sampleHandlerQueue: sampleQueue) }
            if microphoneEnabled {
                try capture.addStreamOutput(self, type: .microphone, sampleHandlerQueue: sampleQueue)
            }
            try await capture.startCapture()
            guard !stopped, revision.accepts(current), !Task.isCancelled else {
                if stream === capture { stream = nil }
                try? await capture.stopCapture()
                return
            }
            acceptingSamples = true
            timer?.cancel(); timer = nil
            let continuation = pending
            pending = nil
            continuation?.resume()
        } catch {
            guard revision.accepts(current), !stopped else { return }
            failCapture(BroadcastFailure.capture)
        }
    }

    nonisolated func stream(_ stream: SCStream, didStopWithError error: Error) {
        Task { @MainActor [weak self] in
            guard let self, !self.stopped, self.stream === stream else { return }
            self.failCapture(BroadcastFailure.capture)
        }
    }

    nonisolated func stream(_ stream: SCStream, didOutputSampleBuffer sampleBuffer: CMSampleBuffer, of type: SCStreamOutputType) {
        guard CMSampleBufferDataIsReady(sampleBuffer), slots.wait(timeout: .now()) == .success else { return }
        Task { @MainActor [weak self, slots] in
            defer { slots.signal() }
            guard let self, !self.stopped, self.acceptingSamples, self.stream === stream, let mixer = self.mixer else { return }
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
