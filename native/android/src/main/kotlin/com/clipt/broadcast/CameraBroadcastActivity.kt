package com.clipt.broadcast

import android.content.Intent
import android.graphics.Color
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.Gravity
import android.view.SurfaceView
import android.view.ViewGroup
import android.view.WindowManager
import android.widget.*
import androidx.appcompat.app.AppCompatActivity
import androidx.activity.OnBackPressedCallback
import androidx.core.content.ContextCompat
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat

class CameraBroadcastActivity : AppCompatActivity() {
    private val main = Handler(Looper.getMainLooper())
    private lateinit var preview: SurfaceView
    private lateinit var status: TextView
    private lateinit var mute: Button
    private var closing = false
    private val refresh = object : Runnable {
        override fun run() {
            val service = BroadcastRuntime.service.get()
            val state = BroadcastRuntime.state
            status.text = when (state) {
                "publishing" -> "Broadcast connected"
                "reconnecting" -> "Reconnecting…"
                "failed" -> "Broadcast ended after an interruption"
                "ended" -> "Broadcast ended"
                else -> "Connecting…"
            }
            // Connected means native transport; only provider verification grants LIVE.
            if (state in setOf("ended", "failed")) {
                closing = true
                finish()
                return
            }
            if (service?.isCamera() == true) {
                runCatching { service.attachPreview(preview) }
                mute.isEnabled = service.microphoneSelected()
                mute.text = if (BroadcastRuntime.microphoneMuted) "Unmute mic" else "Mute mic"
            }
            main.postDelayed(this, 500)
        }
    }
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON or WindowManager.LayoutParams.FLAG_SECURE)
        val root = FrameLayout(this).apply { setBackgroundColor(Color.BLACK) }
        preview = SurfaceView(this).apply { contentDescription = "Camera broadcast preview" }
        root.addView(preview, FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT))
        val controls = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(0xCC100A20.toInt())
            setPadding(16, 12, 16, 12)
        }
        status = TextView(this).apply {
            text = "Connecting…"; setTextColor(Color.WHITE); textSize = 16f
            accessibilityLiveRegion = android.view.View.ACCESSIBILITY_LIVE_REGION_POLITE
        }
        controls.addView(status)
        val buttons = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL; gravity = Gravity.CENTER }
        mute = Button(this).apply {
            text = "Mute mic"; minHeight = dp(48)
            setOnClickListener {
                runCatching { BroadcastRuntime.service.get()?.mute(!BroadcastRuntime.microphoneMuted, true) }
            }
        }
        val flip = Button(this).apply {
            text = "Switch camera"; minHeight = dp(48)
            isEnabled = runCatching { DeviceCapabilities.read(this@CameraBroadcastActivity).getBoolean("cameraSwitch") }.getOrDefault(false)
            if (!isEnabled) visibility = android.view.View.GONE
            setOnClickListener { runCatching { BroadcastRuntime.service.get()?.switchCamera() }.onFailure { Toast.makeText(this@CameraBroadcastActivity, "Camera could not be changed", Toast.LENGTH_SHORT).show() } }
        }
        val end = Button(this).apply {
            text = "End"; minHeight = dp(48)
            contentDescription = "End camera broadcast"
            setOnClickListener { endBroadcast() }
        }
        for (button in listOf(mute, flip, end)) buttons.addView(button, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
        controls.addView(buttons)
        root.addView(controls, FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT, Gravity.BOTTOM))
        ViewCompat.setOnApplyWindowInsetsListener(root) { view, insets ->
            val bars = insets.getInsets(WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout())
            view.setPadding(bars.left, bars.top, bars.right, bars.bottom)
            insets
        }
        setContentView(root)
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() { endBroadcast() }
        })
        val id = intent.getStringExtra(CliptBroadcastService.EXTRA_REQUEST)
        if (id != null && savedInstanceState == null) {
            try {
                ContextCompat.startForegroundService(this,
                    Intent(this, CliptBroadcastService::class.java).putExtra(CliptBroadcastService.EXTRA_REQUEST, id))
            } catch (_: Exception) {
                BroadcastRuntime.discardPending()
                BroadcastRuntime.state = "failed"
                closing = true
                finish()
            }
        } else if (BroadcastRuntime.service.get() == null) {
            closing = true
            finish()
        }
    }
    override fun onResume() {
        super.onResume()
        main.post(refresh)
    }
    override fun onPause() {
        main.removeCallbacks(refresh)
        super.onPause()
    }
    override fun onStop() {
        // Camera capture is foreground-only. Do not continue a hidden camera when
        // the user leaves this screen; Screen Live has a separate service path.
        BroadcastRuntime.service.get()?.detachPreview()
        if (!isChangingConfigurations && !closing) endBroadcast()
        super.onStop()
    }
    private fun endBroadcast() {
        closing = true
        BroadcastRuntime.service.get()?.finishBroadcast(false)
        BroadcastRuntime.discardPending()
        finish()
    }
    private fun dp(value: Int) = (value * resources.displayMetrics.density).toInt()
}
