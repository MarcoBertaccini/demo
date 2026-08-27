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
| Framework | **Astro**, output `static`. |
| Stile | **Tailwind CSS** (via `@astrojs/tailwind`). |
| Immagini | Integrazione immagini di Astro (`astro:assets`). |
| Deploy | **GitHub Pages** + GitHub Actions (`withastro/action`), build al push su `main`. |
| Dominio | `demo.zenith-studio.it` via `public/CNAME`. `site` = dominio custom, **nessun `base`**, così le route `/<slug>` non hanno prefissi. |
| Dipendenze | Solo Astro, Tailwind, integrazione immagini. Nient'altro senza giustificazione. |

**Perché Astro e non altro.** Astro dà output statico puro, zero JS di default
per pagina (mandiamo solo il piccolo IntersectionObserver e lo sticky WhatsApp),
content collections + zod già integrati per validare i dati cliente, e
ottimizzazione immagini nativa. Copre tutti i requisiti senza aggiunte. Non
vedo ragioni per deviare dalla default: la confermo.

**Font (font-face self-hosted, non CDN, per performance e privacy).** Nessuna
dipendenza npm: i `.woff2` stanno in `public/fonts/` e li dichiaro con
`@font-face`. Proposta:

- **Titoli (serif):** *Fraunces* — serif moderna, calda, con un'aria
  editoriale che sta bene su foto grandi. Fallback: `Georgia, serif`.
- **Testo (sans):** *Inter* — neutra, leggibilissima da mobile. Fallback:
  `system-ui, -apple-system, sans-serif`.

(Alternativa serif più classica se Fraunces risultasse troppo caratterizzata:
*Cormorant Garamond*. Da decidere guardando la prima demo vera.)

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
├── astro.config.mjs          # site, integrazioni, output static
├── tailwind.config.mjs
├── package.json
├── plan.md
├── README.md
├── .gitignore
├── scripts/
│   └── new-client.mjs        # npm run new-client <slug>
├── public/
│   ├── CNAME                 # demo.zenith-studio.it
│   ├── fonts/                # .woff2 self-hosted
│   ├── placeholder/          # immagini neutre di fallback
│   └── clients/
│       └── <slug>/           # foto del cliente (vedi Decisione A)
├── src/
│   ├── content/
│   │   ├── config.ts         # collection "clients" + schema zod
│   │   └── clients/
│   │       ├── _template.json    # tutti i campi vuoti, base per new-client
│   │       └── <slug>.json       # un file per cliente
│   ├── components/
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
│   │   └── whatsapp.ts           # costruzione link wa.me
│   └── pages/
│       ├── index.astro           # elenco demo (interno, noindex)
│       └── [slug].astro          # genera una pagina per ogni cliente
└── .github/workflows/deploy.yml
```

**Routing.** `src/pages/[slug].astro` usa `getStaticPaths()` sulla collection
`clients`: ogni file JSON → una route `/<slug>`. `index.astro` è una pagina
interna (noindex) che elenca le demo esistenti, comoda per Zenith.

---

## 4. Schema dati cliente (content collection + zod)

Un file per cliente: `src/content/clients/<slug>.json`. Validato a build time.
**Obbligatori solo `slug` e `name`.** Tutto il resto è opzionale e ogni sezione
degrada da sola. Bozza dello schema (semantica; sintassi zod definitiva in M1):

```ts
// src/content/config.ts
const clients = defineCollection({
  type: 'content', // JSON via glob loader
  schema: z.object({
    slug: z.string(),                       // OBBLIGATORIO
    name: z.string(),                       // OBBLIGATORIO
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

## 12. Decisioni aperte

1. **Ottimizzazione immagini vs. cartella `public/`.** L'integrazione
   `astro:assets` ottimizza le immagini *importate* (da `src/`, o via
   `import.meta.glob` / helper `image()` nello schema), **non** i file serviti
   staticamente da `public/`. C'è tensione con "immagini in `public/clients/<slug>/`
   *ottimizzate*". Due strade (vedi Domanda 1): (a) spostare le foto sotto
   `src/` e referenziarle per nome dal JSON, risolte via `import.meta.glob`
   eager → ottimizzazione piena; (b) tenerle in `public/clients/<slug>/`
   servite as-is, io le pre-comprimo a mano/con uno step nello script →
   nessuna ottimizzazione a build ma workflow più semplice.
2. **Set definitivo delle amenities** con icone: da fissare in M2 sui servizi
   realmente ricorrenti in Romagna.
3. **Scelta serif definitiva** (Fraunces vs. Cormorant Garamond): da valutare
   sulla prima demo vera, in M4.

---

## Domande (max 3, tutte qui)

1. **Immagini — quale strada?** (a) foto sotto `src/` con ottimizzazione
   `astro:assets` piena (referenziate per nome dal JSON, cartella comunque
   `.../clients/<slug>/`), oppure (b) foto in `public/clients/<slug>/` servite
   così come sono, pre-compresse a mano/da script, senza ottimizzazione a
   build. La (a) rispetta meglio il tuo requisito di ottimizzazione; la (b) è
   più semplice e più vicina alla lettera del brief. Quale preferisci?

2. **Font — Fraunces come serif di default va bene**, o parti già da Cormorant
   Garamond (più classica, "da agriturismo tradizionale")?

3. **Visibilità/hosting** — il repo `demo` è pubblico e va bene per GitHub Pages
   sul piano gratuito. Confermi che l'owner resta il tuo account personale
   `MarcoBertaccini`, o vuoi spostarlo sotto un'organizzazione **Zenith Studio**
   prima di procedere con il deploy (M3)?
