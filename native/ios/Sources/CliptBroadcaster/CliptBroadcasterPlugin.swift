#if os(iOS)
import Capacitor
import CliptBroadcastCore
import Foundation

@objc(CliptBroadcasterPlugin)
public final class CliptBroadcasterPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "CliptBroadcasterPlugin"
    public let jsName = "CliptBroadcaster"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getCapabilities", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "start", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stop", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setMuted", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "switchCamera", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getStatus", returnType: CAPPluginReturnPromise)
    ]

    @objc public func getCapabilities(_ call: CAPPluginCall) {
        Task { @MainActor in call.resolve(CliptBroadcastEngine.shared.capabilities()) }
    }
    @objc public func getStatus(_ call: CAPPluginCall) {
        Task { @MainActor in call.resolve(["state": CliptBroadcastEngine.shared.state]) }
    }
    @objc public func start(_ call: CAPPluginCall) {
        Task { @MainActor [weak self] in
            guard let presenter = self?.bridge?.viewController, let grant = call.getString("grant"),
                  let raw = call.getObject("selection") else { call.reject("Native broadcast options are invalid", "INVALID_SELECTION"); return }
            do {
                let selected = try BroadcastSelection(json: raw)
                // The supplied JS encoder object is deliberately ignored. Native
                // code derives and bounds all settings independently.
                try await CliptBroadcastEngine.shared.start(grant: grant, selection: selected, presenter: presenter)
                call.resolve()
            } catch {
                call.reject(Self.message(error), Self.code(error))
            }
        }
    }
    @objc public func stop(_ call: CAPPluginCall) {
        Task { @MainActor in await CliptBroadcastEngine.shared.stop(); call.resolve() }
    }
    @objc public func setMuted(_ call: CAPPluginCall) {
        guard let microphone = call.getBool("microphone"), let systemAudio = call.getBool("systemAudio") else {
            call.reject("Audio settings are invalid", "INVALID_SELECTION"); return
        }
        Task { @MainActor in
            do { try await CliptBroadcastEngine.shared.setMuted(microphone: microphone, systemAudio: systemAudio); call.resolve() }
            catch { call.reject(Self.message(error), Self.code(error)) }
        }
    }
    @objc public func switchCamera(_ call: CAPPluginCall) {
        Task { @MainActor in
            do { try await CliptBroadcastEngine.shared.switchCamera(); call.resolve() }
            catch { call.reject(Self.message(error), Self.code(error)) }
        }
    }
    private static func code(_ error: Error) -> String {
        switch error as? BroadcastFailure {
        case .permissionDenied: return "PERMISSION_DENIED"
        case .cancelled: return "CANCELLED"
        case .unsupported: return "UNSUPPORTED"
        case .busy: return "BUSY"
        case .invalidGrant, .unauthorized: return "AUTHORIZATION_FAILED"
        case .expired: return "SESSION_EXPIRED"
        default: return "BROADCAST_FAILED"
        }
    }
    private static func message(_ error: Error) -> String {
        switch error as? BroadcastFailure {
        case .permissionDenied: return "Camera, microphone or screen sharing permission was not granted"
        case .cancelled: return "Broadcast setup was cancelled"
        case .unsupported: return "Broadcast mode is unavailable in this build or device"
        case .busy: return "A broadcast is already active"
        case .expired: return "Broadcast authorization expired"
        default: return "Native broadcasting could not complete. Try again from Go Live"
        }
    }
}
#endif
