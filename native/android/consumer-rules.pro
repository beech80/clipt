# Capacitor discovers annotated methods at runtime.
-keep @com.getcapacitor.annotation.CapacitorPlugin class com.clipt.broadcast.** { *; }
-keepclassmembers class com.clipt.broadcast.** {
    @com.getcapacitor.PluginMethod <methods>;
    @com.getcapacitor.annotation.PermissionCallback <methods>;
    @com.getcapacitor.annotation.ActivityCallback <methods>;
}

# Upstream RTMP command debug messages contain the publish stream name.
# Native publishing is allowed only from a minified nondebug host build.
-assumenosideeffects class android.util.Log {
    public static *** *(...);
}
