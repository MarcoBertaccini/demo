#!/usr/bin/env node
// Crea una nuova demo: file dati + cartella immagini.
//   npm run new-client <slug>
// Lo <slug> diventa il nome del file JSON (e quindi la route /<slug>).

import { mkdir, copyFile, writeFile, access } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const slug = process.argv[2];

if (!slug) {
  console.error('Uso: npm run new-client <slug>');
  console.error('Esempio: npm run new-client villa-marina');
  process.exit(1);
}

if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
  console.error(`Slug non valido: "${slug}"`);
  console.error('Usa solo minuscole, numeri e trattini (es. "podere-degli-ulivi").');
  process.exit(1);
}

const dataFile = join(root, 'src/content/clients', `${slug}.json`);
const templateFile = join(root, 'src/content/clients', '_template.json');
const imagesDir = join(root, 'src/assets/clients', slug);

const exists = async (p) => {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
};

if (await exists(dataFile)) {
  console.error(`Esiste già: src/content/clients/${slug}.json`);
  process.exit(1);
}

await copyFile(templateFile, dataFile);
await mkdir(imagesDir, { recursive: true });
await writeFile(join(imagesDir, '.gitkeep'), '');

console.log(`\n✓ Demo "${slug}" creata.\n`);
console.log('Prossimi passi:');
console.log(`  1. Compila  src/content/clients/${slug}.json  (obbligatorio: "name").`);
console.log(`  2. Metti le foto in  src/assets/clients/${slug}/  e referenziale`);
console.log('     per nome nel JSON (heroImage, gallery[], rooms[].image).');
console.log(`  3. Anteprima:  npm run dev  →  http://localhost:4321/${slug}\n`);
