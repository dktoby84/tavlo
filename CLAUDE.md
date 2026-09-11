# CLAUDE.md — Tavlo marketing-site

Dette repo er et **selvstændigt statisk marketing-site** for Tavlo. Det er
ikke produktets repo og må aldrig kobles til det.

## Hvad Tavlo er (kort)
Kiosk-system til træningscentre. Storskærm i salen viser dagens program,
interval-timer, beskeder, events og billeder. Ejeren styrer alt fra telefonen
på under et minut. Vigtigste arbejdsgang: fotografér whiteboardet → AI læser
det → det står på skærmen. Layoutmotor skalerer teksten til 1920×1080.
Positionering: **supplement til centrets booking-app, ikke erstatning.**

## Hårde krav (gælder alle sessioner)
- **Statisk site:** vanilla HTML/CSS/JS. Ingen build-step, intet framework.
  Højst ét eksternt script via CDN (til scroll-animationen).
- **Ingen lækage fra produktet.** Kundenavn, centernavn, logo, ejerens navn,
  interne URL'er, tokens, hosting-referencer må IKKE forekomme nogen steder:
  ikke i kode, kommentarer, alt-tekst, filnavne, screenshots eller
  commit-beskeder. Sitet kender kun navnet "Tavlo".
- **Palette** (mørk baggrund):
  - guld `#F2B941` — reserveret til mærket + én primær CTA. Aldrig til flader.
  - orange `#F0A182`, magenta `#CA64DC`, lilla `#9046F3`, viola `#6525F7`
  - baggrund `#0B0A0D`
- **`prefers-reduced-motion`:** fuldt brugbar side uden scroll-animation.
- **Mobil 390 px skal virke.** Scroll-zoom må nedgraderes, aldrig brække.
- Semantisk HTML, kontrast (WCAG AA), tastaturnavigation.
- **Dansk tekst.** Commit-beskeder på dansk **uden æ/ø/å** (skriv ae/oe/aa).
  `git push` er tilladt herfra, når Tobias beder om det.
- Skriv aldrig "bekræftet med Tobias" e.l. om noget der ikke står skrevet.
  Antagelser markeres eksplicit som antagelser.

## Mærket
- Wordmark: `tavlo` i lowercase. O'et er en timer-ring i guld (samme ring som
  interval-timeren på skærmen). Ringen alene = favicon.
- Ingen logo-fil: wordmark bygges i ren SVG/CSS.
- Tal og timer: JetBrains Mono. Headline-font: vælges med UI UX Pro Max.

## Godkendte sætninger
- "Fotografér tavlen. Så står den på skærmen."
- "Tavlen på væggen. Styret fra lommen."
- "Skriv som du plejer. Tavlo sætter det op."
- "Dagens program. Hele salen. Under et minut."

## Struktur
```
index.html
css/            stylesheets
js/             scripts
assets/         hero-billeder (se assets/README.md for lag-kontrakten)
billeder/       git-ignoreret, reference-fotos fra centret (brand + ansigter)
screenshots/    git-ignoreret, kun til verifikation
```

## Hero-sekvensen
Scroll-drevet sekvens i seks etaper (sal i hvile → telefon løftes og sender til
skærmen → dashboard fader ind → telefon sænkes og kameraet zoomer ind →
landing). Ét fremdriftstal (`p`, glidet af `frame()`'s inerti mod
`trackProgress()`) styrer alt — CSS-variablerne og hjælpefunktionerne hedder:

1. **Hvile** — tv sort, `#hero-copy` (overskrift + CTA) synlig.
2. **Telefonen løftes** (`#layer-hand`, `hand.webp`) — styret af `phoneUp`.
   Samtidig forsvinder `#hero-copy` (`copyDim`), altid færdig før telefonen
   når teksten.
3. **Send-buen** (`updateSendArc`, drevet af `sendDraw`/`sendEnvelope`/
   `sendFlash`/`sendPulse`) tegner fra telefonskærmen til tv'et.
4. **Dashboardet** (`#layer-screen`) fader ind på tv'et (`tvOn`) — ingen zoom
   endnu.
5. **Telefonen sænkes** (`phoneDown`), kameraet zoomer ind mod tv'et
   (`pZoom`, `restScale`/`zoomMax` i `layoutScene()`), fotoet fader til sort
   (`veil`), og dashboardet folder ud til en flad 16:9-flade (`pDetach`) —
   folder først ud når fotoet er helt sort, ellers ses tv-rammens skæve form
   bag det flade dashboard.
6. **Landing** — kort hold, så slipper sticky til næste sektion. På
   portræt-skærme krymper `layoutScene()` selve stage-boksens højde i denne
   fase (se `HEADER_GAP_PX`, `GAP_TARGET_PX`, `FEATURES_PAD_PX`), så
   dashboardet lander tæt under headeren uden dødt scroll bagefter.

Øvrige byggeklodser:
- Homografien (`matrix3dFromQuad`, `TV`/`TV_CX`/`TV_CY`, `PHOTO_W`/`PHOTO_H`)
  mapper dashboardets flade til tv'ets fire hjørner i `room.jpg`.
- `svhPx`/`lvhPx` (skjulte probes) og `stageOccupiedPx` holder styr på
  Safaris dynamiske værktøjslinje: baggrundslag dækker altid hele skærmen,
  mens det der skal kunne læses/nås holder sig inden for det garanterede
  (svh-baserede) område.
- Titlen på både dashboardet og telefonen kommer fra ÉT sted, `WOD_TITLE`.
- Fald-tilbage (`prefers-reduced-motion` / uden JS): lagene stables lodret
  med billedtekst, ingen animation. `html.hero-on` (sat af `js/main.js`, se
  betingelsen øverst i filen) lægger den sticky, scroll-drevne version ovenpå.
- Alle tal (etape-grænser, mål, marginer) bor kun i `js/main.js` — ret dem
  ét sted der, ikke i denne fil.

**Debug:** `?debug` i URL'en viser en liveopdateret aflæsningsboks med alle
etape-variable. `BUILD`-konstanten øverst i `js/main.js` opdateres ved hver
ændring i filen, så boksen kan bruges til at se om browseren kører den
nyeste version (cache, deploy).

**Billedkrav** til `room.jpg`, `hand.webp` og fonte: se `assets/README.md`.

**Test:** Playwright, både WebKit ved iPhone 15-mål og Chromium ved
1920×1080. Test på en rigtig iPhone sker via en lokal server (fx
`python -m http.server`) — Playwright kan ikke selv vise Safaris
værktøjslinje.

## Hosting
Hosting: GitHub Pages på https://dktoby84.github.io/tavlo/, branch master,
root. Intet domæne endnu. Skriv aldrig et domænenavn ind i koden, og opret
ingen CNAME-fil. Kontakt: hejtavlo@gmail.com.
