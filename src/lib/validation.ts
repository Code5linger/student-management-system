import { z } from 'zod';
import { normalizeEmail, meetsMinimumAge } from './registry';

export const ENROLMENT_STATUS_VALUES = [
  'ENROLLED',
  'DEFERRED',
  'WITHDRAWN',
  'COMPLETED',
] as const;

// --- Students ---------------------------------------------------------

const emailField = z
  .string()
  .transform((v) => normalizeEmail(v))
  .pipe(z.email({ error: 'A valid email is required.' }));

export const createStudentSchema = z
  .object({
    fullName: z.string().trim().min(1, { error: 'Full name is required.' }),
    email: emailField,
    dateOfBirth: z.coerce.date({ error: 'A valid date of birth is required.' }),
    programmeId: z.string().min(1, { error: 'A programme is required.' }),
    academicYear: z.coerce.number().int().min(1).max(8, {
      error: 'Academic year must be a whole number between 1 and 8.',
    }),
    status: z.enum(ENROLMENT_STATUS_VALUES).optional(),
    // string check first so an empty string from a form field doesn't get coerced to 0 and treated as "fee explicitly set to zero"
    assignedFee: z
      .union([
        z.coerce
          .number()
          .min(0, { error: 'Assigned fee must be a non-negative number.' }),
        z.literal(''),
      ])
      .optional(),
  })
  .refine((data) => data.dateOfBirth.getTime() <= Date.now(), {
    error: 'Date of birth cannot be in the future.',
    path: ['dateOfBirth'],
  })
  .refine(
    (data) => meetsMinimumAge(data.dateOfBirth, new Date().getFullYear()),
    {
      error:
        'Student must be at least 5 years old as of January 1st of the enrolment year.',
      path: ['dateOfBirth'],
    },
  );

export type CreateStudentInput = z.infer<typeof createStudentSchema>;

export const updateStudentSchema = z.object({
  fullName: z.string().trim().min(1).optional(),
  email: emailField.optional(),
  academicYear: z.coerce
    .number()
    .int()
    .min(1)
    .max(8, { error: 'Academic year must be a whole number between 1 and 8.' })
    .optional(),
  status: z
    .enum(ENROLMENT_STATUS_VALUES, {
      error: `Status must be one of: ${ENROLMENT_STATUS_VALUES.join(', ')}.`,
    })
    .optional(),
  feeDueDate: z.coerce
    .date({ error: 'Fee due date is not a valid date.' })
    .optional(),
  assignedFee: z.coerce
    .number()
    .min(0, { error: 'Assigned fee must be a non-negative number.' })
    .optional(),
  programmeId: z.string().min(1).optional(),
});

export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;

// --- Programmes ---------------------------------------------------------

export const createProgrammeSchema = z.object({
  name: z.string().trim().min(1, { error: 'Programme name is required.' }),
  feeAmount: z.coerce
    .number()
    .min(0, { error: 'Fee amount must be a positive number.' }),
});

// --- Payments -------------------------------------------------------------

export const createPaymentSchema = z.object({
  amount: z.coerce
    .number()
    .positive({ error: 'Amount must be a positive number.' }),
  referenceNumber: z
    .string()
    .trim()
    .min(1, { error: 'Reference number is required.' }),
  date: z.coerce
    .date({ error: 'Payment date is not a valid date.' })
    .optional(),
});

// --- Assessments ------------------------------------------------------

export const createAssessmentSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, { error: 'Title, module, and deadline are required.' }),
  module: z
    .string()
    .trim()
    .min(1, { error: 'Title, module, and deadline are required.' }),
  deadline: z.coerce.date({ error: 'Deadline is not a valid date/time.' }),
  programmeId: z.string().optional(),
});

// --- Grades -------------------------------------------------------------
// `published` is a real JSON boolean from the client, never a string - using z.coerce.boolean() here would be a classic footgun, since JS's Boolean("false") is true. Keep it a strict boolean.

export const gradeSchema = z.object({
  score: z.coerce
    .number()
    .int({ error: 'Score must be a whole number between 0 and 100.' })
    .min(0, { error: 'Score must be a whole number between 0 and 100.' })
    .max(100, { error: 'Score must be a whole number between 0 and 100.' }),
  published: z.boolean().optional().default(false),
});

export const publishToggleSchema = z.object({
  published: z.boolean().optional().default(false),
});

export function firstZodError(error: z.ZodError): string {
  return error.issues[0]?.message ?? 'Invalid input.';
}
