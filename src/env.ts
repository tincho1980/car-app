import { z } from 'zod';

// Solo las variables que la app ya usa: cada fase suma las suyas.
// La lista completa está en .env.example y en docs/03-arquitectura.md §9.
const EnvSchema = z.object({
  MONGODB_URI: z.string().startsWith('mongodb', 'MONGODB_URI tiene que ser una URI de MongoDB'),
  AUTH_SECRET: z.string().min(32, 'AUTH_SECRET tiene que tener al menos 32 caracteres'),
  AUTH_GOOGLE_ID: z.string().min(1),
  AUTH_GOOGLE_SECRET: z.string().min(1),
  ALLOWED_EMAIL: z.email('ALLOWED_EMAIL tiene que ser un email'),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(`Variables de entorno inválidas:\n${z.prettifyError(parsed.error)}`);
}

export const env = parsed.data;
