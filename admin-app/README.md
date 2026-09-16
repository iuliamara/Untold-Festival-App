# Untold Admin App

Aplicație Android (Kotlin + Jetpack Compose) folosită de staff-ul de la intrarea în festival pentru autentificare, scanarea brățărilor/biletelor (cod QR) și urmărirea numărului de persoane intrate.

Se conectează la același backend Spring Boot folosit și de `frontend-attendee` / `frontend-admin` (vezi `docs/3_technical_architecture.md`), dar prin endpoint-uri dedicate, rezervate rolului `ADMIN`.

## Structură

Întreaga aplicație e implementată într-un singur fișier, organizat pe secțiuni numerotate:

`app/src/main/java/com/example/admin_app/MainActivity.kt`

| Secțiune | Conținut |
|---|---|
| 1. Retrofit API & Data Models | Interfața `UntoldAdminApi` (login, validate-qr, stats) + data class-urile de request/response |
| 2. State Manager & Main Activity | `ScannerState` (sealed class), `MainActivity`, `MainNavigation` (routing între Login / Scanner / Stats) |
| 3. UI Components & Theming | `UntoldTheme`, `UntoldGradient` |
| 4. Screen 1: Admin Login Screen | `AdminLoginScreen` |
| 5. Screen 2: Camera Scanner Screen | `AdminScannerScreen`, `CameraPreview` (CameraX + ML Kit), `ScannerHudOverlay`, `ScannerBottomCard` |
| 5b. Screen 3: Live Entrance Stats Screen | `AdminStatsScreen` |

Alte fișiere relevante:
- `app/src/main/AndroidManifest.xml` — permisiuni `INTERNET` și `CAMERA`, `usesCleartextTraffic="true"` (necesar pt HTTP către backend-ul local de dev).
- `app/build.gradle.kts` — dependințe: Jetpack Compose (Material 3), CameraX, ML Kit Barcode Scanning, Retrofit + Gson.

## Funcționalități

### 1. Autentificare admin
- Ecran de login (email + parolă) → `POST /api/auth/admin-login`.
- Backend-ul verifică explicit rolul `ADMIN`; orice alt rol primește 403 ("Acces interzis. Doar administratorii au acces.").
- Sesiunea e ținută minimal: doar username-ul e salvat în `SharedPreferences` (`UntoldAdminPrefs`), cât timp userul rămâne logat pe device. **Token-ul JWT primit la login nu e reținut și nu e trimis la cererile ulterioare** (vezi Limitări cunoscute).

### 2. Scanare cod QR (bratară/bilet)
- Ecran cu preview de cameră live (CameraX), decodare cod QR în timp real (ML Kit Barcode Scanning).
- La detectarea unui cod: `POST /api/tickets/validate-qr` cu `{ qrCode }`.
- Backend-ul validează, în ordine: codul există → check-in-ul e complet → nu a mai fost scanat azi de la ora 7:00 (logică anti-passback, `entrance_logs`). Primul răspuns de succes al zilei marchează o intrare nouă.
- Rezultatul e afișat ca overlay colorat (verde = ACCESS GRANTED cu nume + tip bilet, roșu = ACCESS DENIED cu mesajul exact de la backend, ex. "Code Invalid", "Check-in incomplete", "ALREADY SCANNED TODAY!").
- Scanarea se reia manual din buton ("SCAN NEXT" / "TRY AGAIN") sau automat, revenind la starea `Idle`.

### 3. Statistici live
- Ecran separat, accesibil din butonul "STATS" de pe ecranul de scanare.
- `GET /api/tickets/stats/entrances-today` — numărul de intrări înregistrate azi (aceeași fereastră de 7:00 AM ca logica anti-passback).
- Se reactualizează automat la fiecare 12 secunde cât timp ecranul e vizibil.

### 4. Logout
- Șterge username-ul din `SharedPreferences` și întoarce la ecranul de login.

## Configurare backend

`RetrofitClient.BASE_URL` este hardcodat la `http://10.0.2.2:8080/` — adresa de loopback pe care emulatorul Android o mapează către `localhost` al mașinii gazdă. **Funcționează doar în emulator**, testat rulând backend-ul local prin `docker compose up backend` (sau `restart backend` după modificări). Pe device fizic trebuie înlocuit manual cu IP-ul local al mașinii care rulează backend-ul (ex. `http://192.168.x.x:8080/`).

## Limitări cunoscute

- **Fără autentificare pe cererile ulterioare login-ului**: token-ul JWT nu e reținut/trimis către `validate-qr` sau `stats`; sesiunea e verificată doar client-side.
- **Permisiunea de cameră**: cerută o singură dată la deschiderea ecranului de scanare; dacă e refuzată, singura recuperare e restart-ul aplicației (nu există buton de retry sau link către Settings).
- **`BASE_URL` hardcodat**: nu există variantă de build (debug/staging/prod) pentru adrese diferite de backend.
- Detalii suplimentare (inclusiv cele găsite într-un code review recent) pot fi găsite în istoricul conversației / PR-ul aferent branch-ului `feat-app-admin`.

## Rulare locală

1. Pornește backend-ul: `docker compose up backend` (sau `docker compose restart backend` dacă rulează deja) din rădăcina proiectului.
2. Deschide proiectul root (`settings.gradle.kts` de la rădăcina repo-ului, care mapează modulul `:app` către `admin-app/app`) în Android Studio.
3. Rulează pe un emulator Android (nu pe device fizic, din cauza `BASE_URL`).
4. La prima deschidere a ecranului de scanare, acordă permisiunea de cameră cerută.
5. Loghează-te cu un cont `ADMIN` seedat (vezi `backend/src/main/java/com/untold/backend/DatabaseSeeder.java`, ex. `admin@untold.com` / `admin`).
