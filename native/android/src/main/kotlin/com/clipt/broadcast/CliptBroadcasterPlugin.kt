package com.clipt.broadcast

import android.Manifest
import android.app.Activity
import android.content.Context
import android.content.Intent
import android.media.projection.MediaProjectionManager
import android.os.Build
import androidx.activity.result.ActivityResult
import androidx.core.content.ContextCompat
import com.getcapacitor.*
import com.getcapacitor.annotation.ActivityCallback
import com.getcapacitor.annotation.CapacitorPlugin
import com.getcapacitor.annotation.Permission
import com.getcapacitor.annotation.PermissionCallback

@CapacitorPlugin(name = "CliptBroadcaster", permissions = [
    Permission(alias = "camera", strings = [Manifest.permission.CAMERA]),
    Permission(alias = "microphone", strings = [Manifest.permission.RECORD_AUDIO]),
    Permission(alias = "notifications", strings = [Manifest.permission.POST_NOTIFICATIONS])
])
class CliptBroadcasterPlugin : Plugin() {
    private var pending: PendingBroadcast? = null
    private var pendingCall: PluginCall? = null

    @PluginMethod fun getCapabilities(call: PluginCall) {
        try { call.resolve(JSObject.fromJSONObject(DeviceCapabilities.read(context))) }
        catch (_: Exception) { call.reject("Native broadcasting unavailable in this build", "UNAVAILABLE") }
    }
    @PluginMethod fun getStatus(call: PluginCall) {
        call.resolve(JSObject().put("state", BroadcastRuntime.state))
    }
    @PluginMethod fun start(call: PluginCall) {
        val grant = call.getString("grant")
        // Never let Capacitor persist an opaque redemption grant in a permission or
        // activity restoration bundle. Only a native-memory object retains it.
        call.data.remove("grant")
        try {
            check(BuildConfig.NATIVE_BROADCAST_ENABLED && !BuildConfig.DEBUG)
            require(grant != null && BroadcastPolicy.grantPattern.matches(grant))
            require(call.data.keys().asSequence().toSet() == setOf("selection", "encoder"))
            val selected = BroadcastPolicy.selection(call.getObject("selection") ?: error("Selection required"))
            BroadcastPolicy.requireEncoder(call.getObject("encoder") ?: error("Encoder required"), selected)
            val caps = DeviceCapabilities.read(context)
            check(selected.quality in DeviceCapabilities.qualityIds())
            check(!selected.systemAudio || Build.VERSION.SDK_INT >= 29)
            check(!selected.microphone || caps.getBoolean("microphone"))
            check(selected.mode != CaptureMode.CAMERA || caps.getJSONArray("modes").toString().contains("camera"))
            check(BroadcastRuntime.reserve())
            pending = PendingBroadcast(grant, selected)
            pendingCall = call
            activity.runOnUiThread {
                val aliases = requiredPermissions(selected).filter { getPermissionState(it) != PermissionState.GRANTED }
                if (aliases.isNotEmpty()) requestPermissionForAliases(aliases.toTypedArray(), call, "capturePermissions")
                else continueStart(call)
            }
        } catch (_: Exception) {
            call.reject("Native broadcast could not start", "START_UNAVAILABLE")
        }
    }
    private fun requiredPermissions(selected: BroadcastSelection): List<String> {
        val permissions = mutableListOf<String>()
        if (selected.mode == CaptureMode.CAMERA) permissions.add("camera")
        // AudioPlaybackCapture needs RECORD_AUDIO even when microphone capture is off.
        if (selected.microphone || selected.systemAudio) permissions.add("microphone")
        if (Build.VERSION.SDK_INT >= 33) permissions.add("notifications")
        return permissions
    }
    @PermissionCallback private fun capturePermissions(call: PluginCall) {
        val request = pending
        if (request == null || pendingCall !== call ||
            requiredPermissions(request.selection).any { getPermissionState(it) != PermissionState.GRANTED }) {
            failPending("Camera, audio or notification permission was not granted", "PERMISSION_DENIED")
            return
        }
        continueStart(call)
    }
    private fun continueStart(call: PluginCall) {
        val request = pending
        if (request == null || pendingCall !== call) { call.reject("Broadcast start was cancelled", "CANCELLED"); return }
        try {
            if (request.selection.mode == CaptureMode.SCREEN) {
                val manager = context.getSystemService(Context.MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
                startActivityForResult(call, manager.createScreenCaptureIntent(), "screenConsent")
            } else dispatch(call, request)
        } catch (_: Exception) { failPending("Native broadcast could not start", "START_UNAVAILABLE") }
    }
    @ActivityCallback private fun screenConsent(call: PluginCall?, result: ActivityResult) {
        if (call == null || pendingCall !== call) { failPending("Broadcast start was cancelled", "CANCELLED"); return }
        val original = pending
        if (original == null || result.resultCode != Activity.RESULT_OK || result.data == null) {
            failPending("Screen sharing was not authorized", "PERMISSION_DENIED")
            return
        }
        val request = PendingBroadcast(original.grant, original.selection, result.resultCode, result.data)
        original.clear()
        pending = request
        dispatch(call, request)
    }
    private fun dispatch(call: PluginCall, request: PendingBroadcast) {
        try {
            val id = BroadcastRuntime.queue(request)
            pending = null
            pendingCall = null
            if (request.selection.mode == CaptureMode.CAMERA) {
                activity.startActivity(Intent(activity, CameraBroadcastActivity::class.java)
                    .putExtra(CliptBroadcastService.EXTRA_REQUEST, id))
            } else {
                ContextCompat.startForegroundService(context, Intent(context, CliptBroadcastService::class.java)
                    .putExtra(CliptBroadcastService.EXTRA_REQUEST, id))
            }
            call.resolve()
            bridge.releaseCall(call)
        } catch (_: Exception) {
            BroadcastRuntime.discardPending()
            BroadcastRuntime.state = "failed"
            call.reject("Native broadcast could not start", "START_UNAVAILABLE")
        }
    }
    @PluginMethod fun stop(call: PluginCall) {
        activity.runOnUiThread {
            failPending("Broadcast start was cancelled", "CANCELLED", ended = true)
            val service = BroadcastRuntime.service.get()
            if (service != null) service.finishBroadcast(false)
            else { BroadcastRuntime.discardPending(); BroadcastRuntime.state = "ended" }
            call.resolve()
        }
    }
    @PluginMethod fun setMuted(call: PluginCall) {
        val microphone = call.getBoolean("microphone")
        val systemAudio = call.getBoolean("systemAudio")
        if (microphone == null || systemAudio == null) { call.reject("Invalid mute state", "INVALID_OPTIONS"); return }
        activity.runOnUiThread {
            try {
                val service = BroadcastRuntime.service.get() ?: error("No broadcast")
                service.mute(microphone, systemAudio)
                call.resolve()
            } catch (_: Exception) { call.reject("Audio could not be changed", "AUDIO_UNAVAILABLE") }
        }
    }
    @PluginMethod fun switchCamera(call: PluginCall) {
        activity.runOnUiThread {
            try {
                (BroadcastRuntime.service.get() ?: error("No broadcast")).switchCamera()
                call.resolve()
            } catch (_: Exception) { call.reject("Camera could not be changed", "CAMERA_UNAVAILABLE") }
        }
    }
    private fun failPending(message: String, code: String, ended: Boolean = false) {
        pending?.clear()
        pending = null
        pendingCall?.let { it.reject(message, code); bridge.releaseCall(it) }
        pendingCall = null
        if (BroadcastRuntime.service.get() == null) BroadcastRuntime.state = if (ended) "ended" else "failed"
    }
    override fun handleOnDestroy() {
        // Screen publishing is service-owned and must survive WebView destruction.
        // A not-yet-authorized start cannot survive and must be cleared.
        if (pending != null) failPending("Broadcast start was cancelled", "CANCELLED")
        super.handleOnDestroy()
    }
}
