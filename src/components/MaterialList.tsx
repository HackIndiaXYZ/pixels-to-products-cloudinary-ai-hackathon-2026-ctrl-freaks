import Link from 'next/link';
import { labelize } from '@/lib/taxonomy';
import type { MaterialRow } from '@/lib/types';
import { Badge } from './ui';

export function Confidence({ value }: { value: number | null }) {
  if (value === null) return null;
  const pct = Math.round(value * 100);
  return (
    <div className="flex items-center gap-2" title={`${pct}% model confidence`}>
      <div className="h-1 w-16 overflow-hidden rounded-full bg-ink-700" aria-hidden="true">
        <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
      </div>
      <span className="font-mono text-[11px] text-bone-400">{pct}%</span>
    </div>
  );
}

export function MaterialList({ materials }: { materials: MaterialRow[] }) {
  if (materials.length === 0) {
    return (
      <p className="text-sm leading-relaxed text-bone-400">
        No recoverable materials were visible in this image. Try a closer or better-lit photo.
      </p>
    );
  }
  return (
    <ul className="divide-y divide-ink-700">
      {materials.map((m) => (
        <li key={m.id} className="py-3.5 first:pt-0 last:pb-0">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5">
            <div className="flex items-center gap-2.5">
              <span className={`h-1.5 w-1.5 rounded-full ${m.reuse_candidate ? 'bg-accent' : 'bg-ink-600'}`} aria-hidden="true" />
              <h4 className="font-display text-lg text-bone-50">{labelize(m.material_type)}</h4>
              {m.quantity_estimate ? <span className="font-mono text-xs text-bone-400">≈ {m.quantity_estimate}</span> : null}
            </div>
            <Confidence value={m.ai_confidence} />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Badge tone={m.reuse_candidate ? 'accent' : 'neutral'}>{m.reuse_candidate ? 'Appears reusable' : 'Reuse unclear'}</Badge>
            {m.visual_condition ? <Badge>{labelize(m.visual_condition)}</Badge> : null}
            {m.visible_damage.map((d) => (
              <Badge key={d} tone="danger">
                {labelize(d)}
              </Badge>
            ))}
          </div>
          {m.context_description ? <p className="mt-2 text-sm leading-relaxed text-bone-300">{m.context_description}</p> : null}
          <div className="mt-4 flex">
            <Link
              href={`/materials/${m.id}`}
              className="inline-flex h-9 items-center rounded bg-accent px-4 text-sm font-semibold text-ink-950 transition-colors hover:bg-accent-strong"
            >
              Explore Second Life →
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function VisualEstimateNote() {
  return (
    <p className="text-xs leading-relaxed text-bone-500">
      Visual estimates only. Nothing here assesses structural integrity, hidden defects or safety.
    </p>
  );
}
