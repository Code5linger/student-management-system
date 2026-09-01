import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { switchRole } from '@/app/actions';

export default async function StudentLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const student = await prisma.student.findUnique({ where: { id } });
  if (!student) notFound();

  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-white">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link
              href={`/student/${id}`}
              className="font-display font-semibold text-lg"
            >
              Registry{' '}
              <span className="text-brand">
                / {student.fullName.split(' ')[0]}
              </span>
            </Link>
            <nav className="flex gap-6 text-sm">
              <Link href={`/student/${id}`} className="hover:text-brand">
                My record
              </Link>
              <Link
                href={`/student/${id}/assessments`}
                className="hover:text-brand"
              >
                Assessments
              </Link>
              <Link
                href={`/student/${id}/marksheet`}
                className="hover:text-brand"
              >
                Marksheet
              </Link>
            </nav>
          </div>
          <form action={switchRole}>
            <button
              type="submit"
              className="text-sm text-ink/60 hover:text-brand"
            >
              Switch role
            </button>
          </form>
        </div>
      </header>
      <div className="max-w-4xl mx-auto px-6 py-8">{children}</div>
    </div>
  );
}
