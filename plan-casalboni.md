# Piano di implementazione — demo cliente `casalboni`

> Studio Tecnico Casalboni — studio di geometra a Gambettola (FC).
> Documento di **sola pianificazione**. Nessun file di prodotto viene modificato
> finché Marco non dà l'ok esplicito ("parti"). `plan.md` non viene toccato.
>
> **Decisioni approvate** (vedi §11): accent `#2C4A52`; titoli in Inter; prop
> additive su About/Contact/SeoHead (niente componenti dedicati); `og:image`
> **omesso** per `type studio` (niente generazione card con sharp); "Telefono e
> fax" = **stesso numero** in un'unica voce + cellulare separato; "Topografia e
> rilievi" testo generico da confermare col cliente.
>
> **Consegna a due passate** (vedi §13): 1ª passata T1–T7 + `<title>`/meta
> description, poi build+deploy → link online e visitabile, **stop**. 2ª passata
> dopo ok: JSON-LD, resto di T8, T9, T10.
>
> **Vincolo di scope**: niente refactoring/generalizzazioni non strettamente
> necessarie a questo cliente. Se ne emerge la tentazione, la segnalo a Marco e
> vado avanti senza farla.
>
> **Nota skill `frontend-design`**: installata da Marco ma **non registrata in
> questa sessione** (Skill tool: "Unknown skill"; assente da liste skill/plugin).
> Serve un riavvio sessione per caricarla. Per non perdere la deadline procedo
> applicando gli stessi principi via `improve-ui`/`baseline-ui` + ragionamento,
> dentro i paletti: base/colori/font-family del repo invariati, solo accent per
> cliente. Idee visive "forti" → annotate qui, non implementate.
>
> Skill usate per impostarlo: `spec-driven-development` (struttura del piano),
> principi di `baseline-ui`/`artifact-design` per le scelte visive (la skill
> `frontend-design` citata nel brief non è installata in questo ambiente: le
> decisioni sono comunque motivate, non prese di default). I gate
> `fixing-metadata`, `fixing-accessibility`, `fixing-motion-performance` e
> `git-workflow-and-versioning` sono pianificati nelle fasi finali.

---

## 1. Obiettivo

Pubblicare `demo.zenith-studio.it/casalboni`: una pagina singola, sobria e
veloce, che presenti lo studio tecnico e i suoi servizi **senza fotografie**
(le uniche disponibili sono miniature 248×165 px, inutilizzabili). È il
confronto diretto con l'attuale sito Joomla del cliente (solo HTTP, CSS non
caricato, link rotti): la demo deve essere pulita, mobile-first, con metadati
curati e tempi di caricamento bassi.

Il peso visivo, in assenza di immagini, lo reggono **tipografia, colore,
spazio bianco e composizione**. Gli slot immagine restano previsti nel file
dati, così le foto del cliente si inseriranno senza rifare il layout.

### Criteri di successo (testabili)
- `npm run build` genera `dist/casalboni/index.html` senza configurazione manuale.
- La pagina non contiene `<img>`, stock photo, placeholder grigi o SVG decorativi.
- Telefono fisso e cellulare sono link `tel:`; l'email è `mailto:`; Facebook è un link esterno.
- Sezione Contatti con indirizzo + mappa leggera (embed keyless).
- Nessun bottone/FAB WhatsApp, nessuna sezione camere/galleria/recensioni.
- Metadati completi: `<title>`, meta description, canonical, Open Graph, favicon, JSON-LD del tipo giusto.
- Contrasto AA su testo e CTA; focus visibile; navigazione da tastiera; niente CLS.
- Animazioni solo fade-allo-scroll + hover card, rispettose di `prefers-reduced-motion`.

---

## 2. Come funziona il repo oggi (baseline architetturale)

- **Dati**: un JSON per cliente in `src/content/clients/<slug>.json`. Lo slug è il
  nome file = id della entry = route. Schema Zod in
  [src/content.config.ts](src/content.config.ts). I file `_*.json` sono esclusi
  dal loader.
- **Rotta**: [src/pages/[slug].astro](src/pages/[slug].astro) con `getStaticPaths()`
  che emette una pagina per ogni JSON. Ogni sezione è renderizzata **solo se ha
  dati** (`hasAbout`, `hasRooms`, …): una demo non si rompe per un campo mancante.
  Ordine attuale: Hero → About → Rooms → Gallery → Reviews → Location → Contact →
  StickyWhatsApp.
- **Layout**: [src/layouts/BaseLayout.astro](src/layouts/BaseLayout.astro) —
  `lang="it"`, `viewport`, `robots noindex,nofollow`, `<title>`, description,
  favicon, `theme-color`, **preload font** (Fraunces 600 + Inter 400), override
  dell'`--accent` inline sull'`<html>`, IntersectionObserver unico per il fade-up,
  footer "Zenith Studio".
- **Token/CSS**: [src/styles/global.css](src/styles/global.css) — palette calda
  (bg `#faf9f6`, testo `#211d18`, accent `#b4552d`), font **Fraunces** (serif,
  titoli) + **Inter** (sans, corpo). Classi `.btn/.btn-accent/.btn-outline`,
  `.card`, `.chip`, `.fade-up`, hover e gestione `reduced-motion` **già pronte**.
- **Componenti**: Hero (**richiede immagine**, overlay scuro), About (titolo
  hardcoded "La struttura" + Amenities a chip), Rooms/Gallery/Reviews (B&B),
  Location (**embed Google Maps keyless**, riusabile), Contact (phone `tel:`,
  email `mailto:`, whatsapp, luogo, check-in/out — **un solo campo telefono**),
  SeoHead (canonical, OG, Twitter, **JSON-LD hardcoded `LodgingBusiness`** +
  **genera sempre un'OG image da foto/placeholder**), StickyWhatsApp (solo se
  `whatsapp` presente), Section (wrapper fade-up), Amenities (chip B&B).
- **Immagini**: [src/lib/images.ts](src/lib/images.ts) — `resolveClientImage()`
  torna un **placeholder fotografico** quando manca il file.
- **Deploy**: [.github/workflows/deploy.yml](.github/workflows/deploy.yml) —
  build con `withastro/action@v3` e deploy su GitHub Pages **al push su `main`**.
  `public/CNAME` = `demo.zenith-studio.it`; nessun `base` (le route restano
  `/<slug>`); `robots.txt` = `Disallow: /` + meta noindex (demo non indicizzate).

---

## 3. Dove l'architettura attuale NON regge un cliente senza immagini / non-B&B

Punti in cui serve intervenire (motivazione della lista di file al §6):

1. **Hero pretende un'immagine.** `resolveClientImage` ripiega su un placeholder
   fotografico e l'Hero costruisce un overlay scuro per rendere leggibile il
   testo bianco. Senza foto → placeholder grigio/finto. → serve un **Hero
   testuale** (nuovo componente), non l'Hero fotografico.
2. **About ha il titolo "La struttura"** e monta le Amenities a chip: vocabolario
   da B&B. Per uno studio serve "Chi siamo" e **niente chip amenities**.
3. **Manca del tutto un modello "servizi".** Amenities è una fila di chip con
   icona, non card con titolo+descrizione. Serve un **componente Servizi (griglia
   di card)** e un campo `services` nello schema.
4. **Contact ha un solo telefono** e nessuno slot per cellulare, P.IVA, social.
   Il cliente ha una linea "Telefono e fax" (**stesso numero**, 0547 54095) +
   cellulare + P.IVA + Facebook.
5. **SeoHead è cablato su `LodgingBusiness`** (con logica prezzi/rating da B&B) e
   **genera sempre un'OG image** dalla hero/placeholder. Per uno studio serve
   JSON-LD `ProfessionalService` e **niente `og:image`** (deciso: omesso finché
   non arriva una foto reale — vedi §7.3).
6. **Il preload font** assume titoli in Fraunces. Se i titoli dello studio vanno
   in Inter (vedi §4), va spostato il preload per non scaricare un font inutile
   (impatta LCP).
7. **Nessun campo discrimina il tipo di sito.** Serve il campo `type` (richiesto
   nel brief) che guidi rotta, JSON-LD e preload.

---

## 4. Scelte visive proposte (motivate)

Vincolo di sistema: nel repo **l'unica personalizzazione per-cliente è
l'`--accent`** (iniettato inline da BaseLayout). Aggiungo un solo interruttore
strutturale — il campo `type` — che pilota poche regole scoped, senza
rifattorizzare i componenti condivisi né aggiungere font.

### 4.1 Palette
Mantengo i **token base caldi** del sistema (bg `#faf9f6`, superficie `#ffffff`,
testo `#211d18`, muted `#6b6259`, bordo `#e7e2da`). Motivo: sono già ad alto
contrasto, "puliti" e veloci, e un neutro caldo comunica affidabilità/accoglienza
senza scivolare nel corporate freddo — utile a **distanziare** la demo dal
Joomla grigio e rotto del cliente. Cambiarli richiederebbe un tema per tipo
(refactoring evitabile).

Il carattere "tecnico e sobrio" lo dà **l'accent**, che qui sostituisco al
terracotta da hospitality con un **petrolio/ardesia profondo**:

- **Accent (deciso): `#2C4A52`** (petrolio-ardesia). Serietà, precisione, calma.
  - Testo/icone accent su bianco: **contrasto ≈ 9.5:1** (AAA).
  - `readableFg()` sceglie **bianco** come foreground sull'accent → testo bianco
    su `#2C4A52` ≈ **9.5:1** (AAA). CTA leggibilissime.

Neutro caldo + accent freddo = accostamento bilanciato e professionale, non
generico. `theme-color` seguirà l'accent (già gestito da BaseLayout).

### 4.2 Coppia di font
Zero nuovi asset: il repo self-hosta **Fraunces** (400/600) e **Inter**
(400/500/600). Scelta reale a costo nullo:

- **Titoli in Inter 600, corpo in Inter 400/500.** Voce sans, tecnica, senza
  fronzoli — coerente con uno studio tecnico. Fraunces (serif display) porterebbe
  un tono editoriale/boutique fuori registro. Inter 600 è già presente, quindi
  **nessun file font aggiuntivo**.
- Attuazione senza toccare i componenti condivisi: `type: "studio"` →
  `data-type="studio"` sull'`<html>` → un blocco CSS scoped che rimappa
  `--font-serif` a Inter **solo per quel tipo**. I `<h1>/<h2>/<h3>` restano
  coerenti su tutta la pagina, anche nei componenti riusati (About, Contact,
  Location). Una regola, additiva, reversibile.
- Conseguenza sul preload: per `type studio` si precarica **Inter 600** al posto
  di Fraunces 600 (vedi §6, BaseLayout).

### 4.3 Scala tipografica (mobile-first)
Base 16px, `line-height` corpo 1.65 (già impostato), titoli 1.12 tight (già).

| Ruolo | Mobile | Desktop | Peso | Note |
|---|---|---|---|---|
| Eyebrow/overline | 0.8rem | 0.8rem | 500 | maiuscoletto, `tracking-wider`, muted |
| H1 Hero | ~2.25rem (36px) | ~3.75rem (60px) | 600 | `text-4xl → md:text-6xl` |
| H2 sezione | 1.875rem (30px) | 2.25rem (36px) | 600 | `text-3xl md:text-4xl` (come i condivisi) |
| H3 card servizio | 1.25rem (20px) | 1.25rem | 600 | Inter |
| Corpo | 1rem | 1.0625–1.125rem | 400 | muted per il secondario |
| Meta/etichette | 0.9rem | 0.9rem | 500 | contatti, P.IVA |

### 4.4 Composizione (come si regge senza foto)
- **Hero testuale**: fascia alta a piena larghezza, fondo `--surface` o accent
  molto tenue (`color-mix`), **eyebrow** ("Studio Tecnico · Geometra") → **H1**
  (nome studio) → riga titolare (Geom. Luciano Casalboni) → **tagline** breve →
  **CTA**: "Chiama" (`tel:` fisso) e "Scrivici" (`mailto:`). Niente immagine,
  niente overlay. Altezza contenuta (no `min-h-85svh` da hero fotografico):
  l'obiettivo è portare subito ai servizi. Un filo/linea accent come elemento
  grafico, non un'illustrazione.
- **Ritmo verticale**: bande alternate `bg` / `--surface` (pattern già in uso)
  per separare le sezioni senza immagini.
- **Servizi**: griglia di card (1 col mobile → 2 → 3 desktop). Ogni card:
  numeretto o icona lineare *minima* (dal set Lucide già presente, **funzionale
  non decorativa**), titolo H3, 1–2 righe. Hover: lift + ombra (già in `.card`).
- **Spazio bianco** generoso (`py-16 md:py-24`, come le sezioni esistenti) e
  larghezza di lettura contenuta (`max-w-2xl/3xl`) per far respirare il testo.

---

## 5. Struttura della pagina (sezioni, in ordine)

Per `type: "studio"` la rotta rende:

1. **Hero testuale** — eyebrow, nome studio, titolare, tagline, CTA Chiama + Email.
2. **Chi siamo** — 2–3 paragrafi scorrevoli (bozza al §10).
3. **Servizi** — griglia di 9 card (bozza al §10).
4. **Dove siamo** — indirizzo + mappa embed keyless (componente Location riusato).
5. **Contatti** — fisso (`tel:`), cellulare (`tel:`), fax, email (`mailto:`),
   indirizzo, P.IVA, Facebook.
6. **Footer** — "Zenith Studio" (da BaseLayout).

Non renderizzate: Rooms, Gallery, Reviews, Amenities, StickyWhatsApp, bottone
Prenota. (Vengono naturalmente saltate perché i relativi campi restano assenti;
Hero e About sono gli unici che richiedono una diramazione esplicita per `type`.)

---

## 6. File creati / modificati (percorsi esatti)

### Creati
- **`src/content/clients/casalboni.json`** — file dati del cliente (via
  `npm run new-client casalboni`, poi compilato). Include `type: "studio"`,
  contenuti, e **slot immagine vuoti** (`heroImage: ""`, eventuale
  `services[].image: ""`) per il futuro inserimento foto.
- **`src/components/HeroText.astro`** — Hero **senza immagine** (eyebrow, H1,
  titolare, tagline, CTA `tel:`/`mailto:`). Nuovo perché l'Hero esistente è
  strutturalmente legato a una foto + overlay.
- **`src/components/Services.astro`** — griglia di card servizio
  (`{ title, description, image? }`). Genuinamente mancante.

### Modificati (additivi, retro-compatibili)
- **`src/content.config.ts`** — aggiunta allo schema:
  - `type: z.enum(['lodging', 'studio']).default('lodging')` — **il discriminante** richiesto.
  - `services: z.array(z.object({ title: z.string(), description: z.string().optional(), image: z.string().optional() })).optional()`
  - `mobile`, `vat` (P.IVA), `facebookUrl` — tutti opzionali. **Nessun campo
    `fax` separato**: il fax coincide col fisso (stesso numero), reso come
    un'unica voce "Telefono e fax" a partire da `phone`.
  - `heading` non serve nello schema (lo passo come prop dalla rotta).
  - I campi B&B restano invariati: i clienti esistenti non cambiano di un byte.
    (Nota: non c'è nessun cliente lodging reale in questo repo — La Villa vive in
    un altro repo — ma le modifiche restano additive per non introdurre regressioni.)
- **`src/pages/[slug].astro`** — diramazione su `type`:
  - `studio` → `HeroText` + About(`heading="Chi siamo"`, senza amenities) +
    `Services` + Location + Contact(campi studio). Nessun Rooms/Gallery/Reviews/Sticky.
  - default (`lodging`) → **comportamento attuale invariato**.
- **`src/layouts/BaseLayout.astro`** — nuova prop `type`; imposta
  `data-type={type}` sull'`<html>`; **preload condizionale** del peso titolo
  (studio → `inter-latin-600`; lodging → `fraunces-latin-600` come ora).
- **`src/styles/global.css`** — un blocco scoped
  `:root[data-type="studio"] { --font-serif: var(--font-sans); }` (titoli in
  Inter) più eventuali micro-regole del solo Hero testuale. Nessuna modifica ai
  default esistenti.
- **`src/components/About.astro`** — aggiunta prop opzionale `heading`
  (default `"La struttura"`): backward-compatible (deciso: prop additiva, niente
  componente dedicato).
- **`src/components/Contact.astro`** — props opzionali `mobile`, `vat`,
  `facebookUrl` rese come `tel:`/link, additive. La voce telefono viene resa con
  etichetta **"Telefono e fax"** (stesso numero); il cellulare è una **voce
  separata** anch'essa `tel:` (deciso: prop additive, niente `StudioContact`).
- **`src/components/SeoHead.astro`** — JSON-LD guidato da `type`: `studio` →
  `ProfessionalService` (name, description, url, address, telephone, email,
  areaServed), **senza** i campi `LodgingBusiness`/prezzi/rating e **senza
  `og:image`** (vedi §7.3).

> Nota sul confine coi componenti B&B: **Rooms, Gallery, Reviews, Amenities,
> StickyWhatsApp non vengono toccati.** Le modifiche a About/Contact/SeoHead sono
> additive e lasciano invariato il rendering dei clienti lodging.

---

## 7. Build & deploy — verifica dello slug

### 7.1 Il build genera `/casalboni` senza configurazione manuale?
**Sì.** `getStaticPaths()` mappa ogni JSON in `src/content/clients/` su una
route con `params.slug = id`. Aggiungere `casalboni.json` fa emettere
`dist/casalboni/index.html`. Nessun `base` in `astro.config.mjs` → l'URL resta
`/casalboni`. Nessuna modifica a config o workflow richiesta per la *generazione*.

Verifica pianificata: `npm install` → `npm run build` → confermare l'esistenza di
`dist/casalboni/index.html` e l'assenza di `<img>`/placeholder nell'HTML emesso.

### 7.2 Cosa serve perché `demo.zenith-studio.it/casalboni` **risponda**
Un solo punto d'attenzione, esplicito:

- **Il deploy parte solo dal branch `main`** (`on: push: branches: [main]` in
  [deploy.yml](.github/workflows/deploy.yml)). Il branch di lavoro attuale è
  `claude/beb-template-plan-9bhfpy` (default del repo), **non `main`**: un push lì
  **non** pubblica. → `casalboni.json` (e i file nuovi) devono **atterrare su
  `main`** (merge della PR, vedi §9). Fatto questo, l'Action builda e pubblica su
  Pages, e `/casalboni` risponde.
- GitHub Pages è già configurato su questo repo (il dominio è già servito):
  **nessuna modifica** a Pages, CNAME, DNS. `CNAME` e `robots.txt` già a posto.
- Nessun segreto/API key: la mappa è un embed keyless. Nessuna generazione di
  immagini a build-time (vedi §7.3), quindi niente di speciale da configurare in CI.

### 7.3 Open Graph senza foto (deciso)
SeoHead oggi genera **sempre** un'OG image dalla hero/placeholder: un placeholder
grigio come anteprima è peggio che niente. **Decisione: per `type studio` si
omette `og:image`** (e i relativi `og:image:width/height`, `twitter:image`). La
demo viene consegnata **via email**, non serve una card social; niente
generazione tipografica con sharp. Quando il cliente manderà una foto reale, lo
slot `heroImage` esiste già e si potrà riattivare l'OG image.

---

## 8. Gate di qualità (skill, prima di considerare la pagina finita)

- **`fixing-metadata`**: `<title>` es. *"Studio Tecnico Casalboni — Geometra a
  Gambettola (FC)"*; meta description ~150 caratteri (servizi + zona); canonical
  (auto da SeoHead); Open Graph/Twitter (§7.3); favicon (valutare se la casetta
  generica va bene o serve un segno neutro); `robots noindex` resta (demo).
- **`fixing-accessibility`**: contrasto AA (accent `#2C4A52` verificato ~9.5:1);
  `:focus-visible` già globale; tutti i contatti come link raggiungibili da
  tastiera; ordine heading `h1→h2→h3`; `title` sull'iframe mappa (già presente);
  **alt text** predisposto sugli slot immagine per quando verranno riempiti;
  `lang="it"` (già).
- **`fixing-motion-performance`** (se aggiungo animazioni scroll): il fade-up è
  già solo `opacity`/`transform` (compositor, niente reflow) e l'observer è unico
  in BaseLayout; l'hover card è `transform`+`box-shadow`. Verificare assenza di
  layout thrash e il rispetto di `prefers-reduced-motion` (già gestito). Niente
  scrollytelling/parallax.

---

## 9. Git workflow (`git-workflow-and-versioning`)

- Branch dedicato **da `main`** (è il branch che pubblica): `feat/casalboni-demo`.
- Commit piccoli e convenzionali, un concetto per commit, es.:
  - `feat(schema): campo type + services/contatti studio`
  - `feat(components): HeroText e Services per studio tecnico`
  - `feat(casalboni): dati e contenuti Studio Tecnico Casalboni`
  - `feat(seo): JSON-LD ProfessionalService + OG card studio`
- PR verso `main` con checklist dei gate §8 e link a questo piano. Merge → Action
  → `/casalboni` online.

---

## 10. Contenuti (bozze da rifinire con Marco/cliente)

### Chi siamo (riscrittura scorrevole)
> Lo Studio Tecnico del Geom. Luciano Casalboni, a Gambettola, segue la
> progettazione architettonica dall'idea al titolo abilitativo: prepariamo la
> pratica edilizia completa da presentare all'ufficio comunale e seguiamo il
> progetto in ogni passaggio.
>
> Ci occupiamo di nuove costruzioni civili, fabbricati artigianali e commerciali,
> edifici rurali e depositi agricoli, oltre ad ampliamenti, ristrutturazioni,
> manutenzione straordinaria e opere interne. Curiamo anche l'adeguamento e la
> realizzazione degli impianti di fognatura per acque bianche e nere.
>
> Un unico interlocutore per pratiche, catasto e cantiere, con un metodo di
> lavoro chiaro e tempi rispettati.

*(3 paragrafi; tono sobrio; da validare col cliente.)*

### Servizi (9 card)
1. **Progettazione e ristrutturazioni** — Progettazione architettonica di nuove costruzioni civili, artigianali e rurali, ampliamenti, ristrutturazioni e restauri, con pratica edilizia completa.
2. **Direzione lavori** — Coordinamento del cantiere e contabilità delle opere fino a fine lavori.
3. **Catasto** — Pratiche DOCFA, tipi mappale e di frazionamento, visure, estratti di mappa e planimetrie.
4. **Topografia e rilievi** — Rilievi topografici a supporto delle pratiche edilizie e catastali. ⚠️ *Testo ricostruito: sul sito attuale questa voce riporta per errore il testo del "Catasto". **Da confermare col cliente.***
5. **Perizie e stime** — Valutazioni di terreni e fabbricati e relazioni di conformità urbanistica.
6. **Certificazioni energetiche** — Attestati di Prestazione Energetica (APE).
7. **Calcoli strutturali** — Verifiche e calcoli per le opere strutturali.
8. **Sicurezza e formazione** — Sicurezza sui luoghi di lavoro e formazione dei lavoratori.
9. **Rendering e modellazione 3D** — Presentazione fotorealistica dei progetti.

### Dati contatto (dal brief)
- Indirizzo: Via Viole 55, int. 1 — 47035 Gambettola (FC)
- Telefono e fax: 0547 54095 · Cellulare: 393 2309508
- Email: lucianocasalboni@virgilio.it · P.IVA 03258110406
- Facebook: https://www.facebook.com/Studiotecnicolucianocasalboni

---

## 11. Decisioni prese (approvate da Marco)

1. **Accent**: `#2C4A52` (petrolio-ardesia). ✔
2. **Titoli**: Inter. ✔
3. **Modifiche ai condivisi**: prop additive su About/Contact/SeoHead, **niente
   componenti dedicati** (nessun cliente lodging reale in questo repo). ✔
4. **OG image**: **omesso** per `type studio` (consegna via email); niente card
   sharp. ✔
5. **"Topografia e rilievi"**: testo generico, **resta segnalato** come da
   confermare col cliente (vedi §10 e §12). ✔
6. **Telefono e fax**: **stesso numero** (0547 54095) → **un'unica voce
   "Telefono e fax"** con link `tel:`; **cellulare** (393 2309508) come **voce
   separata**, anch'essa `tel:`. ✔

## 12. Da confermare col cliente (contenuti/legali)
- Testo definitivo "Chi siamo" e delle 9 card.
- Voce "Topografia e rilievi".
- Foto reali (per riempire gli slot già previsti).
- Loghi/badge di certificazione: **esclusi** finché non verificati col cliente.

---

## 13. Task list (implementazione incrementale — `incremental-implementation`)

Consegna a **due passate**. Priorità: link inviabile al cliente domattina.

### 1ª passata — pagina online e visitabile (poi STOP e review di Marco)
- [x] **T1 — Schema**: campo `type` + `services` + contatti studio (`mobile`, `vat`, `facebookUrl`; nessun `fax`) in `content.config.ts`.
      *Verifica*: `npm run build` verde.
- [x] **T2 — Scheletro dati**: `npm run new-client casalboni`; `type: "studio"`, accent `#2C4A52`, dati contatto.
      *Verifica*: la entry compare in build senza errori Zod.
- [x] **T3 — HeroText.astro** + diramazione Hero nella rotta per `type studio`.
      *Verifica*: preview `/casalboni` mostra hero testuale, nessun `<img>`.
- [x] **T4 — Services.astro** + campo `services` popolato (9 card) + sezione in rotta.
      *Verifica*: griglia responsive 1→2→3 colonne; hover card.
- [x] **T5 — Chi siamo**: About con `heading="Chi siamo"`, senza amenities; testo bozza.
      *Verifica*: titolo corretto, niente chip.
- [x] **T6 — Contatti**: Location (mappa) + Contact esteso: **"Telefono e fax"** (un numero, `tel:`), **cellulare** (voce separata, `tel:`), email (`mailto:`), indirizzo, P.IVA, Facebook.
      *Verifica*: link `tel:`/`mailto:` funzionanti; mappa carica.
- [x] **T7 — Tema studio**: `data-type` in BaseLayout, CSS titoli Inter, preload font condizionale (Inter 600), accent nel JSON.
      *Verifica*: titoli in Inter; preload Inter 600; theme-color = accent.
- [x] **T8a — Metadati base**: `<title>` + meta description per casalboni (solo questi, in questa passata).
      *Verifica*: title/description corretti nell'HTML emesso.
- [x] **T11 — Build & deploy**: `npm run build` → verifica `dist/casalboni/index.html` (nessun `<img>`); branch da `main`, PR, merge → Action pubblica.
      *Verifica*: `demo.zenith-studio.it/casalboni` risponde. **→ STOP, mostro il link a Marco.**

### 2ª passata — dopo l'ok di Marco
- [x] **T8b — SEO completo**: SeoHead JSON-LD `ProfessionalService` (senza `og:image`); resto del gate `fixing-metadata` (canonical, OG/Twitter coerenti con l'assenza di immagine, favicon).
- [x] **T9 — A11y**: gate `fixing-accessibility` (contrasto, focus, tastiera, heading order, alt slot immagine).
- [x] **T10 — Motion**: gate `fixing-motion-performance` (fade/hover, reduced-motion).

---

## 14. Aggiornamenti dopo il piano (fatti in corso d'opera, su richiesta di Marco)

Modifiche decise **dopo** la stesura del piano; alcune ribaltano scelte dei §7.3/§11:

- **Passata premium/editoriale**: hero come **fascia piena accent** (poi ingrandita
  a `min-h-86svh` con overlay direzionale), titoli Inter, contrasto corpo alzato
  (`--muted` scuro solo per studio, ~8.8:1).
- **Navigazione**: **header sticky** con wordmark + **Chiama** e **menu hamburger**
  a tendina (a ogni larghezza), smooth-scroll alle sezioni, ombra header allo scroll.
- **Numerazione rimossa** (01–04 / 01–09) — non è una vera sequenza.
- **Immagini aggiunte** (stock Unsplash, in attesa delle foto reali del cliente):
  texture blueprint nell'hero + foto **edificio in costruzione** nel "Chi siamo".
  → Questo **ribalta** la decisione §7.3: con una `heroImage` presente, l'**`og:image`
  torna attivo** (usa la foto hero). Slot pronti per le foto reali (§12).
- **Micro-animazioni**: fade/stagger allo scroll, hover, tutte compositor-only e
  rispettose di `prefers-reduced-motion`.

## Stato finale

**Completato e pubblicato.** Entrambe le passate mergiate su `main` via PR
(#5 e #6); deploy GitHub Pages riuscito. Sito **online** e verificato:
`https://demo.zenith-studio.it/casalboni/` (HTTP 200).

Restano aperti solo i punti **§12 — da confermare col cliente** (testi definitivi,
voce "Topografia e rilievi", foto reali, loghi/certificazioni).
