# GODZILLA – Kaiju Rampage 3000

Ein isometrisches Monster-Browserspiel im Look von SimCity 3000 – eine Fan-Hommage an die alten japanischen Godzilla-Filme.
Du steuerst Godzilla, legst Städte in Schutt und Asche und kämpfst gegen Mechagodzilla, Biolante und King Ghidorah.

**Spielen:** einfach `index.html` über GitHub Pages öffnen (oder lokal, siehe unten).

## Steuerung

| Taste | Aktion |
|---|---|
| Pfeiltasten / WASD | Laufen (einfach durch Häuser hindurch!) |
| J oder Leertaste | Schwanz- & Klauenschlag |
| K (halten) | Atomstrahl (verbraucht die blaue Leiste) |
| L | Brüllen – betäubt Gegner, verjagt Panzer |
| P / Esc | Pause |
| M | Ton an/aus |

## Level

1. **Tokio** – Hafenviertel bei Nacht, Boss: Mechagodzilla (mit Spiegelschild ab halber Energie)
2. **Ashino-See** – Hakone in der Abenddämmerung, Boss: Biolante (Ranken, Säure-Spucke)
3. **Berg Fuji** – Dörfer am heiligen Berg, Boss: King Ghidorah (fliegt, Gravitationsblitze)
4. **???** – ein Geheimlevel

Tipps: Zerstörte Gebäude laden den Atomstrahl auf. Atomkraftwerke heilen Godzilla.

## Technik

- Reines JavaScript + Canvas 2D, keine Frameworks, keine Build-Tools
- Interne Auflösung 480×270, pixelgenau hochskaliert → läuft auch auf älteren Rechnern
- Der Boden jedes Levels wird einmalig vorgerendert; pro Frame nur ein paar hundert `drawImage`-Aufrufe
- **Alle Grafiken** werden beim Start prozedural aus Code erzeugt (keine fremden Bilddateien)
- **Alle Musikstücke** sind Eigenkompositionen und werden live über einen 4-Kanal-Chiptune-Synth
  (2× Puls, Dreieck, Rauschen – wie beim Game Boy) mit der WebAudio-API erzeugt → komplett lizenzfrei
- Schrift: „Press Start 2P“ (SIL Open Font License) über Google Fonts

## Lokal starten

Doppelklick auf `index.html` funktioniert. Alternativ ohne Installation per PowerShell-Mini-Server:

```
powershell -ExecutionPolicy Bypass -File tools\serve.ps1
```

und dann http://localhost:8123 öffnen.

## Easter Eggs (Spoiler!)

<details>
<summary>Aufklappen</summary>

- **Konami-Code** (↑↑↓↓←→←→ B A) im Titelbildschirm → Monsterinsel (Boss-Rush gegen alle drei)
- **MINILLA** im Titel tippen → als Godzillas Sohn spielen (pustet Rauchringe)
- **1954** jederzeit tippen → Schwarzweiß-Filmmodus wie im Original „Gojira“
- **MOTHRA** im Spiel tippen → Mothra kommt einmal pro Level zu Hilfe
- **TANZ** im Spiel tippen → Godzillas berühmter Siegestanz von 1965
- **GOJIRA** tippen → Brüllen
- In jedem Level versteckt sich ein **Lama** (Gruß an SimCity 3000 – „Reticulating Splines…“)
- Zerstöre den **Fernsehturm** in Tokio …

</details>

## Rechtliches

Nicht-kommerzielles Fanprojekt. Godzilla, Mechagodzilla, King Ghidorah, Biolante, Minilla und Mothra sind Marken
von Toho Co., Ltd. Dieses Projekt steht in keiner Verbindung zu Toho. Sämtlicher Code, alle Pixelgrafiken und die Musik
wurden eigens für dieses Projekt erstellt.
