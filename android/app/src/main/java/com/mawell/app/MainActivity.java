package com.mawell.app;

import android.os.Bundle;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    // เว้นพื้นที่แถบสถานะ (เวลา / ไวไฟ / แบต) — เนื้อหาไม่ทับไอคอนระบบ
    WindowCompat.setDecorFitsSystemWindows(getWindow(), true);
  }
}
