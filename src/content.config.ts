import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Stringa vuota = campo assente. Serve al _template/new-client, che genera
// tutti i campi vuoti: senza questo, email:"" o url:"" farebbero fallire zod.
const emptyToUndef = (v: unknown) => (v === '' ? undefined : v);

// Un file JSON per cliente in src/content/clients/.
// Lo slug è l'id della entry (nome file senza estensione), non un campo del JSON.
// I file che iniziano con "_" (es. _template.json) sono esclusi.
const clients = defineCollection({
  loader: glob({ pattern: '[!_]*.json', base: './src/content/clients' }),
  schema: z.object({
    name: z.string(), // unico campo obbligatorio
    tagline: z.string().optional(),
    description: z.array(z.string()).optional(), // 2-3 paragrafi

    address: z.string().optional(),
    city: z.string().optional(),
    phone: z.string().optional(),
    whatsapp: z.string().optional(), // numero E.164, es. "393401234567"
    email: z.preprocess(emptyToUndef, z.string().email().optional()),

    bookingUrl: z.preprocess(emptyToUndef, z.string().url().optional()),
    googleMapsUrl: z.preprocess(emptyToUndef, z.string().url().optional()),

    heroImage: z.string().optional(), // nome file in src/assets/clients/<slug>/
    gallery: z.array(z.string()).optional(),

    rooms: z
      .array(
        z.object({
          name: z.string(),
          description: z.string().optional(),
          priceFrom: z.number().optional(), // €/notte
          image: z.string().optional(),
        }),
      )
      .optional(),

    reviews: z
      .array(
        z.object({
          author: z.string(),
          text: z.string(),
          rating: z.number().min(1).max(5).optional(),
          source: z.enum(['Google', 'Booking']).optional(),
        }),
      )
      .optional(),

    amenities: z.array(z.string()).optional(),

    checkIn: z.string().optional(), // es. "15:00"
    checkOut: z.string().optional(), // es. "10:00"

    accent: z.string().optional(), // hex, default gestito nel template
  }),
});

export const collections = { clients };
