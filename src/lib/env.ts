import 'server-only';
import { z } from 'zod';
import { AppError } from '@/lib/errors';

const schema = z.object({
  CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),
});

export type ServerEnv = z.output<typeof schema>;

let cached: ServerEnv | undefined;

/** Validated server-side configuration. Reports variable NAMES only, never values. */
export function serverEnv(): ServerEnv {
  if (cached) return cached;
  const rawEnv = {
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  };
  const parsed = schema.safeParse(rawEnv);
  if (!parsed.success) {
    const names = [...new Set(parsed.error.issues.map((i) => i.path.join('.')))].join(', ');
    throw new AppError(500, 'config_error', `Missing or invalid environment variables: ${names}`);
  }
  cached = parsed.data;
  return cached;
}
