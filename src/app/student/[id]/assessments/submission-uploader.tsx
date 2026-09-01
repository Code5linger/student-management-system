'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

export function SubmissionUploader({
  assessmentId,
  studentId,
  hasExisting,
}: {
  assessmentId: string;
  studentId: string;
  hasExisting: boolean;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError('Choose a PDF or DOCX file first.');
      return;
    }

    const formData = new FormData();
    formData.append('studentId', studentId);
    formData.append('file', file);

    setSubmitting(true);
    const res = await fetch(`/api/assessments/${assessmentId}/submissions`, {
      method: 'POST',
      body: formData,
    });
    setSubmitting(false);

    if (!res.ok) {
      const body = await res.json();
      setError(body.error ?? 'Upload failed.');
      return;
    }

    if (fileRef.current) fileRef.current.value = '';
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-3">
      <input
        ref={fileRef}
        type="file"
        accept=".pdf,.docx"
        className="text-sm"
      />
      <button className="btn-primary" disabled={submitting}>
        {submitting ? 'Uploading…' : hasExisting ? 'Resubmit' : 'Submit'}
      </button>
      {error && <span className="text-rust text-xs">{error}</span>}
    </form>
  );
}
