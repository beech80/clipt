import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { androidStoreGradle } from './android-release-policy.mjs';
import { APP_ID } from './ios-release-policy.mjs';

export async function prepareAndroidStore(host, version) {
  async function change(path, edit) {
    const file = resolve(host, path);
    await writeFile(file, edit(await readFile(file, 'utf8')));
  }
  await change('settings.gradle', text => {
    if (text.includes('clipt-broadcaster')) throw Error('Do not convert a broadcaster host into a store host.');
    return text;
  });
  await change('variables.gradle', text => text.replace(/minSdkVersion\s*=\s*\d+/, 'minSdkVersion = 26')
    .replace(/compileSdkVersion\s*=\s*\d+/, 'compileSdkVersion = 36').replace(/targetSdkVersion\s*=\s*\d+/, 'targetSdkVersion = 36'));
  await change('app/build.gradle', text => androidStoreGradle(text, version));
  await change('app/src/main/AndroidManifest.xml', text => {
    text = text.replace('android:allowBackup="true"', 'android:allowBackup="false"');
    if (!text.includes('android:usesCleartextTraffic=')) text = text.replace('<application', '<application android:usesCleartextTraffic="false"');
    if (!text.includes('android:scheme="' + APP_ID + '"')) text = text.replace('</activity>', `
      <intent-filter>
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data android:scheme="${APP_ID}" android:host="auth" />
      </intent-filter>
    </activity>`);
    for (const name of ['CAMERA', 'RECORD_AUDIO']) {
      if (!text.includes('android.permission.' + name)) text = text.replace('</manifest>', `<uses-permission android:name="android.permission.${name}" /></manifest>`);
    }
    for (const name of ['android.hardware.camera.any', 'android.hardware.microphone'])
      if (!text.includes('android:name="' + name + '"')) text = text.replace('</manifest>', `<uses-feature android:name="${name}" android:required="false" /></manifest>`);
    return text;
  });
  const directory = APP_ID.replaceAll('.', '/');
  const main = resolve(host, 'app/src/main/java', directory);
  await mkdir(main, { recursive: true });
  await writeFile(resolve(main, 'MainActivity.java'), `package ${APP_ID};
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
public class MainActivity extends BridgeActivity {
  @Override public void onCreate(Bundle state) {
    super.onCreate(state);
    if (getBridge() != null) {
      getBridge().getWebView().setOverScrollMode(android.view.View.OVER_SCROLL_NEVER);
      CliptSmoke.record(this, getBridge().getWebView(), 30);
    }
  }
}
`);
  const debug = resolve(host, 'app/src/debug/java', directory);
  const release = resolve(host, 'app/src/release/java', directory);
  await mkdir(debug, { recursive: true });
  await mkdir(release, { recursive: true });
  // Release has an empty implementation, not a runtime-controlled debug probe.
  await writeFile(resolve(release, 'CliptSmoke.java'), `package ${APP_ID};
final class CliptSmoke { static void record(android.app.Activity activity, android.webkit.WebView view, int attempts) {} }
`);
  const script = "JSON.stringify({bridgeReady: document.documentElement.dataset.cliptNativeReady === 'true', welcomeVisible: !!document.querySelector('.clipt-launch')?.getClientRects().length})";
  await writeFile(resolve(debug, 'CliptSmoke.java'), `package ${APP_ID};
import android.app.Activity;
import android.webkit.WebView;
import android.os.Handler;
import android.os.Looper;
import java.io.File;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;
import org.json.JSONObject;
import org.json.JSONTokener;
final class CliptSmoke {
  static void record(Activity activity, WebView view, int attempts) {
    new Handler(Looper.getMainLooper()).postDelayed(() -> view.evaluateJavascript(${JSON.stringify(script)}, value -> {
      try {
        Object decoded = new JSONTokener(value).nextValue();
        JSONObject state = new JSONObject(decoded instanceof String ? (String) decoded : "{}");
        if ((!state.optBoolean("bridgeReady") || !state.optBoolean("welcomeVisible")) && attempts > 0) {
          record(activity, view, attempts - 1); return;
        }
        state.put("build", String.valueOf(activity.getPackageManager().getPackageInfo(activity.getPackageName(), 0).versionCode));
        try (FileOutputStream output = new FileOutputStream(new File(activity.getCacheDir(), "CLIPT-native-smoke.json"))) {
          output.write(state.toString().getBytes(StandardCharsets.UTF_8));
        }
      } catch (Exception error) { if (attempts > 0) record(activity, view, attempts - 1); }
    }), 2000);
  }
}
`);
}
