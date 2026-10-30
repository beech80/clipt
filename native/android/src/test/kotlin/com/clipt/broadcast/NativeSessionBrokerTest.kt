package com.clipt.broadcast

import org.json.JSONObject
import org.junit.Assert.*
import org.junit.Test
import java.time.Instant

class NativeSessionBrokerTest {
    private val now = Instant.parse("2026-10-30T12:00:00Z").toEpochMilli()
    private val selection = BroadcastSelection(CaptureMode.SCREEN, "360p15", false, true, false, false)
    private fun response() = JSONObject().put("protocolVersion", 1)
        .put("sessionId", "a072664f-0b65-4e72-b058-cd58a61f9515")
        .put("ingestUrl", "rtmps://global-live.mux.com:443/app")
        .put("streamKey", "test-stream-key-1234567890")
        .put("stopToken", "n".repeat(64))
        .put("expiresAt", "2026-10-30T12:05:00Z")
        .put("maxDurationSeconds", 300)
        .put("selection", BroadcastPolicy.selectionJson(selection))
    @Test fun acceptsBoundSessionAndDoesNotExposeSecretsThroughToString() {
        val session = NativeSessionBroker().decode(response(), selection, now)
        assertEquals("a072664f-0b65-4e72-b058-cd58a61f9515", session.sessionId)
        assertFalse(session.toString().contains(session.streamKey))
        assertFalse(session.toString().contains(session.stopToken))
        session.clearSecrets()
        assertEquals("", session.streamKey)
        assertEquals("", session.stopToken)
    }
    @Test fun refusesDifferentServerSelection() {
        val value = response().put("selection", BroadcastPolicy.selectionJson(
            BroadcastSelection(CaptureMode.CAMERA, "360p15", false, true, false, false)))
        assertThrows(IllegalArgumentException::class.java) { NativeSessionBroker().decode(value, selection, now) }
    }
    @Test fun refusesRedirectedPlaintextAndCredentialBearingHosts() {
        for (url in listOf("rtmp://global-live.mux.com:443/app", "rtmps://other.example:443/app",
            "rtmps://global-live.mux.com:444/app", "rtmps://user@global-live.mux.com:443/app",
            "rtmps://global-live.mux.com:443/app?token=test", "rtmps://global-live.mux.com:443/app/test")) {
            assertThrows(IllegalArgumentException::class.java) {
                NativeSessionBroker().decode(response().put("ingestUrl", url), selection, now)
            }
        }
    }
    @Test fun refusesExpiredOrUnboundedSessions() {
        for (value in listOf(response().put("expiresAt", "2026-10-30T11:59:59Z"),
            response().put("expiresAt", "2026-10-31T12:00:00Z"), response().put("maxDurationSeconds", 9999999))) {
            assertThrows(IllegalArgumentException::class.java) { NativeSessionBroker().decode(value, selection, now) }
        }
    }
    @Test fun rejectsWrongProtocolAndMalformedCredentials() {
        for (value in listOf(response().put("protocolVersion", "1"), response().put("streamKey", "key/extra"),
            response().put("stopToken", "short"))) {
            assertThrows(IllegalArgumentException::class.java) { NativeSessionBroker().decode(value, selection, now) }
        }
    }
}
