import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { computeBalance, isOverdue } from '@/lib/registry';
import {
  StatusBadge,
  OverdueBadge,
  LateBadge,
  ClassificationBadge,
} from '@/components/badges';
import { RecordPaymentForm } from './record-payment-form';
import { StatusEditor } from './status-editor';
import { formatCurrency, formatDate } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      programme: true,
      payments: { orderBy: { date: 'desc' } },
      submissions: {
        include: { assessment: true, grade: true },
        orderBy: { submittedAt: 'desc' },
      },
    },
  });

  if (!student) notFound();

  const balance = computeBalance(student.assignedFee, student.payments);
  const overdue = isOverdue(student.feeDueDate, balance);
  const assignedFee = Number(student.assignedFee);
  const currentProgrammeFee = Number(student.programme.feeAmount);
  const feeDiffersFromProgramme = assignedFee !== currentProgrammeFee;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{student.fullName}</h1>
          <p className="text-ink/50 font-mono text-sm">{student.studentId}</p>
        </div>
        <StatusEditor studentId={student.id} currentStatus={student.status} />
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <section className="card space-y-2 text-sm">
          <h2 className="font-semibold mb-2">Details</h2>
          <Row label="Email" value={student.email} />
          <Row label="Programme" value={student.programme.name} />
          <Row label="Academic year" value={`Year ${student.academicYear}`} />
          <Row label="Date of birth" value={formatDate(student.dateOfBirth)} />
          <Row label="Status" value={<StatusBadge status={student.status} />} />
        </section>

        {/* <section className="card space-y-3 text-sm">
          <h2 className="font-semibold mb-2">Fees & payments</h2>
          <Row label="Assigned fee" value={`£${assignedFee.toFixed(2)}`} />
          {feeDiffersFromProgramme && (
            <p className="text-xs text-ink/40 -mt-2">
              Fee was {formatCurrency(assignedFee)} at enrolment. The current
              programme fee is now {formatCurrency(currentProgrammeFee)}.
            </p>
          )}
          <Row
            label="Total paid"
            value={formatCurrency(assignedFee - balance)}
          />
          <Row
            label="Outstanding balance"
            value={
              <span className={balance > 0 ? 'text-rust font-semibold' : ''}>
                {formatCurrency(balance)} {overdue && <OverdueBadge />}
              </span>
            }
          />
          <Row label="Fee due date" value={formatDate(student.feeDueDate)} />
        </section> */}

        <section className="card space-y-3 text-sm">
          <h2 className="font-semibold mb-2">Fees & payments</h2>

          <Row label="Assigned fee" value={formatCurrency(assignedFee)} />

          {feeDiffersFromProgramme && (
            <p className="text-xs text-ink/40 -mt-2">
              Fee was {formatCurrency(assignedFee)} at enrolment. The current
              programme fee is now {formatCurrency(currentProgrammeFee)}.
            </p>
          )}

          <Row
            label="Total paid"
            value={formatCurrency(assignedFee - balance)}
          />

          <Row
            label="Outstanding balance"
            value={
              <span className={balance > 0 ? 'text-rust font-semibold' : ''}>
                {formatCurrency(balance)} {overdue && <OverdueBadge />}
              </span>
            }
          />

          <Row label="Fee due date" value={formatDate(student.feeDueDate)} />
        </section>

        <section className="card">
          <h2 className="font-semibold mb-2">Record a payment</h2>
          <RecordPaymentForm studentId={student.id} />
        </section>
      </div>

      <section className="card">
        <h2 className="font-semibold mb-3">Payment history</h2>
        {student.payments.length === 0 ? (
          <p className="text-sm text-ink/50">No payments recorded yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-ink/50">
              <tr>
                <th className="py-2">Date</th>
                <th className="py-2">Reference</th>
                <th className="py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {student.payments.map((p) => (
                <tr key={p.id}>
                  <td className="py-2">{formatDate(p.date)}</td>
                  <td className="py-2 font-mono text-ink/60">
                    {p.referenceNumber}
                  </td>
                  <td className="py-2 text-right font-mono">
                    {formatCurrency(Number(p.amount))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="card">
        <h2 className="font-semibold mb-3">Submissions & grades</h2>
        {student.submissions.length === 0 ? (
          <p className="text-sm text-ink/50">No submissions yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-ink/50">
              <tr>
                <th className="py-2">Assessment</th>
                <th className="py-2">Submitted</th>
                <th className="py-2">Grade</th>
                <th className="py-2">Visible to student</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {student.submissions.map((sub) => (
                <tr key={sub.id}>
                  <td className="py-2">{sub.assessment.title}</td>
                  <td className="py-2">
                    {formatDate(sub.submittedAt)} {sub.isLate && <LateBadge />}
                  </td>
                  <td className="py-2">
                    {sub.grade ? (
                      <>
                        {sub.grade.score}{' '}
                        <ClassificationBadge
                          classification={sub.grade.classification}
                        />
                      </>
                    ) : (
                      <span className="text-ink/40">Not graded</span>
                    )}
                  </td>
                  <td className="py-2">
                    {sub.grade
                      ? sub.grade.publishedAt
                        ? 'Published'
                        : 'Withheld'
                      : 'Not graded'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink/50">{label}</span>
      <span>{value}</span>
    </div>
  );
}
