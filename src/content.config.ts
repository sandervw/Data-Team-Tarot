import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob, file } from 'astro/loaders';

const cards = defineCollection({
  loader: file("src/content/cards.json"),
  schema: z.object({
    name: z.string(),
    numeral: z.string(),
    number: z.number(),
    art: z.string(),
    suit: z.string().optional(),
  })
});

const fortunes = defineCollection({
  loader: file("src/content/fortunes.json"),
  schema: z.object({
    text: z.string(),
    card: z.string().optional(), //slug reference
    added: z.string()
  })
});

export const collections = { cards, fortunes };