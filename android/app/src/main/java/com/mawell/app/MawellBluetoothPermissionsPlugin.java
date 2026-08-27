package com.mawell.app;

import android.Manifest;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
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

    @PluginMethod
    public void check(PluginCall call) {
        call.resolve(buildStatus());
    }

    @PluginMethod
    public void request(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            if (PermissionHelper.hasPermissions(
                getContext(),
                new String[] {
                    Manifest.permission.BLUETOOTH_SCAN,
                    Manifest.permission.BLUETOOTH_CONNECT
                }
            )) {
                call.resolve(buildStatus());
                return;
            }
            requestPermissionForAliases(
                new String[] { "bluetoothScan", "bluetoothConnect" },
                call,
                "onPerms"
            );
            return;
        }

        if (PermissionHelper.hasPermissions(
            getContext(),
            new String[] { Manifest.permission.ACCESS_FINE_LOCATION }
        )) {
            call.resolve(buildStatus());
            return;
        }
        requestPermissionForAliases(new String[] { "location" }, call, "onPerms");
    }

    @PermissionCallback
    private void onPerms(PluginCall call) {
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

    private JSObject buildStatus() {
        JSObject o = new JSObject();
        o.put("sdk", Build.VERSION.SDK_INT);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            o.put("bluetoothScan", permissionStateName("bluetoothScan"));
            o.put("bluetoothConnect", permissionStateName("bluetoothConnect"));
            o.put("location", "granted");
        } else {
            o.put("bluetoothScan", "granted");
            o.put("bluetoothConnect", "granted");
            o.put("location", permissionStateName("location"));
        }
        boolean ok =
            "granted".equalsIgnoreCase(o.getString("bluetoothScan")) &&
            "granted".equalsIgnoreCase(o.getString("bluetoothConnect")) &&
            "granted".equalsIgnoreCase(o.getString("location"));
        o.put("ok", ok);
        return o;
    }

    private String permissionStateName(String alias) {
        try {
            return getPermissionState(alias).name().toLowerCase();
        } catch (Exception e) {
            return "prompt";
        }
    }
}
