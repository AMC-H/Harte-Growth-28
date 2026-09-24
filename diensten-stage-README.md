# Diensten-stage: asset-slot en `stage:progress`

De stage op `/diensten` (het Growth System) is standaard een DOM-versie: vier sporen
(Media, Fundament, Verkeer, Opvolging) die per hoofdstuk vollopen en bij Export samenkomen
in één master. Die versie kan later vervangen worden door een video, een framereeks of een
eigen renderer (bv. 3D), zonder de pagina of `diensten.js` om te bouwen.

## Het slot

In `diensten.html`, in `#systeem`:

```html
<div class="stage-slot" data-asset-src="" data-asset-type="">
  <div class="gs">…DOM-versie…</div>
</div>
```

| `data-asset-type` | `data-asset-src`                          | Gedrag |
|-------------------|-------------------------------------------|--------|
| (leeg)            | (leeg)                                    | DOM-versie blijft staan (standaard). |
| `video`           | `/media/stage.mp4`                        | Video wordt gescrubd op de totale voortgang. Encodeer met korte GOP en zonder B-frames (zoals de homepage-video's), anders hapert het scrubben. |
| `frames`          | `/media/stage/frame-{i}.webp` + `data-asset-count="120"` | `{i}` wordt `0000`, `0001`, … Getekend op een canvas; eerst elk 4e frame geladen, na `load` de rest. |
| `module`          | `/stage-3d.js`                            | ES-module met `export default function (slot) { … }`. De module luistert zelf naar `stage:progress`. |

Zolang een asset laadt blijft de DOM-versie zichtbaar. Bij reduced motion en zonder JS wordt
geen asset geladen: dan staat per hoofdstuk het statische eindbeeld van de DOM-versie.

## Het event

Op het slot-element (bubbelt) bij elke scrollupdate van een stage-hoofdstuk:

```js
slot.addEventListener('stage:progress', function (e) {
  e.detail.chapter;  // 'systeem' | 'media' | 'fundament' | 'verkeer' | 'opvolging' | 'export'
  e.detail.progress; // 0-1 binnen dat hoofdstuk
});
```

Totale voortgang over de hele stage (zoals `diensten.js` hem voor video en frames gebruikt):

```js
var ORDER = ['systeem', 'media', 'fundament', 'verkeer', 'opvolging', 'export'];
var total = (ORDER.indexOf(d.chapter) + d.progress) / ORDER.length;
```

Binnen elk hoofdstuk is de opbouw op 90% klaar; de laatste 10% is het rustpunt waar de
tijdlijn-markeringen naartoe springen. Een vervangende asset doet er goed aan hetzelfde te doen.

Na het hoofdstuk Export vervaagt de hele stage (bij `#aanbod`); daarvoor hoeft een asset niets te doen.
