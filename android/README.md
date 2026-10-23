# Android-Projekt (Trusted Web Activity)

Erzeugt die Play-Store-App für `https://hza.fechal-batakpale.com`.
Die Web-App bleibt die Quelle der Wahrheit; dieses Modul ist nur die Hülle.

- `applicationId`: `com.fechalbatakpale.hizbulazam`
- `minSdk 24`, `targetSdk 36` (Pflicht für neue Apps seit 31.08.2026)
- Start-URL: `https://hza.fechal-batakpale.com/`
- Verifikation: `https://hza.fechal-batakpale.com/.well-known/assetlinks.json`

## Bauen

Lokal nicht nötig — der Workflow `.github/workflows/android.yml` baut die
signierte AAB. Signiert wird ausschließlich über Umgebungsvariablen
(`ANDROID_KEYSTORE_PATH`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`,
`ANDROID_KEY_PASSWORD`), die aus GitHub-Secrets kommen. Ohne diese Variablen
entsteht eine unsignierte AAB — bewusst, damit nie versehentlich mit einem
eingecheckten Schlüssel gebaut wird.

## Versionsnummern

`APP_VERSION_CODE` / `APP_VERSION_NAME` überschreiben die Werte aus
`app/build.gradle`. Play verlangt bei jedem Upload einen höheren `versionCode`.

## Wiederverwendung für weitere Apps

1. `android/` als Vorlage kopieren (z. B. `android-daily-prayers/`).
2. In `app/build.gradle` `namespace`/`applicationId`, in
   `res/values/strings.xml` `launch_url` und `asset_statements` anpassen.
3. Icons in `res/mipmap-*` ersetzen.
4. Workflow mit `project_dir: android-daily-prayers` aufrufen.
