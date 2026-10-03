import { LinkButton } from '@/components/ui';

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <p className="eyebrow mb-3 text-accent">404</p>
      <h1 className="text-4xl">Page not found</h1>
      <p className="mt-3 max-w-md text-bone-300">
        The project, material, or asset you are looking for does not exist or has been removed.
      </p>
      <div className="mt-6">
        <LinkButton href="/projects">Back to projects</LinkButton>
      </div>
    </div>
  );
}
