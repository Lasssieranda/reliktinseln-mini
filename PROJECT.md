# Reliktinseln Mini — Projekt

Freigegebenes Grundkonzept und MVP. Keine offenen Ideenfragen.

## Konzept

Entspanntes Aufbau- und Sammelspiel. Der Spieler hat eine kleine Insel im Hochformat. Er tippt Holz und Stein, baut und verbessert Gebäude. Die Insel wächst sichtbar und fühlt sich an wie seine.

Relikte sind Belohnungen, nicht das Hauptgenre. Alltag ist gemütlich; wenn ein Relikt kommt, wird es kurz mystisch.

Look: flache, ruhige Formen. Relikte dürfen leuchten. Am Anfang nur die Insel — kein Charakter, kein Pet (kann später).

Sessions eher 15+ Minuten: bauen plus klare Mini-Ziele („noch die Hütte“, „noch das Relikt“). Gebäude dürfen später ein bisschen mithelfen. Kein reines Idle, kein AFK-Fertigspielen.

Save lokal. Offline nach Erstload spielbar.

## MVP

So wenig wie möglich, erweiterbar:

- Ressourcen (2): Holz, Stein
- Gebäude (3): Hütte (wenig Auto-Holz), Steinbruch (wenig Auto-Stein), Schrein (frisst beides, macht Relikt-Fortschritt)
- Stufen: Hütte und Steinbruch je 3, Aussehen ändert sich. Schrein ohne Stufen, nur füttern
- Relikte (2): Waldsplitter (Taps geben mehr), Inselherz (Gebäude helfen etwas mehr). Liegen als Objekte auf der Insel, nicht nur als Zahl
- Mini-Ziele (7, eine Liste, kein Questsystem): Hütte → Steinbruch → Stufe 2 → Schrein → Relikt 1 → Stufe 3 → Relikt 2

### Bewusst nicht im MVP

Pet/Figur, zweite Insel, dritte Ressource, mehr Gebäude, Relikt-Kombis, langes Offline-Idle, Audio, Quests, Kampf, Prestige, Cloud/Accounts, Multiplayer, Werbung, IAP, Phaser, Backend, Capacitor, Landscape als Pflicht.

## Stack (MVP)

TypeScript, Vite, Canvas 2D in Schichten (Boden, Gebäude, Relikte), HUD und Mini-Ziele als Vanilla-DOM. Save: JSON in localStorage, oft flushen, Schema versioniert. PWA: Manifest + Service Worker, standalone, Hochformat.

Phaser nicht im MVP: Zähler- und Layer-State, keine Tilemaps, Physik, Gegner oder Szenenwechsel.

Pflicht beim Bauen (sobald M1 startet): devicePixelRatio, dvh/visualViewport, safe-area, touch-action + overscroll-behavior, dt-clamp, Pause im Hintergrund, Pointer-Events, HTML network-first, Versionsstempel im UI.

## Abnahmekriterien (MVP-Go)

Geräte: 1× iPhone Safari (Tab + Zum Home-Bildschirm), 1× Android Chrome (Tab + installierte PWA). Portrait, Touch.

Muss, sonst kein Go:

1. PWA startet Standalone in Portrait. Icon und Name da.
2. Insel + HUD sichtbar. Notch/Home Indicator verdecken keine Taps.
3. Tippen sammelt und baut. Kein Scroll, kein Zoom, kein Pull-to-Refresh.
4. Insel wächst sichtbar nach Aufbau. Ohne sichtbares Wachstum kein Go.
5. Mini-Ziel in der Session: angezeigt, erfüllbar, Abschluss sichtbar.
6. Relikt-Moment: Relikt auf der Insel lesbar, nicht nur eine Zahl im HUD.
7. Save überlebt Reload, Tab zu, App-Kill (Inselstand, Ressourcen, Mini-Ziel, Relikt).
8. Offline nach Erstload: startet, spielbar, Save schreibt weiter.
9. App-Wechsel / Sperrbildschirm: kein Ressourcensprung, Save heil, Touch danach wieder da.
10. Kein Bruch: weißer Screen, leere Insel, HUD weg, Landscape ohne Recovery unspielbar.
11. Build-Version im UI sichtbar.
12. Nach Wachstum/Relikt bleibt die Insel bedienbar, kein Freeze.

### Inhalt für MVP-Go

Die 12 Punkte oben sind Qualitätsleisten. Ein einzelner Hüttenbau reicht **nicht** für MVP-Go. Inhalt muss ebenfalls erfüllt sein:

- Alle 7 Mini-Ziele mindestens einmal abgeschlossen: Hütte, Steinbruch, Stufe 2, Schrein, Relikt 1, Stufe 3, Relikt 2.
- Beide Relikte sichtbar **auf der Insel** (nicht nur HUD-Zahl). Reihenfolge: Schrein füttern → Relikt 1 Waldsplitter auf der Insel → weiter füttern → Relikt 2 Inselherz auf der Insel. Der Relikt-Pfad ist der Schrein, nicht unabhängig.
- Stufen gelten für **Hütte und Steinbruch**: Stufe 2 ist auf der Insel sichtbar größer/klarer als Stufe 1, ohne HUD zu lesen. Stufe 3 ebenso gegenüber Stufe 2.
- QA-Relikt-Skip darf zu Relikt 1 und zu Relikt 2 springen (über das QA-Menü, siehe unten).

### Tab vs. installierte PWA (Save)

- iOS Safari-Tab und Android Chrome-Tab: Spiel spielbar, Save überlebt Reload **im Tab**.
- Save überlebt App-Kill nur als Kriterium für die **installierte PWA** (iOS Home-Bildschirm / Android installiert). Ein Tab reicht für das App-Kill-Save-Kriterium **nicht**.

Nicht im MVP-Test: Pet, Landscape/Desktop als Soll, iPad, andere Browser, Economy-Balance, Art außer Lesbarkeit.

### QA-Debug (kein Spieler-Feature)

Save-Reset und Relikt-Skip sind QA-only, kein Spieler-Feature. **Eine Geste:** Versionslabel im HUD 3 Sekunden gedrückt halten öffnet **ein** QA-Menü mit: Save-Reset, Skip Relikt 1, Skip Relikt 2. Relikt-Skip ist **keine** zweite Geste.

Für QA außerdem: HTTPS-URL, Version im UI, Hinweis wie Cache killen. Debug-Skip zum Relikt (15 Min Grind ist kein Test).

## M1-Abnahme (enges Teilset)

PWA Portrait, Tippen Holz/Stein, Hütte steht, Insel wächst sichtbar, Save/Offline, Version im UI. Relikte sind nicht M1. M1 ist noch nicht gestartet.

**Wachstum (pass/fail):** Vor der ersten Hütte hat die Insel keine Hütte. Nach dem Bau steht die Hütte **sichtbar auf der Insel**, nicht nur als HUD-Zahl.

**Hütte bauen:** Mini-Ziel zeigt Holz- und Stein-Kosten. Hat der Spieler genug, wird eine HUD-Aktion aktiv. Tippen auf die markierte Baustelle **auf der Insel** platziert die Hütte. Exakte Zahlen kommen in der M1-Implementierung; die Interaktion ist diese.

**QA Save-Reset:** Wie oben — Versionslabel 3 s halten öffnet das QA-Menü (Save-Reset). Kein Spieler-Feature.
