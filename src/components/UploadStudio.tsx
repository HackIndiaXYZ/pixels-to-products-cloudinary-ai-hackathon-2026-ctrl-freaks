'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { AnalyzeResult } from '@/lib/types';
import { MaterialList, VisualEstimateNote } from './MaterialList';
import { Badge, Button, Spinner } from './ui';

type Stage = 'queued' | 'uploading' | 'registering' | 'analyzing' | 'done' | 'error';

interface Item {
  id: string;
  file: File;
  preview: string;
  stage: Stage;
  progress: number;
  mediaId?: string;
  error?: string;
  result?: AnalyzeResult;
}

interface SignResponse {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  tags: string;
  uploadPreset: string | null;
}

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 10 * 1024 * 1024;
const MAX_PARALLEL = 2;
const ACTIVE = new Set<Stage>(['uploading', 'registering', 'analyzing']);

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => null)) as (T & { error?: { message?: string } }) | null;
  if (!res.ok) throw new Error(data?.error?.message ?? `Request failed (${res.status})`);
  return data as T;
}

function uploadToCloudinary(file: File, sig: SignResponse, onProgress: (fraction: number) => void): Promise<{ public_id: string }> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append('file', file);
    form.append('api_key', sig.apiKey);
    form.append('timestamp', String(sig.timestamp));
    form.append('signature', sig.signature);
    form.append('folder', sig.folder);
    form.append('tags', sig.tags);
    if (sig.uploadPreset) form.append('upload_preset', sig.uploadPreset);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(e.loaded / e.total);
    };
    xhr.onload = () => {
      try {
        const body = JSON.parse(xhr.responseText) as { public_id?: string; error?: { message?: string } };
        if (xhr.status >= 200 && xhr.status < 300 && body.public_id) resolve({ public_id: body.public_id });
        else reject(new Error(body.error?.message ?? 'Upload to Cloudinary failed.'));
      } catch {
        reject(new Error('Upload to Cloudinary failed.'));
      }
    };
    xhr.onerror = () => reject(new Error('Network error while uploading.'));
    xhr.send(form);
  });
}

const STEPS = ['Upload', 'Save', 'AI Vision'] as const;

function stepState(item: Item, index: number): 'done' | 'active' | 'failed' | 'idle' {
  if (item.stage === 'done') return 'done';
  const current = item.stage === 'uploading' ? 0 : item.stage === 'registering' ? 1 : item.stage === 'analyzing' ? 2 : -1;
  if (item.stage === 'error') {
    const failedAt = item.mediaId ? 2 : 0;
    if (index < failedAt) return 'done';
    return index === failedAt ? 'failed' : 'idle';
  }
  if (index < current) return 'done';
  return index === current ? 'active' : 'idle';
}

function StepTrack({ item }: { item: Item }) {
  return (
    <ol className="flex items-center gap-3" aria-label="Progress">
      {STEPS.map((label, i) => {
        const state = stepState(item, i);
        const dot =
          state === 'done' ? 'bg-ok' : state === 'active' ? 'bg-accent' : state === 'failed' ? 'bg-danger' : 'bg-ink-600';
        return (
          <li key={label} className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${dot} ${state === 'active' ? 'animate-pulse' : ''}`} aria-hidden="true" />
            <span className={`font-mono text-[11px] uppercase tracking-wider ${state === 'idle' ? 'text-bone-500' : 'text-bone-300'}`}>
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

const STATUS_COPY: Record<Stage, string> = {
  queued: 'Waiting to start',
  uploading: 'Uploading to Cloudinary',
  registering: 'Saving to your project',
  analyzing: 'Cloudinary AI Vision is reading the image — this takes a few seconds',
  done: 'Analysis saved',
  error: 'Needs attention',
};

export function UploadStudio({ projectId }: { projectId: string }) {
  const [items, setItems] = useState<Item[]>([]);
  const [rejected, setRejected] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);
  const previews = useRef(new Set<string>());

  useEffect(() => {
    const urls = previews.current;
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  const patch = useCallback((id: string, changes: Partial<Item>) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...changes } : i)));
  }, []);

  const process = useCallback(
    async (item: Item) => {
      try {
        let mediaId = item.mediaId;
        if (!mediaId) {
          patch(item.id, { stage: 'uploading', progress: 0, error: undefined });
          const sig = await postJson<SignResponse>(`/api/projects/${projectId}/uploads/sign`, {});
          const uploaded = await uploadToCloudinary(item.file, sig, (p) => patch(item.id, { progress: p }));
          patch(item.id, { stage: 'registering', progress: 1 });
          const { mediaAsset } = await postJson<{ mediaAsset: { id: string } }>(`/api/projects/${projectId}/media`, {
            publicId: uploaded.public_id,
            mimeType: item.file.type,
            originalFilename: item.file.name,
          });
          mediaId = mediaAsset.id;
          patch(item.id, { mediaId });
        }
        patch(item.id, { stage: 'analyzing', error: undefined });
        const result = await postJson<AnalyzeResult>(`/api/media/${mediaId}/analyze`, {});
        patch(item.id, { stage: 'done', result });
      } catch (e) {
        patch(item.id, { stage: 'error', error: e instanceof Error ? e.message : 'Something went wrong.' });
      }
    },
    [patch, projectId],
  );

  // Small queue: at most MAX_PARALLEL items in flight.
  useEffect(() => {
    const room = MAX_PARALLEL - items.filter((i) => ACTIVE.has(i.stage)).length;
    if (room <= 0) return;
    items
      .filter((i) => i.stage === 'queued')
      .slice(0, room)
      .forEach((i) => {
        patch(i.id, { stage: i.mediaId ? 'analyzing' : 'uploading' });
        void process(i);
      });
  }, [items, patch, process]);

  function addFiles(list: FileList | File[]) {
    const accepted: Item[] = [];
    const bad: string[] = [];
    for (const file of Array.from(list)) {
      if (!ACCEPTED.includes(file.type)) {
        bad.push(`${file.name}: only JPG, PNG or WebP images are supported.`);
        continue;
      }
      if (file.size > MAX_BYTES) {
        bad.push(`${file.name}: larger than 10 MB.`);
        continue;
      }
      const preview = URL.createObjectURL(file);
      previews.current.add(preview);
      accepted.push({ id: crypto.randomUUID(), file, preview, stage: 'queued', progress: 0 });
    }
    setRejected(bad);
    if (accepted.length > 0) setItems((prev) => [...accepted, ...prev]);
  }

  const doneCount = items.filter((i) => i.stage === 'done').length;
  const busy = items.some((i) => i.stage !== 'done' && i.stage !== 'error');

  return (
    <div>
      <label
        htmlFor="media-input"
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          addFiles(e.dataTransfer.files);
        }}
        className={`group flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed px-6 py-16 text-center transition-colors focus-within:border-accent ${
          dragging ? 'border-accent bg-accent/5' : 'border-ink-600 bg-ink-900 hover:border-bone-500'
        }`}
      >
        <span className="font-display text-3xl text-bone-50">Drop site photos here</span>
        <span className="mt-3 max-w-md text-sm leading-relaxed text-bone-300">
          Demolition, strip-out and deconstruction photos work best. JPG, PNG or WebP, up to 10 MB each. Close, well-lit shots give the most useful results.
        </span>
        <span className="mt-6 inline-flex h-10 items-center rounded-md border border-ink-600 bg-ink-800 px-4 text-sm font-medium text-bone-50 transition-colors group-hover:border-bone-400">
          Choose images
        </span>
        <input
          id="media-input"
          type="file"
          multiple
          accept={ACCEPTED.join(',')}
          className="sr-only"
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </label>

      {rejected.length > 0 ? (
        <ul role="alert" className="mt-4 space-y-1 rounded-md border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          {rejected.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      ) : null}

      {items.length > 0 ? (
        <section className="mt-10" aria-label="Uploads">
          <div className="mb-5 flex items-end justify-between gap-4">
            <h2 className="text-2xl">
              {doneCount} of {items.length} analyzed
            </h2>
            {doneCount > 0 ? (
              <Link href={`/projects/${projectId}`} className="text-sm font-medium text-accent hover:text-accent-strong">
                {busy ? 'Open project' : 'View material results'} →
              </Link>
            ) : null}
          </div>
          <ul className="space-y-5">
            {items.map((item) => (
              <li key={item.id} className="animate-rise overflow-hidden rounded-lg border border-ink-700 bg-ink-900">
                <div className="grid sm:grid-cols-[18rem_1fr]">
                  <div className="relative aspect-[4/3] bg-ink-800 sm:aspect-auto sm:min-h-[13.5rem]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.preview} alt={`Preview of ${item.file.name}`} className="absolute inset-0 h-full w-full object-cover" />
                    {item.stage === 'analyzing' ? (
                      <div className="absolute inset-0 flex items-end bg-gradient-to-t from-ink-950/80 to-transparent p-3">
                        <Badge tone="accent">Reading image</Badge>
                      </div>
                    ) : null}
                  </div>
                  <div className="flex min-w-0 flex-col p-5 sm:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <p className="min-w-0 truncate font-mono text-xs text-bone-400" title={item.file.name}>
                        {item.file.name}
                      </p>
                      <StepTrack item={item} />
                    </div>

                    <div aria-live="polite" className="mt-4 flex items-center gap-2.5 text-sm text-bone-300">
                      {ACTIVE.has(item.stage) ? <Spinner className="h-4 w-4 text-accent" /> : null}
                      <span className={item.stage === 'error' ? 'text-danger' : ''}>{STATUS_COPY[item.stage]}</span>
                    </div>

                    {item.stage === 'uploading' ? (
                      <div className="mt-3 h-1 overflow-hidden rounded-full bg-ink-700" role="progressbar" aria-valuenow={Math.round(item.progress * 100)} aria-valuemin={0} aria-valuemax={100}>
                        <div className="h-full rounded-full bg-accent transition-[width] duration-150" style={{ width: `${Math.round(item.progress * 100)}%` }} />
                      </div>
                    ) : null}

                    {item.stage === 'analyzing' ? (
                      <div className="mt-4 space-y-2" aria-hidden="true">
                        <div className="skeleton h-4 w-2/3" />
                        <div className="skeleton h-4 w-1/2" />
                      </div>
                    ) : null}

                    {item.stage === 'error' ? (
                      <div className="mt-4">
                        <p role="alert" className="text-sm leading-relaxed text-bone-300">
                          {item.error}
                        </p>
                        <Button variant="secondary" size="sm" className="mt-3" onClick={() => patch(item.id, { stage: 'queued' })}>
                          {item.mediaId ? 'Retry analysis' : 'Retry upload'}
                        </Button>
                      </div>
                    ) : null}

                    {item.stage === 'done' && item.result ? (
                      <div className="mt-5 border-t border-ink-700 pt-5">
                        {item.result.sceneSummary ? (
                          <p className="mb-4 text-sm leading-relaxed text-bone-300">{item.result.sceneSummary}</p>
                        ) : null}
                        <MaterialList materials={item.result.materials} />
                        {item.result.warnings.map((w) => (
                          <p key={w} className="mt-3 text-xs text-bone-400">
                            {w}
                          </p>
                        ))}
                        <div className="mt-4">
                          <VisualEstimateNote />
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
