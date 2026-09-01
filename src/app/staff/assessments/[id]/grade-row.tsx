'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ClassificationBadge } from '@/components/badges';

type Grade = {
  score: number;
  classification: string;
  publishedAt: string | null;
} | null;

export function GradeRow({
  submissionId,
  existingGrade,
}: {
  submissionId: string;
  existingGrade: Grade;
}) {
  const router = useRouter();
  const [score, setScore] = useState(existingGrade?.score?.toString() ?? '');
  const [published, setPublished] = useState(
    Boolean(existingGrade?.publishedAt),
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function saveGrade(nextPublished: boolean) {
    setError(null);

    const numeric = Number(score);
    if (!Number.isInteger(numeric) || numeric < 0 || numeric > 100) {
      setError('0–100 whole number');
      return;
    }

    setSaving(true);
    const res = await fetch(`/api/submissions/${submissionId}/grade`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score: numeric, published: nextPublished }),
    });
    setSaving(false);

    if (!res.ok) {
      const body = await res.json();
      setError(body.error ?? 'Could not save.');
      return;
    }

    setPublished(nextPublished);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-3">
      <input
        type="number"
        min={0}
        max={100}
        className="input w-20"
        value={score}
        onChange={(e) => setScore(e.target.value)}
        placeholder="0–100"
      />
      {existingGrade && (
        <ClassificationBadge classification={existingGrade.classification} />
      )}
      <button
        className="btn-secondary"
        disabled={saving}
        onClick={() => saveGrade(published)}
      >
        Save
      </button>
      <button
        className={published ? 'btn-secondary' : 'btn-primary'}
        disabled={saving}
        onClick={() => saveGrade(!published)}
      >
        {published ? 'Withhold' : 'Publish'}
      </button>
      {error && (
        <span className="text-rust text-xs max-w-[16rem]">{error}</span>
      )}
    </div>
  );
}
