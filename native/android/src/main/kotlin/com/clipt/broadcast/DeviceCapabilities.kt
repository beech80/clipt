package com.clipt.broadcast

import android.content.Context
import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.CameraManager
import android.media.MediaCodecList
import android.media.MediaFormat
import android.os.Build
import org.json.JSONArray
import org.json.JSONObject

internal object DeviceCapabilities {
    fun qualityIds(): List<String> {
        val encoders = MediaCodecList(MediaCodecList.REGULAR_CODECS).codecInfos.filter { info ->
            info.isEncoder && info.supportedTypes.any { it.equals(MediaFormat.MIMETYPE_VIDEO_AVC, true) }
        }
        return BroadcastPolicy.profiles.filter { (_, p) ->
            encoders.any { info ->
                runCatching {
                    val caps = info.getCapabilitiesForType(MediaFormat.MIMETYPE_VIDEO_AVC).videoCapabilities
                    caps.areSizeAndRateSupported(p.width, p.height, p.fps.toDouble()) &&
                        caps.areSizeAndRateSupported(p.height, p.width, p.fps.toDouble()) &&
                        caps.bitrateRange.contains(p.bitrate)
                }.getOrDefault(false)
            }
        }.keys.toList()
    }
    fun read(context: Context): JSONObject {
        check(BuildConfig.NATIVE_BROADCAST_ENABLED && !BuildConfig.DEBUG) { "Native broadcasting unavailable in this build" }
        val quality = qualityIds()
        check(quality.isNotEmpty())
        val manager = context.getSystemService(Context.CAMERA_SERVICE) as CameraManager
        val facing = manager.cameraIdList.mapNotNull { id ->
            runCatching { manager.getCameraCharacteristics(id).get(CameraCharacteristics.LENS_FACING) }.getOrNull()
        }
        val modes = mutableListOf("screen")
        if (facing.isNotEmpty()) modes.add(0, "camera")
        return JSONObject().put("protocolVersion", 1).put("platform", "android")
            .put("modes", JSONArray(modes)).put("qualityIds", JSONArray(quality))
            .put("microphone", context.packageManager.hasSystemFeature("android.hardware.microphone"))
            .put("cameraSwitch", facing.contains(CameraCharacteristics.LENS_FACING_BACK) &&
                facing.contains(CameraCharacteristics.LENS_FACING_FRONT))
            .put("backgroundScreen", true)
            .put("systemAudio", if (Build.VERSION.SDK_INT >= 29) "permission-dependent" else "unsupported")
    }
}
