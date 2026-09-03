'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

function generateReferenceNumber() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  let suffix = '';

  for (let i = 0; i < 4; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }

  return `PAY-UK-${suffix}`;
}

export function RecordPaymentForm({
  studentId,
  outstandingBalance,
}: {
  studentId: string;
  outstandingBalance: number;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [referenceNumber, setReferenceNumber] = useState(
    generateReferenceNumber(),
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch(`/api/students/${studentId}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          referenceNumber,
        }),
      });

      const body = await res.json().catch(() => null);

      if (!res.ok) {
        setError(body?.error ?? 'Could not record payment.');
        return;
      }

      setAmount('');
      setReferenceNumber(generateReferenceNumber());

      router.refresh();
    } catch {
      setError('Could not connect to the server.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <p className="text-sm text-rust bg-rust/10 px-3 py-2 rounded-sm">
          {error}
        </p>
      )}
      <div>
        <label className="label" htmlFor="amount">
          Amount
        </label>
        <input
          id="amount"
          type="number"
          min="0.01"
          step="0.01"
          required
          className="input"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={outstandingBalance.toFixed(2)}
        />
      </div>
      <div>
        <label className="label" htmlFor="reference">
          Reference number
        </label>
        <input
          id="reference"
          required
          readOnly
          className="input"
          value={referenceNumber}
        />
      </div>
      <button className="btn-primary w-full" disabled={submitting}>
        {submitting ? 'Saving…' : 'Record payment'}
      </button>
    </form>
  );
}
