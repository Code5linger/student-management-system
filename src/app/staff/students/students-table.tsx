'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { StatusBadge, OverdueBadge } from '@/components/badges';
import { computeBalance, isOverdue } from '@/lib/registry';

const PAGE_SIZE = 20;

type Programme = { id: string; name: string };
type Student = {
  id: string;
  studentId: string;
  fullName: string;
  email: string;
  status: string;
  feeDueDate: string;
  assignedFee: string;
  programme: { id: string; name: string; feeAmount: string };
  payments: { amount: string }[];
};

export function StudentsTable({
  initialStudents,
  initialTotal,
  programmes,
}: {
  initialStudents: Student[];
  initialTotal: number;
  programmes: Programme[];
}) {
  const [students, setStudents] = useState(initialStudents);
  const [total, setTotal] = useState(initialTotal);
  const [q, setQ] = useState('');
  const [programmeId, setProgrammeId] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  //   useEffect(() => {
  //     setPage(1);
  //   }, [q, programmeId, status]);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (programmeId) params.set('programmeId', programmeId);
      if (status) params.set('status', status);
      params.set('page', String(page));
      params.set('pageSize', String(PAGE_SIZE));

      try {
        const res = await fetch(`/api/students?${params.toString()}`, {
          signal: controller.signal,
        });
        if (res.ok) {
          const data = await res.json();
          setStudents(data.students);
          setTotal(data.total);
        } else {
          const body = await res.json().catch(() => ({}));
          setError(body.error ?? 'Could not load students.');
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError(
          'Could not reach the server. Check your connection and try again.',
        );
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [q, programmeId, status, page]);

  const rows = useMemo(
    () =>
      students.map((s) => {
        const balance = computeBalance(s.assignedFee, s.payments);
        const overdue = isOverdue(new Date(s.feeDueDate), balance);
        return { ...s, balance, overdue };
      }),
    [students],
  );

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-4">
      {error && (
        <p className="text-sm text-rust bg-rust/10 px-3 py-2 rounded-sm">
          {error}
        </p>
      )}

      <div className="grid sm:grid-cols-3 gap-3">
        <input
          className="input"
          placeholder="Search name, ID, or email…"
          value={q}
          //   onChange={(e) => setQ(e.target.value)}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
        />
        <select
          className="input"
          value={programmeId}
          //   onChange={(e) => setProgrammeId(e.target.value)}
          onChange={(e) => {
            setProgrammeId(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All programmes</option>

          {programmes.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <select
          className="input"
          value={status}
          //   onChange={(e) => setStatus(e.target.value)}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All statuses</option>
          <option value="ENROLLED">Enrolled</option>
          <option value="DEFERRED">Deferred</option>
          <option value="WITHDRAWN">Withdrawn</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </div>

      <div className="card p-0! overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-ink/5 text-left text-xs uppercase tracking-wide text-ink/50">
            <tr>
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Programme</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Balance</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((s) => (
              <tr key={s.id} className="hover:bg-paper">
                <td className="px-4 py-3">
                  <div className="font-medium">{s.fullName}</div>
                  <div className="text-ink/50 text-xs font-mono">
                    {s.studentId}
                  </div>
                </td>
                <td className="px-4 py-3">{s.programme.name}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={s.status} />
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`font-mono ${s.balance > 0 ? 'text-rust' : 'text-ink/50'}`}
                  >
                    ${s.balance.toFixed(2)}
                  </span>
                  {s.overdue && (
                    <span className="ml-2">
                      <OverdueBadge />
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/staff/students/${s.id}`}
                    className="text-brand hover:underline"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-ink/50">
                  {loading ? 'Searching…' : 'No students match those filters.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between text-sm text-ink/60">
          <span>
            Page {page} of {totalPages} ({total} students)
          </span>
          <div className="flex gap-2">
            <button
              className="btn-secondary"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </button>
            <button
              className="btn-secondary"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
