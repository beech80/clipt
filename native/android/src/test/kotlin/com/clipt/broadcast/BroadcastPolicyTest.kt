package com.clipt.broadcast

import org.json.JSONObject
import org.junit.Assert.*
import org.junit.Test

class BroadcastPolicyTest {
    private fun selected() = JSONObject("""{"mode":"screen","quality":"360p15","orientation":"landscape","microphone":true,"systemAudio":false,"cameraPosition":"back"}""")
    @Test fun defaultsUseExplicitBpsAndCorrectDimensions() {
        val profile = BroadcastPolicy.profile(BroadcastPolicy.selection(selected()))
        assertEquals(EncoderProfile(640, 360, 15, 1_000_000), profile)
    }
    @Test fun portraitSwapsDimensionsWithoutChangingRate() {
        val profile = BroadcastPolicy.profile(BroadcastPolicy.selection(selected().put("orientation", "portrait")))
        assertEquals(EncoderProfile(360, 640, 15, 1_000_000), profile)
    }
    @Test fun rejectsUnknownFieldsAndInvalidTypes() {
        for (json in listOf(selected().put("host", "evil"), selected().put("microphone", "true"), selected().put("quality", "8k"))) {
            assertThrows(IllegalArgumentException::class.java) { BroadcastPolicy.selection(json) }
        }
    }
    @Test fun systemAudioCannotBeSmuggledIntoCamera() {
        assertThrows(IllegalArgumentException::class.java) {
            BroadcastPolicy.selection(selected().put("mode", "camera").put("systemAudio", true))
        }
    }
    @Test fun secretsHaveOpaqueGrantSyntax() {
        assertFalse(BroadcastPolicy.grantPattern.matches("rtmps://server/app/key"))
        assertFalse(BroadcastPolicy.grantPattern.matches("a".repeat(63)))
        assertTrue(BroadcastPolicy.grantPattern.matches("a".repeat(64)))
    }
    @Test fun rejectsCallerSuppliedBitrateAndUrls() {
        val selection = BroadcastPolicy.selection(selected())
        val encoder = JSONObject("""{"width":640,"height":360,"fps":15,"videoBitrateBps":1000000,"audioBitrateBps":64000,"audioSampleRateHz":48000,"keyframeIntervalSeconds":2,"videoCodec":"h264","audioCodec":"aac"}""")
        BroadcastPolicy.requireEncoder(encoder, selection)
        assertThrows(IllegalArgumentException::class.java) { BroadcastPolicy.requireEncoder(JSONObject(encoder.toString()).put("videoBitrateBps", 99999999), selection) }
        assertThrows(IllegalArgumentException::class.java) { BroadcastPolicy.requireEncoder(JSONObject(encoder.toString()).put("streamKey", "secret"), selection) }
    }
}
