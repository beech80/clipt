package com.clipt.broadcast

import android.Manifest
import android.app.*
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.content.pm.ServiceInfo
import android.media.MediaCodec
import android.media.projection.MediaProjection
import android.media.projection.MediaProjectionManager
import android.os.*
import android.view.SurfaceView
import androidx.core.app.NotificationCompat
import androidx.core.app.ServiceCompat
import androidx.core.content.ContextCompat
import com.pedro.common.AudioCodec
import com.pedro.common.ConnectChecker
import com.pedro.common.VideoCodec
import com.pedro.encoder.CodecErrorCallback
import com.pedro.encoder.input.sources.MediaProjectionHandler
import com.pedro.encoder.input.sources.audio.*
import com.pedro.encoder.input.sources.video.Camera2Source
import com.pedro.encoder.input.sources.video.ScreenSource
import com.pedro.encoder.input.video.CameraHelper
import com.pedro.encoder.input.video.CameraCallbacks
import com.pedro.encoder.utils.CodecUtil
import com.pedro.library.rtmp.RtmpStream
import java.lang.ref.WeakReference
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicInteger

class CliptBroadcastService : Service(), ConnectChecker {
    private val main = Handler(Looper.getMainLooper())
    private val network = Executors.newSingleThreadExecutor()
    private val generation = AtomicInteger()
    private val broker = NativeSessionBroker()
    private var stream: RtmpStream? = null
    private var projection: MediaProjection? = null
    private var session: NativeSession? = null
    private var selection: BroadcastSelection? = null
    private var ending = false
    private var heartbeatFailures = 0
    private var lastHeartbeatAt = 0L
    private val leaseGuard = object : Runnable {
        override fun run() {
            if (ending || session == null) return
            // Backend lease is90s. Leave15s margin for round-trip delays.
            if (SystemClock.elapsedRealtime() - lastHeartbeatAt >= 75_000) finishBroadcast(true)
            else main.postDelayed(this, 1_000)
        }
    }
    private var wakeLock: PowerManager.WakeLock? = null
    private var startedAt = 0L
    private var lastConnectedAt = 0L
    private val projectionCallback = object : MediaProjection.Callback() {
        override fun onStop() { main.post { finishBroadcast(false) } }
        override fun onCapturedContentResize(width: Int, height: Int) {
            main.post {
                // Keep the negotiated encoder shape stable. Android scales/letterboxes the
                // captured source; resize the same display, never consume the grant twice.
                val source = stream?.videoSource as? ScreenSource
                val p = selection?.let(BroadcastPolicy::profile)
                if (p != null && width > 0 && height > 0) source?.resize(p.width, p.height)
            }
        }
    }
    private val heartbeat = object : Runnable {
        override fun run() {
            val current = session ?: return
            val stamp = generation.get()
            network.execute {
                val result = runCatching { broker.heartbeat(current) }
                val success = result.isSuccess
                val revoked = (result.exceptionOrNull() as? NativeSessionException)?.terminal == true
                main.post {
                    if (generation.get() != stamp || ending) return@post
                    heartbeatFailures = if (success) 0 else heartbeatFailures + 1
                    if (success) lastHeartbeatAt = SystemClock.elapsedRealtime()
                    if (revoked || heartbeatFailures >= 3) finishBroadcast(true)
                    else main.postDelayed(this, 30_000)
                }
            }
        }
    }
    override fun onCreate() {
        super.onCreate()
        BroadcastRuntime.service = WeakReference(this)
        val channel = NotificationChannel(CHANNEL, "CLIPT broadcasts", NotificationManager.IMPORTANCE_LOW)
        channel.description = "Ongoing camera or screen sharing, with an immediate Stop action"
        getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
    }
    override fun onBind(intent: Intent?) = null
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == ACTION_STOP) { finishBroadcast(false); return START_NOT_STICKY }
        val request = intent?.getStringExtra(EXTRA_REQUEST)?.let(BroadcastRuntime::take)
        if (!BuildConfig.NATIVE_BROADCAST_ENABLED || BuildConfig.DEBUG || request == null || stream != null || selection != null) {
            request?.clear()
            if (selection == null) { BroadcastRuntime.state = "failed"; stopSelf() }
            return START_NOT_STICKY
        }
        selection = request.selection
        try {
            check(request.selection.quality in DeviceCapabilities.qualityIds())
            check(!request.selection.systemAudio || Build.VERSION.SDK_INT >= 29)
            var types = if (request.selection.mode == CaptureMode.SCREEN) ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION
                else ServiceInfo.FOREGROUND_SERVICE_TYPE_CAMERA
            if (request.selection.microphone) types = types or ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE
            ServiceCompat.startForeground(this, NOTIFICATION, notification("Connecting broadcast"), types)
            BroadcastRuntime.state = "connecting"
            if (request.selection.mode == CaptureMode.SCREEN) {
                check(request.projectionResultCode == Activity.RESULT_OK && request.projectionData != null)
                val manager = getSystemService(Context.MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
                projection = manager.getMediaProjection(request.projectionResultCode!!, request.projectionData!!)
                projection?.registerCallback(projectionCallback, main)
                request.projectionData = null
            }
            val stamp = generation.get()
            network.execute {
                val native = runCatching { broker.redeem(request.grant, request.selection) }.getOrNull()
                request.grant = ""
                main.post {
                    if (generation.get() != stamp || ending) {
                        if (native != null) closeRemote(native)
                    } else if (native == null) finishBroadcast(true)
                    else {
                        session = native
                        runCatching { beginCapture(native) }.onFailure { finishBroadcast(true) }
                    }
                }
            }
        } catch (_: Exception) {
            request.clear()
            finishBroadcast(true)
        }
        // Revoked screen consent and process restarts always need a fresh user start.
        return START_NOT_STICKY
    }
    private fun beginCapture(native: NativeSession) {
        val selected = native.selection
        val profile = BroadcastPolicy.profile(selected)
        val video = if (selected.mode == CaptureMode.SCREEN) ScreenSource(this, checkNotNull(projection), projectionCallback)
            else Camera2Source(this).also {
                if (selected.frontCamera) it.switchCamera()
                it.setCameraCallback(object : CameraCallbacks {
                    override fun onCameraChanged(facing: CameraHelper.Facing) {}
                    override fun onCameraOpened() {}
                    override fun onCameraDisconnected() { main.post { finishBroadcast(true) } }
                    override fun onCameraError(error: String) { main.post { finishBroadcast(true) } }
                })
            }
        val audio: AudioSource = when {
            selected.systemAudio && selected.microphone && Build.VERSION.SDK_INT >= 29 -> MixAudioSource(checkNotNull(projection))
            selected.systemAudio && Build.VERSION.SDK_INT >= 29 -> InternalAudioSource(checkNotNull(projection))
            selected.microphone -> MicrophoneSource()
            else -> NoAudioSource()
        }
        val engine = RtmpStream(this, this, video, audio)
        stream = engine
        engine.getStreamClient().setLogs(false)
        engine.getStreamClient().setReTries(5)
        engine.getStreamClient().setSocketTimeout(10_000)
        engine.getStreamClient().setTlsHostVerification(true)
        engine.getStreamClient().setCheckServerAlive(false)
        engine.getStreamClient().shouldSendPings(true)
        engine.getStreamClient().shouldFailOnRead(true)
        engine.setVideoCodec(VideoCodec.H264)
        engine.setAudioCodec(AudioCodec.AAC)
        engine.setEncoderErrorCallback(object : CodecErrorCallback {
            override fun onCodecError(type: CodecUtil.CodecTypeError, e: MediaCodec.CodecException) {
                main.post { finishBroadcast(true) }
            }
            override fun onEncodeError(type: CodecUtil.CodecTypeError, e: IllegalStateException): Boolean {
                main.post { finishBroadcast(true) }
                return false
            }
        })
        val cameraPortrait = selected.mode == CaptureMode.CAMERA && selected.portrait
        val sourceProfile = if (cameraPortrait) BroadcastPolicy.profiles.getValue(selected.quality) else profile
        check(engine.prepareVideo(sourceProfile.width, sourceProfile.height, profile.bitrate, profile.fps, 2, if (cameraPortrait) 90 else 0))
        check(engine.prepareAudio(48_000, false, 64_000, selected.microphone, selected.microphone))
        BroadcastRuntime.microphoneMuted = !selected.microphone
        BroadcastRuntime.systemAudioMuted = !selected.systemAudio
        startedAt = SystemClock.elapsedRealtime()
        lastConnectedAt = startedAt
        lastHeartbeatAt = startedAt
        main.postDelayed(leaseGuard, 1_000)
        val pm = getSystemService(Context.POWER_SERVICE) as PowerManager
        wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "CLIPT:Broadcast").also {
            it.setReferenceCounted(false)
            it.acquire((native.expiresAtMillis - System.currentTimeMillis()).coerceIn(1, 14_400_000))
        }
        main.postDelayed({ finishBroadcast(false) },
            (native.expiresAtMillis - System.currentTimeMillis()).coerceAtLeast(1))
        main.postDelayed(heartbeat, 30_000)
        engine.startStream(native.ingestUrl + "/" + native.streamKey)
    }
    internal fun attachPreview(view: SurfaceView) {
        if (selection?.mode != CaptureMode.CAMERA || ending) return
        val engine = stream ?: return
        if (!engine.isOnPreview) engine.startPreview(view, true)
    }
    internal fun detachPreview() { runCatching { stream?.stopPreview(true) } }
    internal fun mute(microphone: Boolean, systemAudio: Boolean) {
        val selected = selection ?: error("No broadcast")
        check(microphone || selected.microphone)
        check(systemAudio || selected.systemAudio)
        val source = stream?.audioSource ?: error("No broadcast")
        when (source) {
            is MixAudioSource -> {
                source.microphoneVolume = if (microphone) 0f else 1f
                source.internalVolume = if (systemAudio) 0f else 1f
            }
            is MicrophoneSource -> if (microphone) source.mute() else source.unMute()
            is InternalAudioSource -> if (systemAudio) source.mute() else source.unMute()
        }
        BroadcastRuntime.microphoneMuted = microphone
        BroadcastRuntime.systemAudioMuted = systemAudio
    }
    internal fun switchCamera() {
        check(selection?.mode == CaptureMode.CAMERA)
        (stream?.videoSource as? Camera2Source ?: error("No camera")).switchCamera()
    }
    internal fun isCamera() = selection?.mode == CaptureMode.CAMERA
    internal fun microphoneSelected() = selection?.microphone == true
    internal fun finishBroadcast(failed: Boolean) {
        if (ending) return
        ending = true
        generation.incrementAndGet()
        BroadcastRuntime.state = "stopping"
        main.removeCallbacksAndMessages(null)
        runCatching { stream?.release() }
        stream = null
        runCatching { projection?.unregisterCallback(projectionCallback) }
        runCatching { projection?.stop() }
        projection = null
        MediaProjectionHandler.mediaProjection = null
        session?.let(::closeRemote)
        session = null
        selection = null
        BroadcastRuntime.discardPending()
        runCatching { if (wakeLock?.isHeld == true) wakeLock?.release() }
        wakeLock = null
        BroadcastRuntime.state = if (failed) "failed" else "ended"
        ServiceCompat.stopForeground(this, ServiceCompat.STOP_FOREGROUND_REMOVE)
        stopSelf()
    }
    private fun closeRemote(current: NativeSession) {
        // A redeem response can arrive after service destruction. Cleanup owns a
        // separate executor so shutdown never drops the newly issued stop token.
        remoteCleanup.execute {
            try { broker.stop(current) } catch (_: Exception) {
                // Provider reconciliation and heartbeat expiry handle unreachable cleanup.
            } finally { current.clearSecrets() }
        }
    }
    override fun onDestroy() {
        finishBroadcast(BroadcastRuntime.state !in setOf("ended", "failed"))
        BroadcastRuntime.service.clear()
        network.shutdown()
        super.onDestroy()
    }
    override fun onConnectionStarted(url: String) {
        // Never log this URL: it contains the stream key.
        main.post { if (!ending) BroadcastRuntime.state = if (BroadcastRuntime.state == "reconnecting") "reconnecting" else "connecting" }
    }
    override fun onConnectionSuccess() {
        main.post {
            if (!ending) {
                BroadcastRuntime.state = "publishing"
                lastConnectedAt = SystemClock.elapsedRealtime()
                getSystemService(NotificationManager::class.java).notify(NOTIFICATION, notification("Broadcast connected"))
            }
        }
    }
    override fun onConnectionFailed(reason: String) {
        main.post {
            if (ending) return@post
            // Retry only the RTMPS socket. Capture and the original MediaProjection
            // stay alive; never create another virtual display from consumed consent.
            if (SystemClock.elapsedRealtime() - lastConnectedAt < 60_000 &&
                stream?.getStreamClient()?.reTry(3_000, "Connection interrupted", null) == true) {
                BroadcastRuntime.state = "reconnecting"
                getSystemService(NotificationManager::class.java).notify(NOTIFICATION, notification("Reconnecting broadcast"))
            } else finishBroadcast(true)
        }
    }
    override fun onDisconnect() {
        main.post {
            if (!ending && BroadcastRuntime.state != "reconnecting") onConnectionFailed("Connection interrupted")
        }
    }
    override fun onAuthError() { main.post { finishBroadcast(true) } }
    override fun onAuthSuccess() {}
    override fun onNewBitrate(bitrate: Long) {}
    private fun notification(message: String): Notification {
        val stop = PendingIntent.getService(this, 1,
            Intent(this, CliptBroadcastService::class.java).setAction(ACTION_STOP),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
        val open = PendingIntent.getActivity(this, 2,
            if (selection?.mode == CaptureMode.CAMERA) Intent(this, CameraBroadcastActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP)
            else packageManager.getLaunchIntentForPackage(packageName) ?: Intent(this, CameraBroadcastActivity::class.java),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
        return NotificationCompat.Builder(this, CHANNEL)
            .setSmallIcon(android.R.drawable.presence_video_online)
            .setContentTitle("CLIPT").setContentText(message).setContentIntent(open)
            .setOngoing(true).setCategory(NotificationCompat.CATEGORY_SERVICE)
            .addAction(android.R.drawable.ic_menu_close_clear_cancel, "End broadcast", stop)
            .build()
    }
    companion object {
        const val ACTION_STOP = "com.clipt.broadcast.STOP"
        const val EXTRA_REQUEST = "requestId"
        private const val CHANNEL = "clipt-native-broadcast"
        private const val NOTIFICATION = 6711
        private val remoteCleanup = Executors.newSingleThreadExecutor()
    }
}
