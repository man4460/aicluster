# ไฟล์ติดตั้งแอป MAWELL (Android)

| ไฟล์ | รายละเอียด |
|------|------------|
| `mawell-android.apk` | ติดตั้งเองจากเบราว์เซอร์ (ไม่ผ่าน Play) |

สร้างใหม่หลัง build:

```text
cd android
gradlew.bat assembleRelease
copy app\build\outputs\apk\release\app-release.apk ..\public\downloads\mawell-android.apk
```

หรือจากรากโปรเจกต์: `npm run android:publish-apk`
