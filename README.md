# demo — Template siti vetrina per strutture ricettive in Romagna

Template statico (Astro + Tailwind) di **Zenith Studio** per creare demo
personalizzate di B&B, affittacamere e agriturismi. Un solo template: quello
che cambia tra un cliente e l'altro sta **in un unico file di dati per cliente**.
Tutte le demo escono da `https://demo.zenith-studio.it/<slug>`.

---

## Come creare una demo in 30 minuti

Guida passo-passo. Non serve toccare i componenti: se ti ritrovi ad aprire un
file `.astro`, fermati — probabilmente stai cercando un dato che va nel JSON.

### 0. Una volta sola, sul tuo computer

```bash
git clone https://github.com/MarcoBertaccini/demo.git
cd demo
npm install
```

Serve **Node 20+**. Da qui in poi, per ogni nuova demo bastano i passi sotto.

### 1. Crea lo scheletro della demo (1 min)

Scegli uno `slug` (minuscole e trattini): sarà l'URL, `demo.zenith-studio.it/<slug>`.

```bash
npm run new-client villa-marina
```

Crea due cose:
- `src/content/clients/villa-marina.json` — il file dati, con tutti i campi vuoti
- `src/assets/clients/villa-marina/` — la cartella dove mettere le foto

### 2. Metti le foto (5 min)

Copia le foto del cliente in `src/assets/clients/villa-marina/`. Nomi liberi
(es. `hero.jpg`, `camera1.jpg`, `g1.jpg`…): li richiami per nome dal JSON.
Vengono ottimizzate in automatico (webp, dimensioni multiple) — non serve
comprimerle a mano. Se una foto manca, al suo posto va un placeholder neutro.

Consiglio: una **hero** orizzontale di buona qualità è ciò che fa più effetto.

### 3. Compila il file dati (15 min)

Apri `src/content/clients/villa-marina.json` e riempi i campi. **L'unico
obbligatorio è `name`.** Tutto il resto è opzionale: se ometti un campo, la sua
sezione sparisce da sola, senza rompere nulla.

```jsonc
{
  "name": "Villa Marina",                    // OBBLIGATORIO
  "tagline": "Il mare a due passi, la quiete di casa",
  "description": [                            // 2-3 paragrafi
    "Primo paragrafo…",
    "Secondo paragrafo…"
  ],
  "address": "Via del Porto 4",
  "city": "Cesenatico (FC)",
  "phone": "+39 0547 123456",
  "whatsapp": "393401234567",                // solo cifre, con prefisso paese
  "email": "info@villamarina.it",
  "bookingUrl": "https://www.booking.com/…", // se manca, resta solo WhatsApp
  "googleMapsUrl": "https://maps.google.com/…",
  "heroImage": "hero.jpg",                    // nome file nella cartella foto
  "gallery": ["g1.jpg", "g2.jpg", "g3.jpg"],
  "rooms": [
    { "name": "Camera Vista Mare", "description": "…", "priceFrom": 90, "image": "camera1.jpg" }
  ],
  "reviews": [
    { "author": "Giulia M.", "text": "…", "rating": 5, "source": "Google" }
  ],
  "amenities": ["wifi", "parcheggio", "colazione", "animali"],
  "checkIn": "15:00",
  "checkOut": "10:00",
  "accent": "#2A6F6B"                         // colore CTA e dettagli
}
```

Note utili:
- **`whatsapp`**: solo cifre, con prefisso internazionale (es. `39` + numero).
  Se manca, la CTA e il bottone fisso WhatsApp spariscono.
- **`amenities`**: vocabolario con icona pronta — `wifi`, `parcheggio`,
  `parcheggio-privato`, `colazione`, `animali`, `piscina`, `aria-condizionata`,
  `climatizzazione`, `giardino`. Un valore fuori lista appare comunque, con
  un'icona generica.
- **`reviews[].source`**: `Google` o `Booking`.
- **`accent`**: un solo colore, è l'unica personalizzazione visiva. Scegline uno
  **medio-scuro e saturo**: sulle CTA il testo diventa bianco o scuro in
  automatico, ma un colore troppo chiaro/slavato resta poco leggibile.

### 4. Guarda l'anteprima (2 min)

```bash
npm run dev
```

Apri `http://localhost:4321/villa-marina`. Controllalo **da telefono** (il
proprietario aprirà il link da WhatsApp): il menu del browser dà un'anteprima
mobile, oppure apri l'IP locale dal tuo telefono sulla stessa rete.

### 5. Pubblica (5 min)

```bash
git checkout -b demo/villa-marina
git add -A
git commit -m "demo: villa-marina"
git push -u origin demo/villa-marina
```

Apri una PR verso `main` e mergiala (o pusha direttamente su `main` se preferisci).
Al push su `main` parte da sola la **GitHub Action** che builda e pubblica: dopo
un paio di minuti la demo è online su:

```
https://demo.zenith-studio.it/villa-marina
```

Manda **quel link** al prospect. Fatto.

---

## Buono a sapersi

- **Le demo non sono indicizzate** (`noindex` + `robots.txt`): non finiscono su
  Google. C'è un footer discreto "Anteprima realizzata da Zenith Studio".
- **Ogni pagina** ha già meta title/description, immagine social (OG) dalla hero
  e dati strutturati `LodgingBusiness`: se incolli il link in WhatsApp/Facebook
  esce l'anteprima con foto.
- **Se manca un dato, la sezione sparisce.** Non esistono demo rotte per un
  campo vuoto: puoi mandare una demo anche con pochi dati e arricchirla dopo.

## Quando il cliente compra (passaggio a dominio proprio)

Il template è già agnostico rispetto al dominio (dipende solo da `site` in
`astro.config.mjs`). Per portare la struttura su un suo dominio basta spostare
il suo `src/content/clients/<slug>.json` + la cartella foto in un repo/deploy
dedicato con il suo dominio e togliere il `noindex`. (Procedura non ancora
automatizzata: per ora conta solo che sia possibile.)

## Comandi

| Comando | Cosa fa |
|---|---|
| `npm run new-client <slug>` | Crea file dati + cartella foto per una nuova demo |
| `npm run dev` | Anteprima locale su `localhost:4321` |
| `npm run build` | Build statico in `dist/` |
| `npm run preview` | Serve il build di `dist/` in locale |

---

_Repo di [Zenith Studio](https://zenith-studio.it)._
