import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { LateBadge } from '@/components/badges';
import { SubmissionUploader } from './submission-uploader';

export const dynamic = 'force-dynamic';

export default async function StudentAssessmentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const student = await prisma.student.findUnique({ where: { id } });

  if (!student) notFound();

  const assessments = await prisma.assessment.findMany({
    where: {
      OR: [{ programmeId: student.programmeId }, { programmeId: null }],
    },
    include: {
      submissions: { where: { studentId: student.id } },
    },
    orderBy: { deadline: 'asc' },
  });

  const now = new Date();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Assessments</h1>

      <div className="space-y-4">
        {assessments.map((a) => {
          const mySubmission = a.submissions[0] ?? null;
          const pastDeadline = a.deadline.getTime() < now.getTime();

          return (
            <section key={a.id} className="card">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h2 className="font-semibold">{a.title}</h2>
                  <p className="text-ink/50 text-sm">
                    {a.module} · Deadline{' '}
                    {new Date(a.deadline).toLocaleString()}
                  </p>
                </div>
                {pastDeadline && (
                  <span className="badge bg-ink/10 text-ink/60">Closed</span>
                )}
              </div>

              {mySubmission && (
                <p className="text-sm mb-3">
                  Submitted:{' '}
                  <span className="font-medium">{mySubmission.fileName}</span>{' '}
                  {mySubmission.isLate && <LateBadge />} on{' '}
                  {new Date(mySubmission.submittedAt).toLocaleString()}
                </p>
              )}

              {pastDeadline && !mySubmission ? (
                <p className="text-sm text-ink/50">
                  The deadline has passed and nothing was submitted.
                </p>
              ) : pastDeadline && mySubmission ? (
                <p className="text-sm text-ink/50">
                  The deadline has passed, this submission is final.
                </p>
              ) : (
                <SubmissionUploader
                  assessmentId={a.id}
                  studentId={student.id}
                  hasExisting={Boolean(mySubmission)}
                />
              )}
            </section>
          );
        })}
        {assessments.length === 0 && (
          <p className="text-ink/50 text-sm">
            No assessments have been set yet.
          </p>
        )}
      </div>
    </div>
  );
}
