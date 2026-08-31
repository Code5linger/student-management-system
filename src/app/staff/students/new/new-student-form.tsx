'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/format';

type Programme = { id: string; name: string; feeAmount: string };

export function NewStudentForm({ programmes }: { programmes: Programme[] }) {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    dateOfBirth: '',
    programmeId: programmes[0]?.id ?? '',
    academicYear: '1',
    status: 'ENROLLED',
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const selectedProgramme = programmes.find((p) => p.id === form.programmeId);

  // async function handleSubmit(e: React.FormEvent) {
  //   e.preventDefault();
  //   setError(null);
  //   setSubmitting(true);

  //   const res = await fetch('/api/students', {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify(form),
  //   });

  //   setSubmitting(false);

  //   if (!res.ok) {
  //     const body = await res.json();
  //     setError(body.error ?? 'Something went wrong.');
  //     return;
  //   }

  //   const student = await res.json();
  //   router.push(`/staff/students/${student.id}`);
  //   router.refresh();
  // }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });

      const body = await res.json().catch(() => null);

      if (!res.ok) {
        setError(body?.error ?? 'Something went wrong.');
        return;
      }

      router.push(`/staff/students/${body.id}`);
    } catch {
      setError('Could not connect to the server.');
    } finally {
      setSubmitting(false);
    }
  }

  if (programmes.length === 0) {
    return (
      <p className="text-sm text-rust">
        No programmes exist yet. Create a programme (via the seed script or the
        Programmes API) before adding students.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      {error && (
        <p className="text-sm text-rust bg-rust/10 px-3 py-2 rounded-sm">
          {error}
        </p>
      )}

      <div>
        <label className="label" htmlFor="fullName">
          Full name
        </label>
        <input
          id="fullName"
          className="input"
          required
          value={form.fullName}
          onChange={(e) => setForm({ ...form, fullName: e.target.value })}
        />
      </div>

      <div>
        <label className="label" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          className="input"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
      </div>

      <div>
        <label className="label" htmlFor="dob">
          Date of birth
        </label>
        <input
          id="dob"
          type="date"
          className="input"
          required
          value={form.dateOfBirth}
          onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="programme">
            Programme
          </label>
          <select
            id="programme"
            className="input"
            value={form.programmeId}
            onChange={(e) => setForm({ ...form, programmeId: e.target.value })}
          >
            {programmes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          {selectedProgramme && (
            <p className="text-xs text-ink/50 mt-1">
              Fee: {formatCurrency(selectedProgramme.feeAmount)}, snapshotted
              onto this student at creation.
            </p>
          )}
        </div>
        <div>
          <label className="label" htmlFor="academicYear">
            Academic year
          </label>
          <input
            id="academicYear"
            type="number"
            min={1}
            max={7}
            className="input"
            required
            value={form.academicYear}
            onChange={(e) => setForm({ ...form, academicYear: e.target.value })}
          />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="status">
          Enrolment status
        </label>
        <select
          id="status"
          className="input"
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
        >
          <option value="ENROLLED">Enrolled</option>
          <option value="DEFERRED">Deferred</option>
          <option value="WITHDRAWN">Withdrawn</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </div>

      <p className="text-xs text-ink/50">
        A Student ID (SMS-{new Date().getFullYear()}-NNNN) and a 30-day fee due
        date are assigned automatically.
      </p>

      <button className="btn-primary w-full" disabled={submitting}>
        {submitting ? 'Creating…' : 'Create student'}
      </button>
    </form>
  );
}
