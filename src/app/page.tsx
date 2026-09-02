import { prisma } from '@/lib/prisma';
import { RolePicker } from './role-picker';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const students = await prisma.student.findMany({
    select: { id: true, studentId: true, fullName: true },
    orderBy: { fullName: 'asc' },
  });

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="label text-brand! mb-2">PEN Global</p>
          <h1 className="text-3xl font-semibold mb-2">
            Student Management System
          </h1>
          <p className="label text-brand! mt-3">Registry Module</p>
          <p className="text-ink/60 mt-2 text-sm">
            No login is wired up for this demo, pick how you would like to
            enter.
          </p>
        </div>
        <RolePicker students={students} />
      </div>
    </main>
  );
}
