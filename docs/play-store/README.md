# Hizbul Azam im Google Play Store

Stand: 22. Oktober 2026 · Paketname `com.fechalbatakpale.hizbulazam` (unwiderruflich)

## Aufbau

Die App ist eine PWA und wird als **Trusted Web Activity (TWA)** ausgeliefert.
Chrome rendert `https://hza.fechal-batakpale.com` vollflächig, ohne Adressleiste.
Das Android-Projekt liegt in `android/` und wird von Bubblewrap erzeugt/gepflegt.

Dateien:

| Pfad | Zweck |
|---|---|
| `android/` | Gradle-Projekt, `applicationId = com.fechalbatakpale.hizbulazam` |
| `.github/workflows/android.yml` | baut die signierte AAB, lädt sie als Artifact |
| `public/.well-known/assetlinks.json` | Digital Asset Links (TWA-Verifikation) |
| `public/datenschutz.html`, `public/impressum.html` | Pflichtseiten |
| `docs/play-store/` | Store-Texte, Data-Safety- und Rating-Antworten |

## Einmalig: Signaturschlüssel

Der Upload-Key liegt **nicht** im Repo. Erzeugt wurde ein RSA-4096-Keystore
(gültig bis 2059) auf dem Server unter `/root/hza-keys/upload.jks` (Rechte 600).
Er ist über GitHub-Secrets im Workflow verfügbar:

```
ANDROID_KEYSTORE_BASE64
ANDROID_KEYSTORE_PASSWORD
ANDROID_KEY_ALIAS      = upload
ANDROID_KEY_PASSWORD
```

**Der Keystore ist der wichtigste Gegenstand des ganzen Projekts.** Geht er
verloren, sind keine Updates mehr möglich, solange Play App Signing nicht greift.
Kopie in KeePass und an einem zweiten Ort ablegen.

Upload-Zertifikat (SHA-256):

```
52:8C:4C:64:E1:DB:65:E0:F8:0D:92:8B:20:31:98:1C:16:3B:7C:FD:66:5F:24:35:53:2F:91:01:AC:F1:CB:9B
```

## Ablauf bis zur Veröffentlichung

1. **AAB bauen.** Actions → „Android AAB" → Run workflow. Das Artifact `aab`
   enthält `app-release-bundle.aab` und `aab-info.txt` (versionCode, SHA-256).
2. **Interner Test.** Play Console → Testen → Interner Test → Neue Version →
   AAB hochladen. Beim ersten Upload fragt Play nach dem App-Signaturschlüssel:
   „Play App Signing" bestätigen (Google verwaltet den Verteilerschlüssel).
3. **Google-Fingerprint eintragen.** Nach dem Upload zeigt
   *Testen → App-Integrität → App-Signatur* das SHA-256 des **von Google
   verwalteten** Zertifikats. Diesen Wert zusätzlich in `assetlinks.json`
   aufnehmen:

   ```bash
   bash deploy/add-assetlink-fingerprint.sh "AA:BB:..."
   git commit -am "chore(play): Google-Signaturzertifikat in assetlinks"
   git push
   ```

   Ohne diesen Schritt startet die installierte App mit sichtbarer Adressleiste,
   weil die Verifikation gegen das ausgelieferte Zertifikat fehlschlägt.
4. **Prüfen.** `https://hza.fechal-batakpale.com/.well-known/assetlinks.json`
   muss beide Fingerprints enthalten. Gegenprobe:

   ```bash
   curl -s "https://digitalassetlinks.googleapis.com/v1/statements:list\
   ?source.web.site=https://hza.fechal-batakpale.com\
   &relation=delegate_permission/common.handle_all_urls"
   ```
5. **Store-Eintrag.** Texte DE/EN/FR aus `console-cheatsheet.md` (massgeblich), Screenshots aus
   `screenshots/` (1080×1920), Data Safety aus `data-safety.md`,
   Alterseinstufung aus `content-rating.md`.
6. **Geschlossener Test.** 12 Tester, 14 Tage durchgehend. Danach Produktions-
   zugang beantragen (nur bei privatem Entwicklerkonto nötig).

## Versionsnummern

`versionCode` muss mit jedem Upload steigen. Bubblewrap setzt ihn beim
Erzeugen; für Folgereleases in `android/app/build.gradle` bzw. über
`appVersionCode` in `twa-manifest.json` pflegen. `versionName` folgt der
Semver der Web-App.

## Wenn etwas klemmt

- **Adressleiste sichtbar** → `assetlinks.json` prüfen (beide Fingerprints,
  `Content-Type: application/json`, HTTP 200 ohne Redirect).
- **Weißer Bildschirm** → `startUrl` in `twa-manifest.json` muss auf eine
  existierende Route zeigen, `scope` die Domain umfassen.
- **Play lehnt ab („Minimum Functionality")** → die App hat Offline-Inhalte,
  Suche, Favoriten und Deep-Links; das im Review-Text benennen, nicht als
  „Website-Wrapper" beschreiben.
