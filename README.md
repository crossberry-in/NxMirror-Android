# NxMirror Android

Native **Android** app for the [NxMirror](https://nxmirror.netlify.app/) platform —
an npm-like package registry, personal cloud file manager, Git cloud and NxDB
databases — built with **React Native + Expo + TypeScript**.

- **Backend**: [crossberry-in/Demoapi](https://github.com/crossberry-in/Demoapi)
  (deployed at https://nxmirror.netlify.app) — used through its real HTTP API.
- **App source**: this repository (independent; the backend repo is never
  modified or bundled into the app).
- **Web app**: https://nxmirror.netlify.app/

## Features

### Home
Live dashboard with API connection status (real probe), registry stats, latest
packages, recent cloud files, Git repositories, quick upload, global search and
account status — every async section uses skeleton loading and pull-to-refresh.

### Registry (public, no login required)
Browse and search the NxMirror package registry: keyword + kind filters
(packages/plugins), popular / newest / A→Z sorting, tag chips, package details
with versions, download counts, license, sha256, readme, one-tap **copy install
command** and **artifact download**. Signed-in users can **publish** artifacts
(≤4 MiB, immutable versions, public/private visibility).

### Cloud Files
Full personal file manager: folder navigation with breadcrumbs, chunked uploads
(any size — 4 MiB chunks), direct uploads (≤4 MiB), rename, delete, filter,
download via the public NxMirror URL and Android share sheet, upload progress.

### Git Cloud
Repository list (own + public), repo details with branches, tags, issues,
releases and commit history, file browsing with text preview, save/delete files
(creates real commits), star, fork, clone command copy, ZIP export, owner
settings.

### Account & security
Login / register / logout against the real backend, avatar + profile editing,
NxMirror API token management, session stored **only** in Expo SecureStore
(Android Keystore), automatic session-expiry handling, anonymous public
browsing.

### NxDB
Database overview (real storage bytes), database list, per-database table
listing and a working SQL console with query history and JSON results, object
storage listing. Access is enforced by the backend — no admin operations.

### Design system — "Liquid Glass"
Dark glassmorphism (light theme supported): translucent `GlassCard` /
`GlassButton` / `GlassTabBar`, blur surfaces, soft gradients, rounded panels,
haptic feedback, Reanimated transitions, **skeleton loading everywhere**, edge-
to-edge layout with proper system-bar insets and native back-button support.
No Material UI, no WebView — 100% native screens.

## Technology stack

| Layer | Choice |
| --- | --- |
| Framework | React Native (0.79) + Expo SDK 53 |
| Language | TypeScript (strict) |
| Navigation | Expo Router 5 (file-based, 5-tab bottom navigation + stack) |
| Animation | React Native Reanimated 3, Gesture Handler, expo-blur, expo-haptics, expo-linear-gradient |
| Data | TanStack Query 5 + Zustand 5 |
| Storage | expo-secure-store (session), AsyncStorage (preferences, search history) |
| Files | expo-file-system, expo-document-picker, expo-image-picker, expo-sharing |
| Platform | expo-network, expo-clipboard, expo-splash-screen, expo-status-bar, react-native-svg |

## Screenshots

> Add screenshots here after the first device run (Home · Registry · Package ·
> Files · Repository · NxDB · Settings).

## Development setup

```bash
git clone https://github.com/crossberry-in/NxMirror-Android.git
cd NxMirror-Android
npm install
npx expo start
```

Press `a` for an Android device/emulator with Metro, or build standalone APKs —
see **docs/LOCAL-BUILD.md** (fully local: Expo Prebuild + Gradle, no Expo
account, no EAS).

## API configuration

The app talks to the Demoapi backend. The default base URL is
`https://nxmirror.netlify.app` (`app.json → extra.nxmirror.defaultApiBaseUrl`)
and can be changed in **Settings → API server** (any https NxMirror/Demoapi
deployment). Every endpoint used by this app is documented, with real request/
response shapes, in **docs/API-INTEGRATION.md**.

No fake data, no invented endpoints: screens render exactly what the backend
returns and show honest empty/error states otherwise.

## GitHub Actions release

`Actions → Android Release` (or pushing a `v*` tag) builds the release APK on
GitHub runners with Gradle and publishes a GitHub Release with the APK asset.
Details and signing policy: **docs/RELEASE.md**.

Latest release: **https://github.com/crossberry-in/NxMirror-Android/releases**

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| "API unreachable" banner | Check internet; the banner reflects a real probe of `/api/db`, not an assumption |
| Login fails | Username must be `3–30 lowercase letters/digits/_`, password `8+` characters (backend rules) |
| Upload fails at 4 MiB (direct) | Large files automatically use chunked upload — retry once network is stable |
| Publish returns 409 | `name@version` already exists — versions are immutable, bump the version |
| Prebuild conflicts | `rm -rf android ios && npx expo prebuild --platform android --no-install` |
| Wrong API responses after changing server | Settings → API server → Reset to official |

## Repository layout

```
app/                  Expo Router routes (tabs + stack screens)
  (tabs)/             Home · Registry · Files · Git · Account
  package/[id]        Package detail
  file/[id]           Cloud file detail
  repository/[id]     Git repository detail
  nxdb/               NxMirror DB screens
  auth/ · settings/ · publish/ · search
src/
  services/api/       Centralized API client (client, auth, registry, files, git, account, nxdb)
  components/         glass/ · common/ · registry/ · files/ · git/ · icons
  hooks/  stores/     TanStack Query hooks · Zustand stores
  theme/  types/  utils/  constants/
assets/images/        App icon, adaptive icon, splash, favicon
docs/                 API-INTEGRATION · LOCAL-BUILD · RELEASE
.github/workflows/    android-release.yml (Gradle on GitHub runners)
```

## License

© Crossberry. All rights reserved.
