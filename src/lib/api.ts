import 'server-only';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { AppError } from '@/lib/errors';

export function errorResponse(error: unknown): NextResponse {
  if (error instanceof AppError) {
    return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: error.status });
  }
  if (error instanceof ZodError) {
    const issue = error.issues[0];
    const where = issue?.path.length ? `${issue.path.join('.')}: ` : '';
    return NextResponse.json(
      { error: { code: 'validation_error', message: `${where}${issue?.message ?? 'Invalid input'}` } },
      { status: 400 },
    );
  }
  console.error('[unhandled]', error);
  return NextResponse.json({ error: { code: 'internal_error', message: 'Something went wrong.' } }, { status: 500 });
}

/** Wrap a route handler so every failure becomes a structured JSON error. */
export function route<C = unknown>(handler: (req: Request, ctx: C) => Promise<Response>) {
  return async (req: Request, ctx: C): Promise<Response> => {
    try {
      return await handler(req, ctx);
    } catch (error) {
      return errorResponse(error);
    }
  };
}

export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw new AppError(400, 'invalid_json', 'Request body must be valid JSON.');
  }
}
