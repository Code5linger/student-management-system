import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { LateBadge } from '@/components/badges';
import { GradeRow } from './grade-row';

export const dynamic = 'force-dynamic';

export default async function AssessmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const assessment = await prisma.assessment.findUnique({
    where: { id },
    include: {
      programme: true,
      submissions: {
        include: { student: true, grade: true },
        orderBy: { submittedAt: 'asc' },
      },
    },
  });

  if (!assessment) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{assessment.title}</h1>
        <p className="text-ink/60 text-sm">
          {assessment.module} · Deadline{' '}
          {new Date(assessment.deadline).toLocaleString()} ·{' '}
          {assessment.programme?.name ?? 'All programmes'}
        </p>
      </div>

      <div className="card p-0! overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-ink/5 text-left text-xs uppercase tracking-wide text-ink/50">
            <tr>
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Submitted</th>
              <th className="px-4 py-3">File</th>
              <th className="px-4 py-3">Grade</th>
              <th className="px-4 py-3">Publish</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {assessment.submissions.map((sub) => (
              <tr key={sub.id}>
                <td className="px-4 py-3">
                  <div className="font-medium">{sub.student.fullName}</div>
                  <div className="text-ink/50 text-xs font-mono">
                    {sub.student.studentId}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {new Date(sub.submittedAt).toLocaleString()}{' '}
                  {sub.isLate && <LateBadge />}
                </td>
                <td className="px-4 py-3">
                  <a
                    href={sub.filePath}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand hover:underline"
                  >
                    {sub.fileName}
                  </a>
                </td>
                <td className="px-4 py-3" colSpan={2}>
                  <GradeRow
                    submissionId={sub.id}
                    existingGrade={
                      sub.grade ? JSON.parse(JSON.stringify(sub.grade)) : null
                    }
                  />
                </td>
              </tr>
            ))}
            {assessment.submissions.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-ink/50">
                  No submissions yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
