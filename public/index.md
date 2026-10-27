# Hizbul Azam — Duas der Woche

Hizbul Azam ist eine kostenlose Progressive Web App für die tägliche Lektüre der Duas des Hizbul Azam. Die Sammlung ist nach sieben Wochentagen geordnet und enthält arabische Texte, Transkription, Übersetzungen in Deutsch, Englisch und Französisch sowie die jeweils hinterlegten Quellenangaben.

## Lesen und wiederfinden

Die interaktive App bietet eine Tagesauswahl, Suche, lokale Favoriten und eine gespeicherte Leseposition je Tag. Arabische Schrift und Übersetzung können getrennt vergrößert werden. Es gibt ein helles und ein dunkles Farbschema. In den Einstellungen lässt sich die gesamte Woche einschließlich Schriften für die Offline-Lektüre herunterladen.

## Ohne Anmeldung

Die App benötigt kein Benutzerkonto. Favoriten und Einstellungen bleiben auf dem Gerät. Inhalte und Schriften werden vom eigenen Server geladen. Die interaktiven Funktionen benötigen JavaScript; diese Einführung und die Informationsseiten sind ohne JavaScript lesbar. Die Übersetzungen unterstützen das Verständnis. Die App bietet keine persönliche religiöse Beratung.

## Navigation und Abruf für Agenten

- [App öffnen](https://hza.fechal-batakpale.com/): Tagesauswahl und Suche benötigen einen Browser mit JavaScript.
- Tageslinks verwenden `https://hza.fechal-batakpale.com/#/day/<day>`. Gültige Werte sind `saturday`, `sunday`, `monday`, `tuesday`, `wednesday`, `thursday` und `friday`.
- Einzelne Duas verwenden `https://hza.fechal-batakpale.com/#/dua/<id>` mit einer tatsächlich in der App vorhandenen ID. Fragmente werden nicht an den HTTP-Server gesendet.
- `GET /` mit `Accept: text/markdown` liefert diese Einführung; `Accept: text/html` liefert die App mit lesbarer HTML-Einführung. Es gibt keine öffentliche Schreib-API.

## Informationen

- [Über die App](https://hza.fechal-batakpale.com/about.md)
- [Kontakt](https://hza.fechal-batakpale.com/contact.md): Fechal Batakpale, fecbatino@gmail.com.
- [Datenschutz](https://hza.fechal-batakpale.com/privacy)
- [Impressum](https://hza.fechal-batakpale.com/impressum.html)
- [Agentenhinweise](https://hza.fechal-batakpale.com/llms.txt)
- [Sitemap](https://hza.fechal-batakpale.com/sitemap.xml)
