package com.clipt.broadcast

import org.json.JSONObject
import java.net.URI
import java.net.URL
import java.time.Instant
import javax.net.ssl.HttpsURLConnection

// Deliberately not a data class: its generated toString would expose credentials.
internal class NativeSession(
    val sessionId: String, val ingestUrl: String, var streamKey: String,
    var stopToken: String, val expiresAtMillis: Long, val selection: BroadcastSelection
) {
    fun clearSecrets() { streamKey = ""; stopToken = "" }
}
internal class NativeSessionException(val terminal: Boolean) : Exception("Broadcast session request failed")
internal class NativeSessionBroker {
    private val endpoint = URL(BuildConfig.BROADCAST_API_ORIGIN + "/functions/v1/native-broadcast-session")
    fun redeem(grant: String, requested: BroadcastSelection): NativeSession {
        require(BroadcastPolicy.grantPattern.matches(grant))
        val value = post(JSONObject().put("action", "redeem").put("protocolVersion", 1).put("grant", grant))
        return decode(value, requested, System.currentTimeMillis())
    }
    internal fun decode(value: JSONObject, requested: BroadcastSelection, now: Long): NativeSession {
        require(value.opt("protocolVersion") == 1)
        val returned = BroadcastPolicy.selection(value.getJSONObject("selection"))
        require(returned.mode == requested.mode && returned.quality == requested.quality &&
            returned.portrait == requested.portrait && returned.microphone == requested.microphone &&
            returned.systemAudio == requested.systemAudio && returned.frontCamera == requested.frontCamera)
        val sessionId = value.getString("sessionId")
        require(Regex("^[a-fA-F0-9-]{36}$").matches(sessionId))
        val origin = value.getString("ingestUrl")
        val uri = URI(origin)
        require(uri.scheme == "rtmps" && uri.host == "global-live.mux.com" &&
            uri.port == 443 && uri.rawPath == "/app" && uri.rawQuery == null &&
            uri.rawUserInfo == null && uri.rawFragment == null)
        val streamKey = value.getString("streamKey")
        require(Regex("^[A-Za-z0-9_-]{8,512}$").matches(streamKey))
        val stopToken = value.getString("stopToken")
        require(BroadcastPolicy.grantPattern.matches(stopToken))
        val maxSeconds = value.getLong("maxDurationSeconds")
        require(maxSeconds in 1..14_400)
        val expiry = Instant.parse(value.getString("expiresAt")).toEpochMilli()
        require(expiry > now && expiry <= now + maxSeconds * 1000L + 30_000L)
        return NativeSession(sessionId, origin, streamKey, stopToken, minOf(expiry, now + maxSeconds * 1000L), returned)
    }
    fun heartbeat(session: NativeSession) {
        post(JSONObject().put("action", "heartbeat").put("protocolVersion", 1)
            .put("sessionId", session.sessionId).put("stopToken", session.stopToken))
    }
    fun stop(session: NativeSession) {
        post(JSONObject().put("action", "stop").put("protocolVersion", 1)
            .put("sessionId", session.sessionId).put("stopToken", session.stopToken))
    }
    private fun post(body: JSONObject): JSONObject {
        require(endpoint.protocol == "https" && endpoint.host == "akiksrlzdqvipqbbjxpw.supabase.co")
        val connection = endpoint.openConnection() as HttpsURLConnection
        try {
            connection.instanceFollowRedirects = false
            connection.connectTimeout = 12_000
            connection.readTimeout = 12_000
            connection.requestMethod = "POST"
            connection.setRequestProperty("Content-Type", "application/json")
            connection.setRequestProperty("Accept", "application/json")
            connection.setRequestProperty("Cache-Control", "no-store")
            connection.useCaches = false
            connection.doOutput = true
            val bytes = body.toString().toByteArray(Charsets.UTF_8)
            connection.setFixedLengthStreamingMode(bytes.size)
            connection.outputStream.use { it.write(bytes) }
            val status = connection.responseCode
            if (status !in 200..299) throw NativeSessionException(status in setOf(400, 401, 403, 404, 409, 410, 422))
            val data = connection.inputStream.use { input ->
                val output = java.io.ByteArrayOutputStream()
                val buffer = ByteArray(2048)
                while (true) {
                    val count = input.read(buffer)
                    if (count < 0) break
                    require(output.size() + count <= 16_384)
                    output.write(buffer, 0, count)
                }
                output.toByteArray()
            }
            require(data.size <= 16_384)
            return JSONObject(String(data, Charsets.UTF_8))
        } finally { connection.disconnect() }
    }
}
