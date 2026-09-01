import Link from 'next/link';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const now = Date.now();

export default async function AssessmentsPage() {
  const assessments = await prisma.assessment.findMany({
    include: { programme: true, _count: { select: { submissions: true } } },
    orderBy: { deadline: 'asc' },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Assessments</h1>
        <Link href="/staff/assessments/new" className="btn-primary">
          + New assessment
        </Link>
      </div>

      <div className="card p-0! overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-ink/5 text-left text-xs uppercase tracking-wide text-ink/50">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Module</th>
              <th className="px-4 py-3">Programme</th>
              <th className="px-4 py-3">Deadline</th>
              <th className="px-4 py-3">Submissions</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {assessments.map((a) => (
              <tr key={a.id} className="hover:bg-paper">
                <td className="px-4 py-3 font-medium">{a.title}</td>
                <td className="px-4 py-3">{a.module}</td>
                <td className="px-4 py-3">
                  {a.programme?.name ?? 'All programmes'}
                </td>
                <td className="px-4 py-3">
                  {new Date(a.deadline).toLocaleString()}
                  {new Date(a.deadline).getTime() < now && (
                    <span className="badge bg-ink/10 text-ink/60 ml-2">
                      Closed
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">{a._count.submissions}</td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/staff/assessments/${a.id}`}
                    className="text-brand hover:underline"
                  >
                    Grade
                  </Link>
                </td>
              </tr>
            ))}
            {assessments.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-ink/50">
                  No assessments yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
