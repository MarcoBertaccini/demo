# plan.md — Template demo per strutture ricettive in Romagna

Repo di **Zenith Studio** (zenith-studio.it). Un solo template statico da cui
escono tutte le demo per i prospect. Ogni demo è lo stesso template con un
diverso file di dati cliente. Questo documento è il piano: struttura, schema
dati, milestone e decisioni aperte. **Nessun codice finché non è approvato.**

---

## 1. Obiettivo e principio guida

Costruire un unico template vetrina per B&B, affittacamere e agriturismi, e
usarlo per generare demo personalizzate da mandare ai prospect prima della
vendita.

**Principio non negoziabile — il test del cronometro.** Da "ho i dati del
prospect" a "ho il link della demo online" devono passare **≤ 30 minuti**, di
cui **zero minuti dentro i componenti**. Tutto ciò che cambia tra un cliente e
l'altro vive in **un solo file di dati**. Se una personalizzazione richiede di
aprire un componente `.astro`, il design è sbagliato e va corretto il design,
non la demo.

Corollari operativi:

- Un solo template. Nessuna variante di layout.
- Ogni sezione regge con dati mancanti (degrada, non si rompe).
- L'unica personalizzazione visiva per cliente è `accent` (un colore).
- Il file dati non pilota mai la logica delle animazioni o del layout: decide
  solo *cosa* mostrare, mai *come* si comporta.

---

## 2. Stack e vincoli tecnici

| Scelta | Decisione |
|---|---|
| Framework | **Astro 5**, output `static`, **Content Layer API**. |
| Stile | **Tailwind CSS v4** via **`@tailwindcss/vite`** (l'integrazione `@astrojs/tailwind` è deprecata su Astro 5). Config CSS-first, nessun `tailwind.config`. |
| Immagini | Foto sotto `src/assets/clients/<slug>/`, referenziate **per nome** dal JSON, risolte con `import.meta.glob` eager e ottimizzate con `astro:assets` (`<Image>`). |
| Deploy | **GitHub Pages** + GitHub Actions (`withastro/action`), build al push su `main`. |
| Dominio | `demo.zenith-studio.it` via `public/CNAME`. `site` = dominio custom, **nessun `base`**, così le route `/<slug>` non hanno prefissi. |
| Dipendenze | Solo `astro`, `tailwindcss` + `@tailwindcss/vite`, `sharp` (usato da `astro:assets`). Nient'altro senza giustificazione. |
| Repo/hosting | Account personale `MarcoBertaccini`, repo **pubblico**. Nessuna organizzazione per ora. |

**Perché Astro e non altro.** Astro dà output statico puro, zero JS di default
per pagina (mandiamo solo il piccolo IntersectionObserver e lo sticky WhatsApp),
content collections + zod già integrati per validare i dati cliente, e
ottimizzazione immagini nativa. Copre tutti i requisiti senza aggiunte. Non
vedo ragioni per deviare dalla default: la confermo.

**Font — DECISO: Fraunces (titoli) + Inter (testo), self-hosted.** Niente CDN,
niente dipendenza npm: i `.woff2` stanno in `public/fonts/`, dichiarati con
`@font-face`. **Subset `latin`**, **solo i pesi effettivamente usati** (niente
variable font completa) per tenere il peso basso:

- **Titoli (serif):** *Fraunces* — serif moderna e calda, editoriale su foto
  grandi. Fallback: `Georgia, serif`.
- **Testo (sans):** *Inter* — neutra, leggibilissima da mobile. Fallback:
  `system-ui, -apple-system, sans-serif`.

I pesi esatti (es. Fraunces 400/600, Inter 400/500/600) si fissano in M2 quando
il design definisce la scala tipografica; in M1 non si carica ancora nessun font.

**Palette base (neutra chiara, warm).** Definita come CSS custom properties;
`accent` è l'unica sovrascritta per cliente.

```
--bg        #FAF9F6   sfondo (bianco caldo)
--surface   #FFFFFF   card, superfici sollevate
--text      #211D18   testo principale
--muted     #6B6259   testo secondario / didascalie
--border    #E7E2DA   bordi sottili, divisori
--accent    <cliente> default #B4552D (terracotta romagnola)
--accent-fg #FFFFFF   testo sopra accent
```

`accent` è iniettato come `style="--accent: …"` sul `<html>` o sul wrapper di
pagina, così tutte le CTA e i dettagli lo ereditano senza toccare i componenti.

---

## 3. Struttura del repo

```
demo/
├── astro.config.mjs          # site, @tailwindcss/vite, output static
├── tsconfig.json
├── package.json
├── plan.md
├── README.md
├── .gitignore
├── scripts/
│   └── new-client.mjs        # npm run new-client <slug>
├── public/
│   ├── CNAME                 # demo.zenith-studio.it
│   └── fonts/                # .woff2 self-hosted (da M2)
├── src/
│   ├── content.config.ts     # Content Layer: loader glob() + schema zod
│   ├── content/
│   │   └── clients/
│   │       ├── _template.json    # tutti i campi vuoti, base per new-client
│   │       └── <slug>.json       # un file per cliente (lo slug = nome file)
│   ├── assets/
│   │   ├── placeholder/          # immagini neutre di fallback (astro:assets)
│   │   └── clients/
│   │       └── <slug>/           # foto del cliente, ottimizzate a build
│   ├── styles/
│   │   └── global.css            # @import "tailwindcss"; tokens/palette
│   ├── components/                # (da M2)
│   │   ├── Hero.astro
│   │   ├── About.astro           # "La struttura" + amenities
│   │   ├── Rooms.astro
│   │   ├── Gallery.astro
│   │   ├── Reviews.astro         # "Dicono di noi"
│   │   ├── Location.astro        # "Dove siamo" + mappa
│   │   ├── Contact.astro
│   │   ├── StickyWhatsApp.astro  # bottone fisso mobile
│   │   ├── Section.astro         # wrapper con fade-up (IntersectionObserver)
│   │   └── SeoHead.astro         # meta, OG, JSON-LD, noindex, lang
│   ├── layouts/
│   │   └── BaseLayout.astro
│   ├── lib/
│   │   ├── images.ts             # risoluzione immagini + placeholder
│   │   └── whatsapp.ts           # costruzione link wa.me (da M2)
│   └── pages/
│       └── [slug].astro          # genera una pagina per ogni cliente
└── .github/workflows/deploy.yml
```

**Routing.** `src/pages/[slug].astro` usa `getStaticPaths()` sulla collection
`clients`: ogni file JSON → una route `/<slug>`. Lo **slug è l'`id` della entry**
(nome del file senza estensione), non un campo del JSON.

**Nessuna pagina indice in produzione.** L'elenco delle demo **non** deve finire
nel build su Pages: la root non elenca i clienti. Se serve un indice comodo in
sviluppo, esiste solo in dev (es. reso da una pagina che ritorna 404 in
`import.meta.env.PROD`, oppure non esiste affatto). Deciso in M2/M3; in M1 non
c'è nessuna `index`.

---

## 4. Schema dati cliente (content collection + zod)

Un file per cliente: `src/content/clients/<slug>.json`. Validato a build time
con la **Content Layer API** e il loader `glob()`. **Lo `slug` è il nome del
file** (l'`id` della entry), quindi **non** è un campo del JSON: l'unico campo
obbligatorio dentro il JSON è **`name`**. Tutto il resto è opzionale e ogni
sezione degrada da sola.

```ts
// src/content.config.ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const clients = defineCollection({
  loader: glob({ pattern: '[!_]*.json', base: './src/content/clients' }),
  schema: z.object({
    // niente `slug`: deriva dall'id della entry (nome file)
    name: z.string(),                       // UNICO OBBLIGATORIO
    tagline: z.string().optional(),
    description: z.array(z.string()).optional(),  // 2-3 paragrafi

    address: z.string().optional(),
    city: z.string().optional(),
    phone: z.string().optional(),
    whatsapp: z.string().optional(),        // numero E.164, es. 393401234567
    email: z.string().email().optional(),

    bookingUrl: z.string().url().optional(),
    googleMapsUrl: z.string().url().optional(),

    heroImage: z.string().optional(),       // nome file in clients/<slug>/
    gallery: z.array(z.string()).optional(),

    rooms: z.array(z.object({
      name: z.string(),
      description: z.string().optional(),
      priceFrom: z.number().optional(),     // €/notte
      image: z.string().optional(),
    })).optional(),

    reviews: z.array(z.object({
      author: z.string(),
      text: z.string(),
      rating: z.number().min(1).max(5).optional(),
      source: z.enum(['Google', 'Booking']).optional(),
    })).optional(),

    amenities: z.array(z.string()).optional(),  // vedi set controllato sotto

    checkIn: z.string().optional(),         // es. "15:00"
    checkOut: z.string().optional(),        // es. "10:00"

    accent: z.string().optional(),          // hex, default #B4552D
  }),
});
```

**Amenities — set controllato con icone.** Per avere un'icona coerente per ogni
servizio senza toccare componenti, `amenities` accetta stringhe da un
vocabolario noto (`wifi`, `parcheggio`, `colazione`, `animali`, `piscina`,
`aria-condizionata`, `climatizzazione`, `giardino`, `parcheggio-privato`, …).
Una mappa `slug servizio → { icona, etichetta }` vive nel template; un valore
fuori vocabolario mostra un'icona generica e la stringa così com'è. Il set
finale lo fissiamo in M2 sui servizi realmente ricorrenti in Romagna.

### Regole di degradazione (una per sezione)

| Manca | Comportamento |
|---|---|
| `rooms` vuoto/assente | Sezione **Camere** non renderizzata. |
| `gallery` vuota | Sezione **Galleria** non renderizzata. |
| `reviews` vuote | Sezione **Dicono di noi** non renderizzata. |
| Una foto (hero/camera) | **Placeholder neutro** da `public/placeholder/`. |
| `bookingUrl` assente | CTA "Prenota" nascosta; resta solo **WhatsApp**. |
| `whatsapp` assente | Sticky WhatsApp e CTA WhatsApp nascoste; fallback su telefono/email se presenti. |
| `address`/`googleMapsUrl` assenti | Sezione **Dove siamo** senza mappa (solo testo) o non renderizzata. |
| `description` assente | Sezione **La struttura** mostra solo amenities, o sparisce se anche quelle mancano. |
| `accent` assente | Default `#B4552D`. |

Principio: **non deve mai esistere una demo rotta per un campo mancante.**

---

## 5. Sezioni della pagina (ordine fisso)

1. **Hero** — foto grande, `name`, `tagline`, CTA "Scrivici su WhatsApp" +
   "Prenota" (Booking, se presente).
2. **La struttura** — `description`, `amenities` con icone.
3. **Camere** — card: foto, nome, descrizione breve, "da X €/notte".
4. **Galleria** — griglia di foto.
5. **Dicono di noi** — fino a 3 recensioni con autore, testo, rating, fonte.
6. **Dove siamo** — mappa Google embed dall'indirizzo + testo "come arrivare".
7. **Contatti** — telefono, WhatsApp, email, indirizzo, orari check-in/out.

Più: **bottone WhatsApp fisso** in basso a destra, visibile su mobile.

**Mappa senza API key.** L'embed Google Maps usa la URL pubblica
`https://www.google.com/maps?q=<indirizzo o coordinate>&output=embed` in un
`<iframe loading="lazy">`, oppure il `googleMapsUrl` fornito dal cliente. Zero
chiavi, zero costi, zero backend.

---

## 6. Design e animazioni

**Eleganza per tipografia, spazio e foto grandi — non per effetti.**
Mobile-first: il proprietario aprirà il link dal telefono dentro WhatsApp, lì
deve essere perfetto. Coppia serif/sans come sopra, palette neutra chiara,
`accent` solo su CTA e dettagli.

**Animazioni — generiche, identiche per ogni cliente, mai pilotate dai dati:**

- **Fade-up delle sezioni** all'ingresso nel viewport: CSS + un unico
  `IntersectionObserver` condiviso (`Section.astro`). Nessuna libreria.
- **Hover** su card e bottoni (transizioni CSS leggere).
- **Transizione leggera** sulle immagini di galleria (fade/zoom minimo su hover).
- **`prefers-reduced-motion: reduce`** rispettato: le animazioni si azzerano,
  il contenuto resta immediatamente visibile.

Nessuno scrollytelling, nessuna animazione legata al contenuto, nessuna libreria
di animazione.

---

## 7. Demo vs. sito vero (cose economiche, subito)

- **`noindex`**: `<meta name="robots" content="noindex,nofollow">` su tutte le
  demo. (Al passaggio su dominio proprio si toglie.)
- **Footer discreto**: "Anteprima realizzata da Zenith Studio · zenith-studio.it".
- **`lang="it"`** sull'`<html>`.
- **Meta** `title` / `description` dai dati cliente.
- **OG image** = `heroImage`.
- **JSON-LD `LodgingBusiness`** con nome, indirizzo, telefono, immagini,
  eventuale aggregateRating dalle recensioni.

Tutto in `SeoHead.astro`, alimentato dal file dati.

---

## 8. Tooling

**`npm run new-client <slug>`** (`scripts/new-client.mjs`, solo Node built-in):

1. Copia `src/content/clients/_template.json` → `src/content/clients/<slug>.json`
   con `slug` già valorizzato e tutti gli altri campi vuoti/omessi.
2. Crea la cartella immagini `public/clients/<slug>/` (con un `.gitkeep`).
3. Stampa i prossimi passi (dove mettere le foto, come vedere l'anteprima).

**README finale** ("Come creare una demo in 30 minuti"): procedura passo-passo,
scritta per Marco tra due mesi che non ricorda nulla. Consegnato in M4.

---

## 9. Deploy

- `.github/workflows/deploy.yml`: `withastro/action` → build → deploy su Pages,
  trigger su push a `main`.
- `public/CNAME` con `demo.zenith-studio.it`.
- `astro.config.mjs`: `site: 'https://demo.zenith-studio.it'`, `output: 'static'`,
  **nessun `base`**.
- DNS: record `CNAME` `demo` → `<utente>.github.io`, HTTPS "Enforce" attivo in
  Pages. (Passaggio manuale una tantum, documentato in M3.)

**Passaggio a dominio proprio (solo predisposizione, per ora ignorato).** Quando
un cliente compra, il suo `<slug>.json` + `public/clients/<slug>/` vengono
spostati su un repo/deploy dedicato con il suo dominio. Il template è
già `site`-agnostico (dipende solo da `Astro.site`), quindi il passaggio non
richiede modifiche ai componenti. Nessuna struttura costruita adesso per questo.

---

## 10. Milestone (un PR per milestone, piccolo, build verde)

- **M1 — Scaffold.** Progetto Astro+Tailwind, schema zod, `config.ts`, route
  `[slug]`, `new-client`, `_template.json`, un cliente finto (`esempio.json`)
  con dati completi. Build verde. Nessuna sezione ancora curata: basta che
  compili e mostri i dati.
- **M2 — Sezioni + degradazione.** Tutte e 7 le sezioni + sticky WhatsApp,
  con gestione completa dei campi mancanti (tabella §4). Design, font, palette,
  animazioni, `prefers-reduced-motion`. Controllo accurato su mobile. Un
  secondo cliente finto con **dati volutamente bucati** per testare la
  degradazione.
- **M3 — Deploy.** Workflow GitHub Actions + Pages, `CNAME`, DNS,
  `demo.zenith-studio.it` funzionante in **HTTPS**.
- **M4 — README "demo in 30 minuti"** + SEO/JSON-LD rifiniti. Poi la **prima
  demo vera**.

Regola: **M2 non parte finché M1 non è mergiato.** Ogni PR resta piccolo.

---

## 11. Non-goal (non proporli, non prepararne la struttura)

Backend, area riservata, gestione prenotazioni, pagamenti, multi-template,
multilingua, blog, form di contatto server-side (il contatto è
WhatsApp/telefono/mail), dark mode, CMS.

---

## 12. Decisioni prese e ancora aperte

**Prese** (risposte del 2026-08-27):

1. **Immagini — strada (a).** Foto sotto `src/assets/clients/<slug>/`,
   referenziate per nome dal JSON, risolte con `import.meta.glob` eager e
   ottimizzate con `astro:assets`. Lo script `new-client` crea quella cartella.
2. **Font — Fraunces (titoli) + Inter (testo)**, self-hosted, subset `latin`,
   solo i pesi usati (niente variable font completa).
3. **Repo — account personale `MarcoBertaccini`, pubblico.** Nessuna
   organizzazione per ora.
4. **Content Layer API** (Astro 5): `src/content.config.ts` con loader `glob()`
   sui JSON. Niente `type: 'content'`.
5. **Slug dal nome file**, non nel JSON. Nel JSON obbligatorio solo `name`.
6. **Nessuna pagina indice in produzione**: la root del build non elenca i
   clienti (indice eventuale solo in dev).
7. **Tailwind v4** via `@tailwindcss/vite` (non `@astrojs/tailwind`, deprecato
   su Astro 5).

**Ancora aperte:**

- **Set definitivo delle amenities** con icone: da fissare in M2 sui servizi
  realmente ricorrenti in Romagna.
- **Pesi tipografici esatti** di Fraunces/Inter: da fissare in M2 con la scala
  del design.
