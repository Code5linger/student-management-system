import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ClassificationBadge } from '@/components/badges';

export const dynamic = 'force-dynamic';

export default async function MarksheetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const student = await prisma.student.findUnique({ where: { id } });
  if (!student) notFound();

  // Students only ever see published grades, withheld grades are simply excluded from this query, not just hidden in the UI.
  const grades = await prisma.grade.findMany({
    where: { studentId: student.id, publishedAt: { not: null } },
    include: { submission: { include: { assessment: true } } },
    orderBy: { gradedAt: 'desc' },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Marksheet</h1>
      {grades.length === 0 ? (
        <p className="text-sm text-ink/50">
          No results have been published yet. Check back once your assessments
          have been marked.
        </p>
      ) : (
        <div className="card p-0! overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-ink/5 text-left text-xs uppercase tracking-wide text-ink/50">
              <tr>
                <th className="px-4 py-3">Assessment</th>
                <th className="px-4 py-3">Module</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Classification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {grades.map((g) => (
                <tr key={g.id}>
                  <td className="px-4 py-3">{g.submission.assessment.title}</td>
                  <td className="px-4 py-3">
                    {g.submission.assessment.module}
                  </td>
                  <td className="px-4 py-3 font-mono">{g.score}</td>
                  <td className="px-4 py-3">
                    <ClassificationBadge classification={g.classification} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
