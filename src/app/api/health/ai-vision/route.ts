import { NextResponse } from 'next/server';
import { serverEnv } from '@/lib/env';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = serverEnv();
    const basicAuth = 'Basic ' + Buffer.from(`${CLOUDINARY_API_KEY}:${CLOUDINARY_API_SECRET}`).toString('base64');
    const url = `https://api.cloudinary.com/v2/analysis/${CLOUDINARY_CLOUD_NAME}/analyze/ai_vision_general`;

    const sampleUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/samples/paper.jpg`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: basicAuth,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source: { uri: sampleUrl },
        prompts: ['Describe this image in one sentence.'],
      }),
      cache: 'no-store',
    });

    let message = '';
    try {
      const body = (await res.json()) as { error?: { message?: string }; message?: string; data?: unknown };
      message = body.error?.message ?? body.message ?? (res.ok ? 'Success' : JSON.stringify(body));
    } catch {
      message = await res.text();
    }

    return NextResponse.json({
      ok: res.ok,
      status: res.status,
      message,
      cloud_name: CLOUDINARY_CLOUD_NAME,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        status: 500,
        message: err instanceof Error ? err.message : 'Unknown error',
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'unknown',
      },
      { status: 500 },
    );
  }
}
