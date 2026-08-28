import type { ImageMetadata } from 'astro';
import placeholder from '../assets/placeholder/placeholder.jpg';

// Tutte le foto cliente vivono in src/assets/clients/<slug>/<file>.
// Le importiamo eager così astro:assets le ottimizza a build time.
const clientImages = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/clients/**/*.{jpg,jpeg,png,webp,avif}',
  { eager: true },
);

/**
 * Risolve una foto cliente per nome file. Se manca il file (o il nome),
 * torna un placeholder neutro: nessuna demo si rompe per una foto mancante.
 */
export function resolveClientImage(slug: string, filename?: string): ImageMetadata {
  if (!filename) return placeholder;
  const key = `/src/assets/clients/${slug}/${filename}`;
  return clientImages[key]?.default ?? placeholder;
}
