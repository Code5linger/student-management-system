'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Programme = { id: string; name: string };

export function NewAssessmentForm({ programmes }: { programmes: Programme[] }) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: '',
    module: '',
    deadline: '',
    programmeId: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const res = await fetch('/api/assessments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    setSubmitting(false);

    if (!res.ok) {
      const body = await res.json();
      setError(body.error ?? 'Something went wrong.');
      return;
    }

    router.push('/staff/assessments');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      {error && (
        <p className="text-sm text-rust bg-rust/10 px-3 py-2 rounded-sm">
          {error}
        </p>
      )}

      <div>
        <label className="label" htmlFor="title">
          Title
        </label>
        <input
          id="title"
          className="input"
          required
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
      </div>

      <div>
        <label className="label" htmlFor="module">
          Module
        </label>
        <input
          id="module"
          className="input"
          required
          value={form.module}
          onChange={(e) => setForm({ ...form, module: e.target.value })}
        />
      </div>

      <div>
        <label className="label" htmlFor="deadline">
          Submission deadline
        </label>
        <input
          id="deadline"
          type="datetime-local"
          className="input"
          required
          value={form.deadline}
          onChange={(e) => setForm({ ...form, deadline: e.target.value })}
        />
      </div>

      <div>
        <label className="label" htmlFor="programme">
          Programme (optional — leave blank to open to everyone)
        </label>
        <select
          id="programme"
          className="input"
          value={form.programmeId}
          onChange={(e) => setForm({ ...form, programmeId: e.target.value })}
        >
          <option value="">All programmes</option>
          {programmes.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <button className="btn-primary w-full" disabled={submitting}>
        {submitting ? 'Creating…' : 'Create assessment'}
      </button>
    </form>
  );
}
