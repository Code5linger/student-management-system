'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <p className="label text-rust! mb-2">Something went wrong</p>
        <h1 className="text-2xl font-semibold mb-2">
          We hit an unexpected error
        </h1>
        <p className="text-ink/60 text-sm mb-6">
          {error.message ||
            'Please try again, if this keeps happening, check your database connection.'}
        </p>
        <button className="btn-primary" onClick={() => reset()}>
          Try again
        </button>
      </div>
    </main>
  );
}
