import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { computeBalance, isOverdue } from '@/lib/registry';
import { StatusBadge, LateBadge } from '@/components/badges';

export const dynamic = 'force-dynamic';

export default async function StaffDashboard() {
  const students = await prisma.student.findMany({
    include: { programme: true, payments: true },
  });

  const overdue = students
    .map((s) => ({ ...s, balance: computeBalance(s.assignedFee, s.payments) }))
    .filter((s) => isOverdue(s.feeDueDate, s.balance))
    .sort((a, b) => b.balance - a.balance);

  const lateSubmissions = await prisma.submission.findMany({
    where: { isLate: true },
    include: { student: true, assessment: true },
    orderBy: { submittedAt: 'desc' },
    take: 8,
  });

  const pendingGrades = await prisma.grade.findMany({
    where: { publishedAt: null },
    include: { student: true, submission: { include: { assessment: true } } },
    orderBy: { gradedAt: 'desc' },
    take: 8,
  });

  const counts = {
    total: students.length,
    enrolled: students.filter((s) => s.status === 'ENROLLED').length,
    deferred: students.filter((s) => s.status === 'DEFERRED').length,
    withdrawn: students.filter((s) => s.status === 'WITHDRAWN').length,
    completed: students.filter((s) => s.status === 'COMPLETED').length,
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Registry dashboard</h1>
        <p className="text-ink/60 text-sm mt-1">
          Everything that needs Registry attention today.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard label="Total students" value={counts.total} />
        <StatCard label="Enrolled" value={counts.enrolled} accent="brand" />
        <StatCard label="Deferred" value={counts.deferred} accent="gold" />
        <StatCard label="Withdrawn" value={counts.withdrawn} accent="rust" />
        <StatCard label="Overdue fees" value={overdue.length} accent="rust" />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <section className="card">
          <h2 className="font-semibold mb-3">Overdue balances</h2>
          {overdue.length === 0 && (
            <p className="text-sm text-ink/60">Nothing overdue right now.</p>
          )}
          <ul className="divide-y divide-line">
            {overdue.slice(0, 8).map((s) => (
              <li
                key={s.id}
                className="py-2 flex items-center justify-between text-sm"
              >
                <div>
                  <Link
                    href={`/staff/students/${s.id}`}
                    className="font-medium hover:text-brand"
                  >
                    {s.fullName}
                  </Link>
                  <div className="text-ink/50 text-xs">
                    {s.studentId} · <StatusBadge status={s.status} />
                  </div>
                </div>
                <span className="font-mono text-rust">
                  £{s.balance.toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="card">
          <h2 className="font-semibold mb-3">Late submissions</h2>
          {lateSubmissions.length === 0 && (
            <p className="text-sm text-ink/60">No late submissions.</p>
          )}
          <ul className="divide-y divide-line">
            {lateSubmissions.map((sub) => (
              <li
                key={sub.id}
                className="py-2 flex items-center justify-between text-sm"
              >
                <div>
                  <span className="font-medium">{sub.student.fullName}</span>
                  <div className="text-ink/50 text-xs">
                    {sub.assessment.title}
                  </div>
                </div>
                <LateBadge />
              </li>
            ))}
          </ul>
        </section>

        <section className="card md:col-span-2">
          <h2 className="font-semibold mb-3">Grades awaiting publish</h2>
          {pendingGrades.length === 0 && (
            <p className="text-sm text-ink/60">
              Nothing waiting to be published.
            </p>
          )}
          <ul className="divide-y divide-line">
            {pendingGrades.map((g) => (
              <li
                key={g.id}
                className="py-2 flex items-center justify-between text-sm"
              >
                <div>
                  <span className="font-medium">{g.student.fullName}</span>
                  <span className="text-ink/50">
                    {' '}
                    , {g.submission.assessment.title}
                  </span>
                </div>
                <Link
                  href={`/staff/assessments/${g.submission.assessmentId}`}
                  className="text-brand hover:underline"
                >
                  Review
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: 'brand' | 'gold' | 'rust';
}) {
  const color =
    accent === 'brand'
      ? 'text-brand'
      : accent === 'gold'
        ? 'text-gold'
        : accent === 'rust'
          ? 'text-rust'
          : 'text-ink';
  return (
    <div className="card">
      <p className="text-xs uppercase tracking-wide text-ink/50">{label}</p>
      <p className={`text-2xl font-semibold font-display mt-1 ${color}`}>
        {value}
      </p>
    </div>
  );
}
