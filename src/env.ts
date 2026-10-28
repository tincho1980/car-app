import { z } from 'zod';

// Solo las variables que la app ya usa: cada fase suma las suyas.
// La lista completa está en .env.example y en docs/03-arquitectura.md §9.
const EnvSchema = z.object({
  MONGODB_URI: z.string().startsWith('mongodb', 'MONGODB_URI tiene que ser una URI de MongoDB'),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(`Variables de entorno inválidas:\n${z.prettifyError(parsed.error)}`);
}

export const env = parsed.data;
