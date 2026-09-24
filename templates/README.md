# Template: "Algoritme-update: [onderwerp]"

Voor je eigen duiding bij een video uit de strook "Wat verandert er in de algoritmes?" op /blog.
Bestand: `templates/algoritme-update.html` (zelfde header, footer, stijl en cookiebanner als de rest van de site).
De template zelf staat op `noindex` en komt niet in de sitemap.

## Een nieuw artikel maken

1. **Kopieer** `templates/algoritme-update.html` naar de root, bijvoorbeeld
   `blog-algoritme-google-core-update-oktober-2026.html`. De bestandsnaam zonder `.html` is de slug (`[SLUG]`).
2. **Vervang alles tussen `[ ]`** (zoek op `[`):
   - `[onderwerp]`: in `<title>`, de H1, `og:title`, `twitter:title` en `headline` in de JSON-LD.
   - `[SLUG]`: canonical, `og:url`, NL-taallink en `url`/`mainEntityOfPage` in de JSON-LD.
   - `[Meta description ...]`: 140 tot 160 tekens, ook in `og:description`, `twitter:description` en de JSON-LD.
   - `[JJJJ-MM-DD]`: publicatiedatum, in `<time datetime>`, `article:published_time` en `datePublished`.
   - `[DAG MAAND JAAR]`: dezelfde datum voluit, bijvoorbeeld `3 oktober 2026`.
   - `[VIDEO-ID]`: de 11 tekens na `watch?v=` in de YouTube-link (4 plekken in de HTML, 2 in de JSON-LD).
   - `[TITEL VAN DE VIDEO]`, `[KANAAL]`, `[DATUM VAN DE VIDEO]`, `[URL VAN DE OFFICIËLE BRON]`, `[NAAM VAN DE BRON]`.
   - De drie secties: *Wat is er veranderd*, *Wat betekent dit voor jouw bedrijf*, *Wat wij adviseren*.
3. **Verwijder** de regel `<meta name="robots" content="noindex, nofollow">` en de twee `TEMPLATE`-commentaren.
4. **Zet het artikel op /blog**: kopieer in `blog.html` een bestaande `<article class="post-card">` in
   `#post-grid`, bovenaan (nieuwste eerst), en pas datum, categorieën (`data-cats`, bijvoorbeeld `seo strategie`),
   titel, link en samenvatting aan. Voeg het ook toe aan de `blogPost`- en `ItemList`-lijst in de JSON-LD van `blog.html`.
5. **Sitemap**: voeg de URL toe aan `sitemap.xml`.
6. **Redirect** (schone URL, zoals de andere artikelen): voeg in `netlify.toml` een 301 toe van
   `/[SLUG].html` naar `/[SLUG]`.

## Regels

- Alleen video's van de officiële kanalen uit de strook (Google Search Central, Instagram, Meta for Business,
  TikTok For Business). Link altijd naar de officiële bron van de aankondiging.
- Geen beloftes over posities of resultaten. Wel: wat er verandert en wat wij adviseren.
- De video laadt pas na een klik (youtube-nocookie.com); laat de `vthumb`-opbouw daarom intact.
- Geen em dashes; gebruik komma's of punten.
