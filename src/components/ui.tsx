import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

const base =
  'inline-flex select-none items-center justify-center gap-2 rounded-md font-medium transition-[background-color,border-color,color,transform] duration-150 active:translate-y-px disabled:pointer-events-none disabled:opacity-50';
const variants: Record<Variant, string> = {
  primary: 'bg-accent text-ink-950 hover:bg-accent-strong',
  secondary: 'border border-ink-600 bg-ink-800 text-bone-50 hover:border-bone-400',
  ghost: 'text-bone-300 hover:bg-ink-800 hover:text-bone-50',
};
const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-[15px]',
};

export function buttonClass(variant: Variant = 'primary', size: Size = 'md') {
  return `${base} ${variants[variant]} ${sizes[size]}`;
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: ComponentProps<'button'> & { variant?: Variant; size?: Size }) {
  return <button className={`${buttonClass(variant, size)} ${className}`} {...props} />;
}

export function LinkButton({
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={`${buttonClass(variant, size)} ${className}`} {...props} />;
}

export function Spinner({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" opacity="0.2" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

type Tone = 'neutral' | 'accent' | 'ok' | 'danger';
const tones: Record<Tone, string> = {
  neutral: 'border-ink-600 text-bone-300',
  accent: 'border-accent/40 bg-accent/10 text-accent',
  ok: 'border-ok/40 bg-ok/10 text-ok',
  danger: 'border-danger/40 bg-danger/10 text-danger',
};

export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-wider ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function PageHeader({
  eyebrow,
  title,
  lead,
  actions,
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        {eyebrow ? <p className="eyebrow mb-3">{eyebrow}</p> : null}
        <h1 className="text-4xl leading-[1.05] sm:text-5xl">{title}</h1>
        {lead ? <p className="mt-4 text-base leading-relaxed text-bone-300">{lead}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-3">{actions}</div> : null}
    </div>
  );
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-ink-600 px-6 py-16 text-center">
      <h2 className="text-2xl">{title}</h2>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-bone-300">{body}</p>
      {action ? <div className="mt-7 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function SetupNeeded({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-accent/30 bg-ink-900 p-8">
      <p className="eyebrow mb-3 text-accent">Setup needed</p>
      <h2 className="text-3xl">Connect Supabase and Cloudinary</h2>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-bone-300">{message}</p>
      <ol className="mt-6 max-w-2xl list-decimal space-y-2 pl-5 text-sm leading-relaxed text-bone-300">
        <li>
          Copy <code className="font-mono text-bone-100">.env.example</code> to{' '}
          <code className="font-mono text-bone-100">.env.local</code> and fill in every value.
        </li>
        <li>
          Run <code className="font-mono text-bone-100">supabase/schema.sql</code>, then{' '}
          <code className="font-mono text-bone-100">supabase/migrations/0002_enable_rls.sql</code>, in the Supabase SQL editor.
        </li>
        <li>Restart the dev server.</li>
      </ol>
    </div>
  );
}
