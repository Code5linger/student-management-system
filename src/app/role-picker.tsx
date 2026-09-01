'use client';

import { useState, useTransition } from 'react';
import { enterAsStaff, enterAsStudent } from './actions';

type StudentOption = { id: string; studentId: string; fullName: string };

export function RolePicker({ students }: { students: StudentOption[] }) {
  const [mode, setMode] = useState<'choose' | 'student'>('choose');
  const [selected, setSelected] = useState(students[0]?.id ?? '');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (mode === 'choose') {
    return (
      <div className="grid gap-3">
        <button
          className="btn-primary w-full py-3"
          onClick={() => startTransition(() => enterAsStaff())}
        >
          Enter as Staff
        </button>
        <button
          className="btn-secondary w-full py-3"
          onClick={() => setMode('student')}
        >
          Enter as a Student
        </button>
      </div>
    );
  }

  return (
    <div className="card space-y-4">
      {error && (
        <p className="text-sm text-rust bg-rust/10 px-3 py-2 rounded-sm">
          {error}
        </p>
      )}
      <div>
        <label className="label" htmlFor="student-select">
          Which student are you?
        </label>
        <select
          id="student-select"
          className="input"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
        >
          {students.length === 0 && (
            <option value="">No students yet, seed the database first</option>
          )}
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.studentId} - {s.fullName}
            </option>
          ))}
        </select>
      </div>
      <div className="flex gap-2">
        <button
          className="btn-secondary flex-1"
          onClick={() => setMode('choose')}
        >
          Back
        </button>
        <button
          className="btn-primary flex-1"
          disabled={!selected || isPending}
          onClick={() =>
            startTransition(async () => {
              setError(null);
              const result = await enterAsStudent(selected);
              if (result?.error) setError(result.error);
            })
          }
        >
          {isPending ? 'Continuing…' : 'Continue'}
        </button>
      </div>
    </div>
  );
}
