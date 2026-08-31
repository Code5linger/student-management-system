'use client';

export default function StaffError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-md mx-auto mt-16 text-center">
      <p className="label text-rust! mb-2">Something went wrong</p>
      <h1 className="text-xl font-semibold mb-2">Could not load this page</h1>
      <p className="text-ink/60 text-sm mb-6">
        {error.message || 'An unexpected error occurred.'}
      </p>
      <button className="btn-primary" onClick={() => reset()}>
        Try again
      </button>
    </div>
  );
}
