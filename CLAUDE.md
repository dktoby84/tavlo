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
  Tobias pusher selv — ingen `git push` herfra.
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
assets/         billeder + ikoner (pladsholdere indtil session 2)
screenshots/    git-ignoreret, kun til verifikation
```

## Hosting
GitHub Pages + custom domæne `tavlo.dk`. Kræver `CNAME`-fil i repo-roden og
DNS sat op hos domæneudbyder.
