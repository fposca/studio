package ar.com.neonboy.halloween;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "NeonboyFullscreen")
public class NeonboyFullscreenPlugin extends Plugin {
    @PluginMethod
    public void getState(PluginCall call) {
        boolean enabled = getActivity() instanceof MainActivity && ((MainActivity) getActivity()).isFullscreenEnabled();
        JSObject result = new JSObject();
        result.put("enabled", enabled);
        call.resolve(result);
    }

    @PluginMethod
    public void setEnabled(PluginCall call) {
        Boolean enabled = call.getBoolean("enabled");
        if (enabled == null || !(getActivity() instanceof MainActivity)) {
            call.reject("Estado de pantalla completa no disponible");
            return;
        }
        getActivity().runOnUiThread(() -> {
            MainActivity activity = (MainActivity) getActivity();
            activity.setFullscreenEnabled(enabled);
            JSObject result = new JSObject();
            result.put("enabled", activity.isFullscreenEnabled());
            call.resolve(result);
        });
    }
}
