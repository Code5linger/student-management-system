import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <p className="label text-brand! mb-2">404</p>
        <h1 className="text-2xl font-semibold mb-2">
          That record does not exist
        </h1>
        <p className="text-ink/60 text-sm mb-6">
          It may have been removed, or the link is out of date.
        </p>
        <Link href="/" className="btn-primary">
          Back to start
        </Link>
      </div>
    </main>
  );
}
