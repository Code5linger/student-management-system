import { Decimal } from '@prisma/client/runtime/client';

/** Default fee due date: 30 days after enrolment, unless overridden. */
export function defaultFeeDueDate(enrolledAt: Date = new Date()): Date {
  const due = new Date(enrolledAt);
  due.setDate(due.getDate() + 30);
  return due;
}

export type Classification = 'Fail' | 'Pass' | 'Merit' | 'Distinction';

/** Pass >= 40, Merit >= 60, Distinction >= 70, Fail >= 39 */
export function classifyScore(score: number): Classification {
  if (score >= 70) return 'Distinction';
  if (score >= 60) return 'Merit';
  if (score >= 40) return 'Pass';
  return 'Fail';
}

export function toNumber(value: Decimal | number | string): number {
  return typeof value === 'object' ? Number(value.toString()) : Number(value);
}

/** Outstanding balance = assigned fee − sum of the student's payments. */
export function computeBalance(
  assignedFee: Decimal | number | string,
  payments: { amount: Decimal | number | string }[],
): number {
  const fee = toNumber(assignedFee);
  const paid = payments.reduce((sum, p) => sum + toNumber(p.amount), 0);
  return Math.round((fee - paid) * 100) / 100;
}

/* Lowercases and trims an email before it's used as a uniqueness key. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/* Minimum-age check: a student must be at least `minAge` years old as of January 1st of `asOfYear` (their enrolment year) */
export function meetsMinimumAge(
  dateOfBirth: Date,
  asOfYear: number,
  minAge = 5,
): boolean {
  const cutoff = new Date(Date.UTC(asOfYear - minAge, 0, 1));
  return dateOfBirth.getTime() <= cutoff.getTime();
}

/** 10MB, not specified by the brief, chosen as a reasonable MVP ceiling for coursework PDFs/DOCX. */
export const MAX_SUBMISSION_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export const ALLOWED_SUBMISSION_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
];

/* A student is overdue when their fee due date has passed and they still owe money, regardless of enrolment status. Withdrawn/Deferred students can still owe money and a real Registry office keeps chasing that balance. */
export function isOverdue(
  feeDueDate: Date,
  balance: number,
  now: Date = new Date(),
): boolean {
  return balance > 0 && feeDueDate.getTime() < now.getTime();
}

export function isLateSubmission(
  deadline: Date,
  submittedAt: Date = new Date(),
): boolean {
  return submittedAt.getTime() > deadline.getTime();
}

/* Thrown when a payment would push a student's balance below zero. Deliberate product decision: over payments are rejected rather than modeled as credit, since the brief doesn't define credit/refund handling */
export class OverpaymentError extends Error {
  constructor(message = 'This payment would exceed the amount owed.') {
    super(message);
    this.name = 'OverpaymentError';
  }
}

/* Thrown when trying to change a published grade's score without first withholding it. */
export class PublishedGradeEditError extends Error {
  constructor(
    message = 'This result is published, withhold it before changing the score.',
  ) {
    super(message);
    this.name = 'PublishedGradeEditError';
  }
}
