package com.clipt.broadcast

import org.json.JSONObject

internal enum class CaptureMode(val wire: String) { CAMERA("camera"), SCREEN("screen") }
internal class BroadcastSelection(
    val mode: CaptureMode, val quality: String, val portrait: Boolean,
    val microphone: Boolean, val systemAudio: Boolean, val frontCamera: Boolean
)
internal data class EncoderProfile(val width: Int, val height: Int, val fps: Int, val bitrate: Int) {
    fun oriented(portrait: Boolean) = if (portrait) copy(width = height, height = width) else this
}
internal object BroadcastPolicy {
    val profiles = linkedMapOf(
        "360p15" to EncoderProfile(640, 360, 15, 1_000_000),
        "480p30" to EncoderProfile(854, 480, 30, 1_500_000),
        "720p30" to EncoderProfile(1280, 720, 30, 2_500_000),
        "1080p30" to EncoderProfile(1920, 1080, 30, 4_500_000)
    )
    val grantPattern = Regex("^[A-Za-z0-9_-]{64,2048}$")
    fun selection(json: JSONObject): BroadcastSelection {
        require(json.keys().asSequence().toSet() == setOf("mode", "quality", "orientation", "microphone", "systemAudio", "cameraPosition"))
        val mode = CaptureMode.entries.singleOrNull { it.wire == json.opt("mode") } ?: throw IllegalArgumentException("Invalid mode")
        val quality = json.opt("quality") as? String ?: throw IllegalArgumentException("Invalid quality")
        require(profiles.containsKey(quality))
        val orientation = json.opt("orientation") as? String
        require(orientation == "portrait" || orientation == "landscape")
        val microphone = json.opt("microphone") as? Boolean ?: throw IllegalArgumentException("Invalid microphone")
        val systemAudio = json.opt("systemAudio") as? Boolean ?: throw IllegalArgumentException("Invalid system audio")
        require(!systemAudio || mode == CaptureMode.SCREEN)
        val camera = json.opt("cameraPosition") as? String
        require(camera == "front" || camera == "back")
        return BroadcastSelection(mode, quality, orientation == "portrait", microphone, systemAudio, camera == "front")
    }
    fun profile(selection: BroadcastSelection) = profiles.getValue(selection.quality).oriented(selection.portrait)
    fun requireEncoder(json: JSONObject, selection: BroadcastSelection) {
        val p = profile(selection)
        val expected = mapOf("width" to p.width, "height" to p.height, "fps" to p.fps,
            "videoBitrateBps" to p.bitrate, "audioBitrateBps" to 64_000,
            "audioSampleRateHz" to 48_000, "keyframeIntervalSeconds" to 2,
            "videoCodec" to "h264", "audioCodec" to "aac")
        require(json.keys().asSequence().toSet() == expected.keys)
        expected.forEach { (key, value) -> require(json.opt(key) == value) }
    }
    fun selectionJson(selection: BroadcastSelection) = JSONObject()
        .put("mode", selection.mode.wire).put("quality", selection.quality)
        .put("orientation", if (selection.portrait) "portrait" else "landscape")
        .put("microphone", selection.microphone).put("systemAudio", selection.systemAudio)
        .put("cameraPosition", if (selection.frontCamera) "front" else "back")
}
