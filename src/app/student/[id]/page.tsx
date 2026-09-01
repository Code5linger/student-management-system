import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { computeBalance, isOverdue } from '@/lib/registry';
import { StatusBadge, OverdueBadge } from '@/components/badges';

export const dynamic = 'force-dynamic';

export default async function StudentHomePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const student = await prisma.student.findUnique({
    where: { id },
    include: { programme: true, payments: { orderBy: { date: 'desc' } } },
  });

  if (!student) notFound();

  const balance = computeBalance(student.assignedFee, student.payments);
  const overdue = isOverdue(student.feeDueDate, balance);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{student.fullName}</h1>
        <p className="text-ink/50 font-mono text-sm">{student.studentId}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <section className="card space-y-2 text-sm">
          <h2 className="font-semibold mb-2">My details</h2>
          <Row label="Programme" value={student.programme.name} />
          <Row label="Academic year" value={`Year ${student.academicYear}`} />
          <Row label="Status" value={<StatusBadge status={student.status} />} />
        </section>

        <section className="card space-y-2 text-sm">
          <h2 className="font-semibold mb-2">Fees</h2>
          <Row
            label="Your fee"
            value={`$${Number(student.assignedFee).toFixed(2)}`}
          />
          <Row
            label="Outstanding balance"
            value={
              <span className={balance > 0 ? 'text-rust font-semibold' : ''}>
                ${balance.toFixed(2)} {overdue && <OverdueBadge />}
              </span>
            }
          />
          <Row
            label="Due date"
            value={new Date(student.feeDueDate).toLocaleDateString()}
          />
          {overdue && (
            <p className="text-xs text-rust pt-1">
              Your balance is overdue. Please contact the Registry office to
              arrange payment.
            </p>
          )}
        </section>
      </div>

      <section className="card">
        <h2 className="font-semibold mb-3">Payment history</h2>
        {student.payments.length === 0 ? (
          <p className="text-sm text-ink/50">No payments on file yet.</p>
        ) : (
          <ul className="divide-y divide-line text-sm">
            {student.payments.map((p) => (
              <li key={p.id} className="py-2 flex justify-between">
                <span>{new Date(p.date).toLocaleDateString()}</span>
                <span className="font-mono text-ink/50">
                  {p.referenceNumber}
                </span>
                <span className="font-mono">
                  ${Number(p.amount).toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
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
