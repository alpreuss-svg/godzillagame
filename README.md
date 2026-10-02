# GODZILLA – Kaiju Rampage 3000

Ein isometrisches Monster-Browserspiel im Look von SimCity 3000 – eine Fan-Hommage an die alten japanischen Godzilla-Filme.
Du steuerst Godzilla, legst Städte in Schutt und Asche und kämpfst gegen Mechagodzilla, Biolante und King Ghidorah.

**Spielen:** einfach `index.html` über GitHub Pages öffnen (oder lokal, siehe unten).

## Steuerung

| Taste | Aktion |
|---|---|
| Pfeiltasten / WASD | Laufen (einfach durch Häuser hindurch!) |
| J oder Leertaste | Kombo: Klaue, Klaue, Schwanzhieb rundum |
| K (halten) | Godzilla atmet ein, die Rückenplatten laden sich vom Schwanz aufwärts auf – dann Atomstrahl |
| L | Brüllen – betäubt Gegner, verjagt Panzer |
| R | **Kernpuls** – 360°-Atomexplosion, wenn die rote Wut-Leiste voll ist |
| P / Esc / Pause-Knopf | Pause-Menü (Weiter, Optionen, Steuerung, Neustart, Titel); pausiert auch automatisch, wenn das Fenster den Fokus verliert |
| M | Ton an/aus |

**Gamepad:** Stick/Steuerkreuz laufen, A Schlag, X/RT Strahl, Y Brüllen, RB/B Kernpuls, Start Pause.
**Handy/Tablet:** virtueller Stick links, Aktionstasten rechts (erscheinen automatisch auf Touch-Geräten).

## Als App installieren (PWA)

Das Spiel ist eine Progressive Web App und läuft nach dem ersten Laden auch **offline**.

- **PC (Chrome/Edge):** Seite öffnen → Installieren-Symbol rechts in der Adressleiste.
- **Android:** Chrome-Menü → „App installieren“ bzw. „Zum Startbildschirm hinzufügen“.
- **iPhone/iPad:** Safari → Teilen → „Zum Home-Bildschirm“.

Im Menü **OPTIONEN** lassen sich Musik- und Effektlautstärke, Grafikqualität (NIEDRIG für ältere PCs)
und Schwierigkeit (Leicht/Normal/Schwer) einstellen.

## Level

| # | Level | Zwischengegner | Boss |
|---|---|---|---|
| 1 | Tokio – Hafenviertel bei Nacht | Kamacuras (1, dann 2) | Mechagodzilla (Spiegelschild) |
| 2 | Osaka – **mit Anguirus als Verbündetem** | Kamacuras ×2 | Gigan |
| 3 | Ashino-See – Hakone in der Dämmerung | Kumonga (Netze bremsen) | Biolante |
| 4 | Letchi-Atoll – Südsee | Ebirah, dann Ebirah + Kamacuras | Megalon |
| 5 | Yokohama – Industriehafen im Smog | Kamacuras + Kumonga | Hedorah (Giftwolken) |
| 6 | Nagoya – **mit Mothra als Verbündeter** | Kumonga | Battra (Larve → Falter) |
| 7 | Berg Fuji | Rodan, dann Rodan + Kamacuras | King Ghidorah |
| 8 | Fukuoka – Kristallstadt | Moguera | SpaceGodzilla (Kristalltürme heilen ihn) |
| 9 | Sapporo – Schneefestival | Titanosaurus, dann Battra + Rodan | Mecha-King Ghidorah |
| 10 | Shinjuku – das Finale | Gigan + Megalon | Destoroyah |
| ? | ??? | – | Geheimlevel (Boss-Rush gegen fünf) |

**Verbündete:** Anguirus und Mothra kämpfen in ihren Leveln an deiner Seite (grüne Markierung, eigene Lebensleiste).
Es gibt kein Friendly Fire – deine Angriffe treffen sie nie. Gegner greifen aber auch sie an.

In Tokio, im Atoll, in Yokohama und Fukuoka steigt Godzilla zu Beginn Stück für Stück aus dem Meer.
Danach watet er im Wasser nur noch leicht ein. Rund um das Spielfeld geht Stadt und Landschaft im Dunst weiter;
am Rand hält dich eine unsichtbare Wand auf, die beim Anstoßen kurz aufschimmert.

Godzilla, Mechagodzilla, SpaceGodzilla, Minilla, Titanosaurus, Megalon, Moguera, King Ghidorah und Mecha-King Ghidorah
haben eine Seiten-, Front- und Rückenansicht – je nachdem, ob sie seitlich, auf den Betrachter zu oder von ihm weg laufen.
In den Städten fahren Autos und laufen Menschen, die vor den Monstern fliehen. Panzer und Jets greifen an.
Hochhäuser zeigen Schäden und stürzen mit Staubwolken und Trümmern ein; Fußabdrücke und Brandspuren bleiben
auf dem Boden. Am Levelende gibt es eine Bewertung (S/A/B/C). Eine Minikarte zeigt alle Monster.

**Tipps**
- Roter Kreis + „!“ über einem Monster = es holt gleich aus → ausweichen!
- Ohne Treffer regeneriert Godzilla nach 3 Sekunden langsam HP.
- Gelbe Fässer (+15 HP) fallen aus zerstörten Gebäuden, Atomkraftwerke geben +50 HP.
- Fliegende Monster erreicht man nur mit dem Atomstrahl.

## Technik

- Reines JavaScript + Canvas 2D, keine Frameworks, keine Build-Tools
- Interne Auflösung 480×270, pixelgenau hochskaliert → läuft auch auf älteren Rechnern
- Der Boden jedes Levels wird einmalig vorgerendert; pro Frame nur ein paar hundert `drawImage`-Aufrufe
- **Alle Grafiken** werden beim Start prozedural aus Code erzeugt (keine fremden Bilddateien)
- **Alle Musikstücke** sind Eigenkompositionen im Stil der Kaiju-Filmmusik der 50er/60er und werden live über einen
  kleinen Orchester-Synth (Blechbläser, Streicher, Kontrabass-Ostinato, Pauken, Militärtrommel, Hall) mit der
  WebAudio-API erzeugt → komplett lizenzfrei, es wird keine einzige Audiodatei geladen
- Auch die Monsterschreie sind synthetisch (der echte Godzilla-Schrei ist eine geschützte Marke von Toho)
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
- Zerstöre den **Fernsehturm** in Tokio … oder die **Burg von Osaka**
- **Konami-Code** auf der Monsterinsel: Boss-Rush gegen Mechagodzilla, Biolante, King Ghidorah und Destoroyah

</details>

## Rechtliches

Nicht-kommerzielles Fanprojekt. Godzilla, Mechagodzilla, King Ghidorah, Biolante, Minilla, Mothra, Anguirus, Rodan,
Kamacuras, Kumonga, Gigan, Hedorah, Destoroyah, Battra, Ebirah, Megalon, Moguera, Titanosaurus, SpaceGodzilla und Mecha-King Ghidorah sind Marken
von Toho Co., Ltd. Dieses Projekt steht in keiner Verbindung zu Toho. Sämtlicher Code, alle Pixelgrafiken und die Musik
wurden eigens für dieses Projekt erstellt.
