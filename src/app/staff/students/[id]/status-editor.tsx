'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// const STATUSES = ['ENROLLED', 'DEFERRED', 'WITHDRAWN', 'COMPLETED'];

const STATUSES = ['ENROLLED', 'DEFERRED', 'WITHDRAWN', 'COMPLETED'] as const;

type Status = (typeof STATUSES)[number];

export function StatusEditor({
  studentId,
  currentStatus,
}: {
  studentId: string;
  currentStatus: Status;
}) {
  const router = useRouter();

  const [status, setStatus] = useState<Status>(currentStatus);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // async function updateStatus(next: string) {
  //   setStatus(next);
  //   setSaving(true);
  //   await fetch(`/api/students/${studentId}`, {
  //     method: 'PATCH',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify({ status: next }),
  //   });
  //   setSaving(false);
  //   router.refresh();
  // }

  async function updateStatus(next: Status) {
    const previous = status;

    setError(null);
    setStatus(next);
    setSaving(true);

    try {
      const res = await fetch(`/api/students/${studentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: next }),
      });

      const body = await res.json().catch(() => null);

      if (!res.ok) {
        setStatus(previous);
        setError(body?.error ?? 'Could not update status.');
        return;
      }

      router.refresh();
    } catch {
      setStatus(previous);
      setError('Could not connect to the server.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-1">
      <select
        className="input w-40"
        value={status}
        disabled={saving}
        onChange={(e) => updateStatus(e.target.value as Status)}
        aria-label="Student enrolment status"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s.charAt(0) + s.slice(1).toLowerCase()}
          </option>
        ))}
      </select>

      {error && <p className="text-xs text-rust">{error}</p>}
    </div>
  );
}
