# assets/

Filer sitet rent faktisk indlæser. Intet build-step — skiftes en fil, virker
det med det samme.

| Fil | Bruges i | Motiv-krav |
|-----|----------|------------|
| `room.jpg` | `.hero-scene__photo`. Homografien i `js/main.js` er kalibreret mod denne fils naturlige mål (`PHOTO_W`/`PHOTO_H`) og tv-skærmens fire hjørner (`TV`) | Generisk hal, mørk/cinematisk, en tv-/skærmflade synligt på væggen der hvor `TV` peger. Ingen personer, logoer, brands eller tekst. |
| `hand.webp` | `.hero-phone__img`. Ægte alfakanal (baggrund fjernet) — ingen mask-image. Skærmens placering i billedet er kalibreret mod `.hero-phone__glow`/`.hero-phone__title`s procentkoordinater i `css/style.css` | Hånd der holder en telefon, beskåret til indhold. Ingen genkendelige personer eller brands. Armens afskårne underkant skal altid ligge under viewportets bund — tjek i browseren, ikke kun i billedet, hvis filen skiftes. |
| `fonts/oswald-700.woff2` + `fonts/OFL.txt` | Dashboardets og telefon-mockets overskrifter (`--display` i `css/style.css`) | Skrifttype, ikke foto. `OFL.txt` er licensteksten og skal ligge ved siden af — se "Fonte" nedenfor. |

Titlen der står både på dashboardet og på telefonen (patchen over "WOD" i
`hand.webp`, samt app-mockets WOD-kort) kommer ét sted fra: `WOD_TITLE` i
`js/main.js`. Ret den ét sted, den opdaterer alle tre.

Ikke billeder, men kode-mocks (skiftes IKKE med filer):
- `#layer-screen` — dashboardet, HTML/CSS i `index.html` / `css/style.css`
- `.phone` i telefon-sektionen — appens hjemmeskærm, samme princip

## Fonte

`oswald-700.woff2` er selv-hostet (ingen Google Fonts-CDN). Tilføjes en ny
skrift eller vægt, skal dens OFL- eller anden licensfil ligge ved siden af på
samme måde.

## Komprimering

Kildefilerne fra billedgeneratoren er store (flere MB). Kør dem ned til under
~400 KB hver før commit, og tjek bagefter at skarpheden stadig holder når
fotoet vises ved sin højeste zoom (`zoomMax` i `js/main.js`) — ikke kun i
hvile.

## Filnavne der aldrig må ligge her

Reference-fotos fra det rigtige center (brand + ansigter) er git-ignoreret
ved navn i `.gitignore`. Læg dem i `billeder/` (også ignoreret), ikke her.
Intet kundebrand, centernavn eller ejernavn må forekomme i nogen fil i dette
repo — heller ikke i filnavne, alt-tekst eller kommentarer.
