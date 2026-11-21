# Local Android Build (no Expo account, no EAS)

NxMirror builds completely locally with the standard Expo toolchain. An Expo
account is **never** required and `eas build` is **not** used anywhere.

## Prerequisites

| Tool | Version | Notes |
| --- | --- | --- |
| Node.js | ≥ 18 (20 LTS recommended) | |
| npm | ≥ 9 | ships with Node |
| Java JDK | **17** (Temurin recommended) | `java -version` must show 17.x |
| Android SDK | API 35 + Build-Tools 35 + Platform-Tools | via Android Studio **or** command-line tools |
| Android SDK env | `ANDROID_HOME`/`ANDROID_SDK_ROOT` set, `platform-tools` on PATH | |
| Gradle | not needed manually — the wrapper (`gradle-8.13`) downloads itself | |

## 1. Install dependencies

```bash
npm install        # or: npm ci  (reproducible, uses package-lock.json)
```

## 2. Validate

```bash
npx tsc --noEmit      # TypeScript
npx expo-doctor       # environment + dependency sanity
npx expo config --type public   # config validation
```

## 3. Generate the native Android project (Expo Prebuild)

```bash
npx expo prebuild --platform android --no-install
```

This creates `android/` from `app.json` + config plugins. It is **not**
committed to git; regenerate it any time.

## 4. Debug build

```bash
cd android
./gradlew assembleDebug
# → android/app/build/outputs/apk/debug/app-debug.apk
```

Install on a connected device/emulator:

```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

Or simply: `npm run android` (Metro + native build in one step).

## 5. Release build

```bash
cd android
./gradlew --no-daemon assembleRelease
# → android/app/build/outputs/apk/release/app-release.apk
```

### Signing

Without a release keystore, Expo Prebuild configures the **debug keystore** for
the release build type (clearly marked in `android/app/build.gradle`). Such an
APK installs on any device but is not production-signed — never ship it to the
Play Store.

To sign locally with your own key (never commit the keystore or passwords):

```bash
# 1. Generate a keystore once
keytool -genkeypair -v -storetype PKCS12 \
  -keystore nxmirror-release.keystore -alias nxmirror \
  -keyalg RSA -keysize 2048 -validity 10000

# 2. Point Gradle at it (android/gradle.properties — git-ignored)
cat > android/gradle.properties.local <<'EOF'
NX_UPLOAD_STORE_FILE=/absolute/path/nxmirror-release.keystore
NX_UPLOAD_STORE_PASSWORD=********
NX_UPLOAD_KEY_ALIAS=nxmirror
NX_UPLOAD_KEY_PASSWORD=********
EOF
```

And add to `android/app/build.gradle` inside `android { signingConfigs { … } }`:

```gradle
signingConfigs {
    release {
        if (project.hasProperty('NX_UPLOAD_STORE_FILE')) {
            storeFile file(NX_UPLOAD_STORE_FILE)
            storePassword NX_UPLOAD_STORE_PASSWORD
            keyAlias NX_UPLOAD_KEY_ALIAS
            keyPassword NX_UPLOAD_KEY_PASSWORD
        }
    }
}
```

then switch the release build type to `signingConfig signingConfigs.release`.

## 6. Clean everything

```bash
rm -rf android ios .expo
npx expo prebuild --platform android --no-install
```

## Troubleshooting

- **`SDK location not found`** → create `android/local.properties` with
  `sdk.dir=/path/to/android-sdk`, or export `ANDROID_HOME`.
- **License not accepted** → `yes | sdkmanager --licenses`.
- **Wrong Java version** → Gradle 8.13 / AGP needs JDK 17 (`/usr/libexec/java_home -v 17`).
- **Metro port busy** → `npx expo start --clear`.
- **Version drift after editing app.json** → re-run `expo prebuild --clean`.
