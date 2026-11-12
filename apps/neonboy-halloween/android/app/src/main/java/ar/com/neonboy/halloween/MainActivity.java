package ar.com.neonboy.halloween;

import android.os.Bundle;
import android.view.Window;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private boolean fullscreenEnabled = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(NeonboyFullscreenPlugin.class);
        super.onCreate(savedInstanceState);
        if (savedInstanceState != null) fullscreenEnabled = savedInstanceState.getBoolean("neonboy.fullscreen", false);
        if (fullscreenEnabled) applyFullscreen();
    }

    @Override
    public void onSaveInstanceState(Bundle outState) {
        outState.putBoolean("neonboy.fullscreen", fullscreenEnabled);
        super.onSaveInstanceState(outState);
    }

    @Override
    public void onResume() {
        super.onResume();
        if (fullscreenEnabled) applyFullscreen();
    }

    public boolean isFullscreenEnabled() { return fullscreenEnabled; }

    public void setFullscreenEnabled(boolean enabled) {
        fullscreenEnabled = enabled;
        applyFullscreen();
    }

    private void applyFullscreen() {
        Window window = getWindow();
        WindowCompat.setDecorFitsSystemWindows(window, !fullscreenEnabled);
        WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(window, window.getDecorView());
        if (fullscreenEnabled) {
            controller.hide(WindowInsetsCompat.Type.systemBars());
            controller.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
        } else {
            controller.show(WindowInsetsCompat.Type.navigationBars());
        }
    }
}