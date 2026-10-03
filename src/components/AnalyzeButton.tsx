'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button, Spinner } from './ui';

export function AnalyzeButton({ mediaAssetId, label = 'Analyze with AI Vision' }: { mediaAssetId: string; label?: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/media/${mediaAssetId}/analyze`, { method: 'POST' });
      const body = (await res.json()) as { error?: { message: string } };
      if (!res.ok) throw new Error(body.error?.message ?? 'Analysis failed.');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analysis failed.');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <Button variant="secondary" size="sm" onClick={run} disabled={pending}>
        {pending ? (
          <>
            <Spinner className="h-3.5 w-3.5" /> Analyzing…
          </>
        ) : (
          label
        )}
      </Button>
      {error ? (
        <p role="alert" className="text-xs leading-relaxed text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
