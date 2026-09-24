# Video's op de homepage

| Bestand | Waar | Maat |
|---|---|---|
| `opening-16x9-1280.mp4` / `-960.mp4` | Opening, liggend (ruw materiaal). 960 op mobiel. | 1280x720 / 960x540 |
| `opening-9x16-720.mp4` / `-540.mp4` | Opening na de eerste scroll, en het resultaat in Media. 540 op mobiel. | 720x1280 / 540x960 |
| `opening-*.webp` | Posters (eerste frame). De 16:9-poster wordt vooraf geladen. | idem |

De 9:16-video's laden pas na de eerste render. Beide video's zijn even lang en lopen synchroon
(bij de wissel neemt de ene de `currentTime` van de andere over).

## Vervangen

Houd dezelfde bestandsnamen aan, of pas de paden aan in `index.html` (hoofdstuk Opening en Media).
Liggend en staand moeten exact even lang zijn en de staande versie moet de middelste 9:16-strook
van de liggende zijn, anders loopt de wissel niet naadloos.

Export: H.264, geen geluid, faststart, elk bestand liefst onder 3 MB. De staande versies met veel
keyframes (elke 12 frames), want Media spoelt er met scrollen doorheen. Met ffmpeg bijvoorbeeld:

```
ffmpeg -i staand.mp4 -vf "scale=720:1280" -c:v libx264 -preset slow -b:v 1.9M -maxrate 2.2M -bufsize 4M \
  -g 12 -pix_fmt yuv420p -an -movflags +faststart opening-9x16-720.mp4
```

Gebruik alleen eigen beeld of materiaal met een licentie die dit toestaat.
