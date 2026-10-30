package com.clipt.broadcast

import android.content.Intent
import java.lang.ref.WeakReference
import java.util.UUID

internal class PendingBroadcast(
    var grant: String, val selection: BroadcastSelection,
    val projectionResultCode: Int? = null, var projectionData: Intent? = null
) {
    fun clear() { grant = ""; projectionData = null }
}
internal object BroadcastRuntime {
    @Volatile var state = "idle"
    @Volatile var microphoneMuted = false
    @Volatile var systemAudioMuted = false
    @Volatile var service = WeakReference<CliptBroadcastService>(null)
    private var pending: Pair<String, PendingBroadcast>? = null
    private val active = setOf("requesting-permission", "connecting", "publishing", "reconnecting", "stopping")
    @Synchronized fun reserve(): Boolean {
        if (state in active || pending != null) return false
        state = "requesting-permission"
        return true
    }
    @Synchronized fun queue(value: PendingBroadcast): String {
        check(pending == null)
        val id = UUID.randomUUID().toString()
        pending = id to value
        return id
    }
    @Synchronized fun take(id: String): PendingBroadcast? {
        val value = pending ?: return null
        if (value.first != id) return null
        pending = null
        return value.second
    }
    @Synchronized fun discardPending() {
        pending?.second?.clear()
        pending = null
    }
}
