import Foundation

// One fixed development API. Neither JS nor a response can replace this origin.
// Native session credentials never cross the Capacitor bridge or touch disk.
final class BroadcastSessionAPI: NSObject, URLSessionTaskDelegate {
    static let endpoint = URL(string: "https://akiksrlzdqvipqbbjxpw.supabase.co/functions/v1/native-broadcast-session")!
    private lazy var session: URLSession = {
        let config = URLSessionConfiguration.ephemeral
        config.timeoutIntervalForRequest = 15
        config.timeoutIntervalForResource = 20
        config.httpCookieStorage = nil
        config.urlCache = nil
        config.urlCredentialStorage = nil
        config.requestCachePolicy = .reloadIgnoringLocalCacheData
        return URLSession(configuration: config, delegate: self, delegateQueue: nil)
    }()

    func urlSession(_ session: URLSession, task: URLSessionTask,
                    willPerformHTTPRedirection response: HTTPURLResponse,
                    newRequest request: URLRequest,
                    completionHandler: @escaping (URLRequest?) -> Void) {
        completionHandler(nil)
    }

    func redeem(grant: String, requested: BroadcastSelection) async throws -> (NativeBroadcastSession, Date) {
        guard NativeBroadcastSession.isOpaque(grant) else { throw BroadcastFailure.invalidGrant }
        let data = try await request(["action": "redeem", "protocolVersion": 1, "grant": grant])
        let value: NativeBroadcastSession
        do { value = try JSONDecoder().decode(NativeBroadcastSession.self, from: data) }
        catch { throw BroadcastFailure.unauthorized }
        return (value, try value.validate(requested: requested))
    }

    func heartbeat(_ value: NativeBroadcastSession) async throws {
        _ = try await request(["action": "heartbeat", "protocolVersion": 1,
                              "sessionId": value.sessionId, "stopToken": value.stopToken])
    }

    func stop(_ value: NativeBroadcastSession) async {
        _ = try? await request(["action": "stop", "protocolVersion": 1,
                               "sessionId": value.sessionId, "stopToken": value.stopToken])
    }

    private func request(_ body: [String: Any]) async throws -> Data {
        var request = URLRequest(url: Self.endpoint)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("no-store", forHTTPHeaderField: "Cache-Control")
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        let data: Data
        let response: URLResponse
        do { (data, response) = try await session.data(for: request) }
        catch { throw BroadcastFailure.network }
        guard let http = response as? HTTPURLResponse, data.count <= 32_768 else { throw BroadcastFailure.unavailable }
        guard (200...299).contains(http.statusCode) else {
            if [400, 401, 403, 404, 409, 410].contains(http.statusCode) { throw BroadcastFailure.unauthorized }
            throw BroadcastFailure.unavailable
        }
        return data
    }
}
