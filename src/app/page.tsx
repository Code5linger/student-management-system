export const dynamic = 'force-dynamic';

export default async function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="label text-brand mb-2">PEN Global</p>
          <h1 className="text-3xl font-semibold">Student Management System</h1>
          <p className="label text-brand mb-2">Registry Module</p>
          <p className="text-ink/60 mt-2 text-sm">
            No login is wired up for this demo, please select a role
          </p>
        </div>
      </div>
    </main>
  );
}
