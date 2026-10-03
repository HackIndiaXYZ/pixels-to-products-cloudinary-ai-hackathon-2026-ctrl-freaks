import { LinkButton } from '@/components/ui';

const STEPS = [
  {
    n: '01',
    title: 'Upload ordinary site media',
    body: 'Drop in demolition, strip-out or deconstruction photos. No special capture, no tagging by hand.',
  },
  {
    n: '02',
    title: 'Cloudinary AI Vision reads the scene',
    body: 'Doors, timber, steel, brick, tile, fixtures and more are identified with a visual condition and a confidence, returned as structured data.',
  },
  {
    n: '03',
    title: 'A searchable material inventory',
    body: 'Every candidate stays linked to the photo it came from, so you can always see what the system saw.',
  },
  {
    n: '04',
    title: 'Find a second life',
    body: 'Describe what you want to build. Matching materials are ranked, and concept visualizations are generated from the real material.',
  },
] as const;

export default function Landing() {
  return (
    <div className="animate-rise">
      <section className="pb-20 pt-6 sm:pb-28">
        <p className="eyebrow mb-6">Visual intelligence for recoverable materials</p>
        <h1 className="max-w-4xl text-5xl leading-[1.02] sm:text-7xl">
          Discover what a construction site can save <span className="text-accent">before it becomes waste.</span>
        </h1>
        <p className="mt-8 max-w-2xl text-lg leading-relaxed text-bone-300">
          FROM SITE MEDIA → SECOND LIFE. Turn ordinary construction and demolition photos into an inventory of materials that appear reusable, then into concrete reuse opportunities.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-3">
          <LinkButton href="/projects/new" size="lg">
            Start a project
          </LinkButton>
          <LinkButton href="/projects" variant="ghost" size="lg">
            View projects
          </LinkButton>
        </div>
      </section>

      <section aria-labelledby="how" className="border-t hairline py-16">
        <h2 id="how" className="eyebrow mb-10">
          How it works
        </h2>
        <ol className="divide-y divide-ink-700 border-y hairline">
          {STEPS.map((s) => (
            <li key={s.n} className="grid gap-3 py-8 sm:grid-cols-[6rem_1fr_1.4fr] sm:gap-8">
              <span className="font-mono text-sm text-accent">{s.n}</span>
              <h3 className="text-2xl">{s.title}</h3>
              <p className="text-[15px] leading-relaxed text-bone-300">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="limits" className="border-t hairline py-16">
        <div className="grid gap-6 sm:grid-cols-[6rem_1fr] sm:gap-8">
          <h2 id="limits" className="eyebrow pt-1">
            Honest by design
          </h2>
          <p className="max-w-2xl text-lg leading-relaxed text-bone-300">
            Everything is a visual estimate. RAW → REUSE does not assess structural integrity, hidden defects, exact dimensions or safety, and generated images are always labeled as concept visualizations.
          </p>
        </div>
      </section>
    </div>
  );
}
