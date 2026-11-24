# Untold Admin App — original README in English

> **Historical translation.** This is a complete English translation of the [preserved Romanian README](admin-app-README.md), not the current Android behavior. The [current guide](../../../admin-app/README.md) explains entry/exit, SSE and incomplete authentication. Credential examples are placeholders.

An Android application in Kotlin and Jetpack Compose for staff at festival entrances: authentication, bracelet/ticket QR scanning and tracking how many people entered.

It connects to the same Spring Boot backend as the attendee and organizer frontends, through dedicated endpoints described at the time as reserved for ADMIN. The original architecture reference is preserved in [historical volume 3](../3_technical_architecture.md).

## 1. Structure

The application is implemented primarily in one file with numbered sections: [MainActivity.kt](../../../admin-app/app/src/main/java/com/example/admin_app/MainActivity.kt).

| Original section | Contents |
|---|---|
| 1. Retrofit API and Data Models | UntoldAdminApi for login, validate-qr and stats; request/response data classes |
| 2. State Manager and Main Activity | ScannerState, MainActivity, navigation between login/scanner/stats |
| 3. UI Components and Theming | UntoldTheme and UntoldGradient |
| 4. Screen 1 | Administrator login |
| 5. Screen 2 | Camera scanner, CameraX/ML Kit preview, HUD and bottom card |
| 5b. Screen 3 | Live entrance statistics |

Other original references:

- AndroidManifest declares INTERNET/CAMERA and cleartext HTTP for the local development backend.
- Module Gradle file includes Compose Material 3, CameraX, ML Kit Barcode Scanning and Retrofit/Gson.

## 2. Functionality

### 2.1 Administrator authentication

Email/password login calls POST /api/auth/admin-login. Backend explicitly checks ADMIN and rejects other roles with the administrator-only message.

The original note states that only username is saved in UntoldAdminPrefs while logged in. The returned JWT is not retained or sent with subsequent requests; this remains a material integration issue.

### 2.2 QR scanning for bracelet/ticket

The scanner has a live CameraX preview and ML Kit recognition. A decoded value is POSTed to /api/tickets/validate-qr with qrCode.

The original behavior description checked existence, completed identity check-in and whether the bracelet had already been scanned that day after 07:00. It described first successful daily scan as an entry, with entrance_logs enforcing anti-passback.

Feedback uses green Access Granted with name/type or red Access Denied with the exact backend reason, including invalid code, incomplete check-in or the historical Already Scanned Today message. Scanning can resume through Scan Next/Try Again; the original note also described returning to Idle.

These statements preserve the old description. Current source includes OUT/re-entry and different movement feedback; see the current functional specification.

### 2.3 Live statistics

The original note described a separate STATS screen calling GET /api/tickets/stats/entrances-today and refreshing every 12 seconds while visible, using the same 07:00 window.

Current source instead uses SSE. This translation preserves the original requirement/implementation note rather than silently replacing its sequence.

### 2.4 Logout

Logout clears username from SharedPreferences and returns to login.

## 3. Backend configuration

RetrofitClient.BASE_URL is hardcoded to http://10.0.2.2:8080/, Android emulator loopback to host localhost. The original note described local Docker backend use and said a physical device requires changing the URL to the host LAN address.

The original examples started/restarted the backend through Docker Compose. Current source also hardcodes a separate SSE address, so the current guide is required before device configuration.

## 4. Known limitations in the original note

- No authenticated follow-up requests: JWT is not retained/sent, and local session display does not authenticate validate-qr/stats.
- Camera permission is requested when the scanner opens; refusal lacks an in-app retry/settings route.
- Backend address is hardcoded without debug/staging/production variants.
- Additional review details were described as residing in conversation/PR history for the original feature branch; that external history is not a current documentation dependency.

## 5. Original local-run sequence

1. Start or restart the backend from the repository root using Docker Compose.
2. Open the root Gradle settings in Android Studio; it maps :app to admin-app/app.
3. Run on an emulator because of the hardcoded address.
4. Grant camera permission on first scanner access.
5. Log in with a locally provisioned ADMIN account from DatabaseSeeder; email/password examples are intentionally omitted.

These are historical instructions, not commands executed during documentation recovery. [Current Android setup](../../../admin-app/README.md) includes wrapper/JVM requirements and current authentication blockers.
