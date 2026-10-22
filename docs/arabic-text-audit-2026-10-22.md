# Arabische Textprüfung – 22. Oktober 2026

Ausgangspunkt: lateinisches `d` in Donnerstags-Bittgebet 11.
Geprüfter Bestand: alle 140 `arabic_text`-Felder der sieben Tagesdateien
und ihre arabischen Volltexte im Suchindex. Die Dateien sind minifiziert;
die folgenden Fundstellen liegen jeweils in Zeile 1.

## Korrigierte Stellen

| Datei / Dua-ID | Vorher | Nachher | Befund |
|---|---|---|---|
| `public/data/day-thursday.json` / `khamis_11` | `dِينِكَ` | `دِينِكَ` | Lateinisches U+0064 statt arabischem U+062F |
| `public/data/day-tuesday.json` / `thulatha_09` | `rِضَائِي` | `رِضَائِي` | Lateinisches U+0072 statt arabischem U+0631 |
| `public/data/day-friday.json` / `jumua_11` | `الْعُلْايَا` | `الْعُلْيَا` | Überzähliges Alif im Wort für „höchste“ |

Dieselben drei Korrekturen sind in `public/data/search-index.json` enthalten.
Die übrigen Zeichen, Vokalzeichen, Übersetzungen und Quellenmetadaten bleiben
unverändert. Es findet keine automatische Normalisierung des Quelltextes statt.

## Textbelege

- Donnerstag: [Musnad Abi Ya‘la, über Anas ibn Malik](https://www.islamweb.com/ar/library/content/1061/3486/)
  enthält „أقبل بقلبي إلى دينك“. Auch [Al-Ahadith al-Mukhtarah, Nr. 1682](https://dorar.net/h/Wob88Hyq?osoul=1)
  belegt das Wort `دينك`.
- Dienstag: [Al-Mustadrak, Buch der Bittgebete, Nr. 1931](https://hadithweb.com/mustadrak/17/172/3)
  enthält `مُنْتَهَى رِضَائِي`. Abweichende Formulierungen anderer Satzteile
  werden nicht an diese Ausgabe angeglichen.
- Freitag: [HadithAnswers: Salutation von ‘Abdullah ibn ‘Abbas](https://islamqa.org/hanafi/hadithanswers/119617/the-form-of-durud-salutations-of-abdullah-ibn-abbas-radiyallahu-anhuma/)
  gibt `دَرَجَتَهُ الْعُلْيَا` wieder und nennt Musannaf ‘Abdur Razzaq, Nr. 3104.

## Umfang und Absicherung

Die vollständige Zeichenprüfung findet genau zwei fremde Buchstaben (`d`, `r`)
und keine Steuerzeichen oder Unicode-Ersatzzeichen im arabischen Bestand.
Zusätzlich wurden alle Texte auf auffällige Schreibweisen durchgesehen;
der oben dokumentierte zusätzliche Schreibfehler wurde anhand einer Quelle
bestätigt. Dies ist keine vollständige philologische Kollation jeder Überlieferung.

`tests/data.test.ts` prüft künftig jeden Buchstaben im gesamten arabischen Text,
verbietet fremde Schriften, Steuer- und Ersatzzeichen und verlangt zeichengetreue
Übereinstimmung der arabischen Suchtexte mit den Tagesdateien. Jedes Bittgebet
muss genau einmal im Suchindex erscheinen; doppelte Einträge dürfen keine
fehlenden Einträge verdecken. Die bestehenden
Buildprüfungen sichern außerdem die identische Übernahme in die versionierten
Offline-Dateien ab. Ein erneuter Test mit den ursprünglichen defekten Daten
muss die beiden lateinischen Buchstaben melden.
