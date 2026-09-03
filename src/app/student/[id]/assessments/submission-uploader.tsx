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

  const [fileName, setFileName] = useState('');

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

    try {
      const res = await fetch(`/api/assessments/${assessmentId}/submissions`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json();
        setError(body.error ?? 'Upload failed.');
        return;
      }

      if (fileRef.current) {
        fileRef.current.value = '';
      }

      setFileName('');
      router.refresh();
    } catch {
      setError('Could not connect to the server.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];

    setFileName(file?.name ?? '');
    setError(null);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        ref={fileRef}
        type="file"
        accept=".pdf,.docx"
        onChange={handleFileChange}
        className="hidden"
      />

      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={submitting}
        className="w-full rounded-md border-2 border-dashed border-gray-300 px-6 py-6 text-center transition hover:border-gray-500 hover:bg-gray-50 disabled:opacity-50"
      >
        <div className="text-2xl mb-2">↑</div>

        <div className="font-semibold">
          {fileName ? 'Change submission file' : 'Upload your submission'}
        </div>

        <div className="mt-1 text-sm text-gray-500">
          {fileName ? fileName : 'Click to choose a PDF or DOCX file'}
        </div>

        <div className="mt-2 text-xs text-gray-400">PDF or DOCX</div>
      </button>

      {error && (
        <p className="text-sm text-rust bg-rust/10 px-3 py-2 rounded-sm">
          {error}
        </p>
      )}

      <button
        type="submit"
        className="btn-primary w-full"
        disabled={submitting || !fileName}
      >
        {submitting
          ? 'Uploading…'
          : hasExisting
            ? 'Resubmit assignment'
            : 'Submit assignment'}
      </button>
    </form>
  );
}
