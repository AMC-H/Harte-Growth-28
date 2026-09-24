# Slot voor de echte video (homepage, hoofdstuk Media)

Zet hier `result.mp4` neer. `film.js` controleert bij het laden van de homepage of `/media/result.mp4` bestaat.
Zo ja, dan vervangt de video de getekende beelden in het 9:16-programmascherm en scrubt hij mee met scrollen.
Zo nee, dan blijft de getekende versie staan. Er hoeft niets aan de code te veranderen.

## Aanbevolen export

- Formaat 9:16, bijvoorbeeld 720 x 1280. Groter is niet nodig; het scherm is klein.
- Geen geluid (de video speelt altijd gedempt).
- Lengte 10 tot 20 seconden.
- Veel keyframes, anders hapert het terugspoelen tijdens het scrollen. Met ffmpeg:

```
ffmpeg -i bron.mp4 -vf "scale=720:-2" -c:v libx264 -preset slow -crf 24 \
  -g 6 -keyint_min 6 -pix_fmt yuv420p -an -movflags +faststart result.mp4
```

`-g 6` zet elke 6 frames een keyframe. Dat maakt het bestand iets groter, maar het scrubben loopt dan soepel.
Richtlijn: houd het bestand onder de 4 MB.

Gebruik alleen eigen beeld of materiaal met een licentie die dit toestaat.
