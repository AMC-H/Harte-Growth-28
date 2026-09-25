# Video's op de homepage

| Bestand | Waar | Maat |
|---|---|---|
| `opening-16x9-1280.mp4` / `-960.mp4` | Opening, liggend (ruw materiaal). 960 op mobiel. | 1280x720 / 960x540 |
| `opening-9x16-720.mp4` / `-540.mp4` | Opening na de eerste scroll, en het resultaat in Media. 540 op mobiel. | 720x1280 / 540x960 |
| `opening-*.webp` | Posters (eerste frame). De 16:9-poster wordt vooraf geladen. | idem |
| `media-foto-1..5.webp` | Media: de 5 foto's in de bak en als miniaturen op V1 (mobiel: 1, 2 en 5). | 540x960 |
| `media-clip.mp4` + `.webp` | Media: de ruwe clip (3 s uit het resultaat, vlakke kleuren). Speelt alleen in Media. | 270x480 |
| `result.mp4` + `result.webp` | Media: het resultaat in het 9:16-scherm, scrubt mee met de montage. Laadt pas als Media in zicht komt. | 720x1280 |

De 9:16-video's laden pas na de eerste render. Beide video's zijn even lang en lopen synchroon
(bij de wissel neemt de ene de `currentTime` van de andere over).

## Vervangen

Houd dezelfde bestandsnamen aan, of pas de paden aan in `index.html` (hoofdstuk Opening en Media).
De tijdlijn-labels in Media (00:00 tot 00:12) volgen de lengte van `result.mp4`; pas ze aan als die verandert.
Liggend en staand moeten exact even lang zijn en de staande versie moet de middelste 9:16-strook
van de liggende zijn, anders loopt de wissel niet naadloos.

Export: H.264, geen geluid, faststart, elk bestand liefst onder 3 MB (result.mp4 onder 4 MB). De staande
versies en result.mp4 met veel keyframes (elke 12 frames) en zonder B-frames: dan kloppen de tijdstempels
exact met het origineel (eerste frame op 0:00) en loopt het scrubben soepel. Met ffmpeg bijvoorbeeld:

```
ffmpeg -i staand.mp4 -vf "scale=720:1280" -c:v libx264 -preset slow -b:v 1.9M -maxrate 2.2M -bufsize 4M \
  -g 12 -bf 0 -pix_fmt yuv420p -an -movflags +faststart opening-9x16-720.mp4
```

Gebruik alleen eigen beeld of materiaal met een licentie die dit toestaat.

## Posters

Maak de poster van het eerste frame zoals de browser het rendert (video op 0:00 in een canvas tekenen
en als WebP opslaan). Een PNG uit een videotool heeft vaak een BT.709-kleurprofiel en wordt in de browser
dan lichter getoond dan de video zelf.

## Scène 3 (Fundament): villa-tour in WebGL

De hero van de voorbeeldsite in scène 3 is een cinematische tour in WebGL (`/villa.js`, Three.js r170 via jsDelivr)
door vier fotorealistische stills in `media/villa/`, gescrubd met het scrollen (GSAP ScrollTrigger in film.js):

| Bestand | Beeld |
|---|---|
| `villa/villa-1.webp` | vanaf zee op de villa aan de kust (ook de poster zonder WebGL / bij reduced motion) |
| `villa/villa-2.webp` | op het terras aan het zwembad, richting de open pui |
| `villa/villa-3.webp` | op het dek voor de open pui, kijkend naar binnen |
| `villa/villa-4.webp` | binnen, uitzicht over het zwembad op zee |

16:9, liefst 1600 px breed, WebP onder ~250 kB per beeld. Het focuspunt en de mate van inzoomen per beeld staan
bovenaan `villa.js` (`SHOTS`).
