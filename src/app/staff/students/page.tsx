import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { StudentsTable } from './students-table';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 20;

export default async function StudentsPage() {
  const [students, total, programmes] = await Promise.all([
    prisma.student.findMany({
      include: { programme: true, payments: true },
      orderBy: { createdAt: 'desc' },
      take: PAGE_SIZE,
    }),
    prisma.student.count(),
    prisma.programme.findMany({ orderBy: { name: 'asc' } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Students</h1>
        <Link href="/staff/students/new" className="btn-primary">
          + Add student
        </Link>
      </div>
      <StudentsTable
        initialStudents={JSON.parse(JSON.stringify(students))}
        initialTotal={total}
        programmes={JSON.parse(JSON.stringify(programmes))}
      />
    </div>
  );
}
