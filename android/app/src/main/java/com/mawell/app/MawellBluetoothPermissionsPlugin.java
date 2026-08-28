package com.mawell.app;

import android.Manifest;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import androidx.core.app.ActivityCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import com.getcapacitor.util.PermissionHelper;

/**
 * ขอสิทธิ์ Bluetooth / ตำแหน่ง ให้โชว์ไดอะล็อกระบบจริง
 * (ปลั๊กอิน thermal บน Android &lt; 12 ไม่ขอ runtime permission)
 */
@CapacitorPlugin(
    name = "MawellBluetoothPermissions",
    permissions = {
        @Permission(
            alias = "bluetoothScan",
            strings = { Manifest.permission.BLUETOOTH_SCAN }
        ),
        @Permission(
            alias = "bluetoothConnect",
            strings = { Manifest.permission.BLUETOOTH_CONNECT }
        ),
        @Permission(
            alias = "location",
            strings = { Manifest.permission.ACCESS_FINE_LOCATION }
        )
    }
)
public class MawellBluetoothPermissionsPlugin extends Plugin {

    private static final int LEGACY_REQUEST_CODE = 9911;

    @PluginMethod
    public void check(PluginCall call) {
        call.resolve(buildStatus());
    }

    @PluginMethod
    public void request(PluginCall call) {
        String[] needed = neededPermissions();
        if (PermissionHelper.hasPermissions(getContext(), needed)) {
            call.resolve(buildStatus());
            return;
        }
        requestPermissionForAliases(neededAliases(), call, "onPerms");
    }

    /**
     * ทางสำรองเมื่อ ActivityResult launcher ไม่ส่งผลกลับ (ไดอะล็อกไม่ขึ้น)
     * ยิงคำขอตรงกับ Activity แล้ว resolve ทันที — ฝั่ง JS เป็นคนวนเช็คสถานะเอง
     */
    @PluginMethod
    public void requestLegacy(PluginCall call) {
        String[] needed = neededPermissions();
        if (!PermissionHelper.hasPermissions(getContext(), needed)) {
            ActivityCompat.requestPermissions(getBridge().getActivity(), needed, LEGACY_REQUEST_CODE);
        }
        JSObject o = buildStatus();
        o.put("launched", true);
        call.resolve(o);
    }

    @PermissionCallback
    private void onPerms(PluginCall call) {
        if (call == null) {
            return;
        }
        call.resolve(buildStatus());
    }

    @PluginMethod
    public void openAppSettings(PluginCall call) {
        Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
        intent.setData(Uri.parse("package:" + getContext().getPackageName()));
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getBridge().getActivity().startActivity(intent);
        call.resolve();
    }

    private boolean isAndroid12OrNewer() {
        return Build.VERSION.SDK_INT >= Build.VERSION_CODES.S;
    }

    private String[] neededPermissions() {
        if (isAndroid12OrNewer()) {
            return new String[] { Manifest.permission.BLUETOOTH_SCAN, Manifest.permission.BLUETOOTH_CONNECT };
        }
        return new String[] { Manifest.permission.ACCESS_FINE_LOCATION };
    }

    private String[] neededAliases() {
        if (isAndroid12OrNewer()) {
            return new String[] { "bluetoothScan", "bluetoothConnect" };
        }
        return new String[] { "location" };
    }

    private JSObject buildStatus() {
        JSObject o = new JSObject();
        o.put("sdk", Build.VERSION.SDK_INT);
        if (isAndroid12OrNewer()) {
            o.put("bluetoothScan", grantedName(Manifest.permission.BLUETOOTH_SCAN));
            o.put("bluetoothConnect", grantedName(Manifest.permission.BLUETOOTH_CONNECT));
            o.put("location", "granted");
        } else {
            o.put("bluetoothScan", "granted");
            o.put("bluetoothConnect", "granted");
            o.put("location", grantedName(Manifest.permission.ACCESS_FINE_LOCATION));
        }
        o.put("ok", PermissionHelper.hasPermissions(getContext(), neededPermissions()));
        return o;
    }

    private String grantedName(String permission) {
        return PermissionHelper.hasPermissions(getContext(), new String[] { permission }) ? "granted" : "denied";
    }
}
