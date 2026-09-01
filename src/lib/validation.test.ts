import { describe, it, expect } from 'vitest';
import {
  createStudentSchema,
  createPaymentSchema,
  gradeSchema,
  firstZodError,
} from './validation';

describe('createStudentSchema', () => {
  const validBase = {
    fullName: '  Amina Rahman  ',
    email: 'Amina@Example.COM',
    dateOfBirth: '2003-04-12',
    programmeId: 'prog_1',
    academicYear: 2,
  };

  it('accepts valid input and normalizes name/email', () => {
    const result = createStudentSchema.safeParse(validBase);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.fullName).toBe('Amina Rahman');
      expect(result.data.email).toBe('amina@example.com');
    }
  });

  it('rejects a future date of birth', () => {
    const result = createStudentSchema.safeParse({
      ...validBase,
      dateOfBirth: '2099-01-01',
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(firstZodError(result.error)).toMatch(/future/i);
  });

  it('rejects a student under the minimum age', () => {
    const today = new Date();
    const tooYoung = new Date(today.getFullYear() - 1, 0, 1).toISOString();
    const result = createStudentSchema.safeParse({
      ...validBase,
      dateOfBirth: tooYoung,
    });
    expect(result.success).toBe(false);
    if (!result.success)
      expect(firstZodError(result.error)).toMatch(/5 years old/i);
  });

  it('rejects academic year 0 and 9 (outside 1-8)', () => {
    expect(
      createStudentSchema.safeParse({ ...validBase, academicYear: 0 }).success,
    ).toBe(false);
    expect(
      createStudentSchema.safeParse({ ...validBase, academicYear: 9 }).success,
    ).toBe(false);
  });

  it('rejects a malformed email', () => {
    const result = createStudentSchema.safeParse({
      ...validBase,
      email: 'not-an-email',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a missing programmeId', () => {
    const { ...withoutProgramme } = validBase;
    const result = createStudentSchema.safeParse(withoutProgramme);
    expect(result.success).toBe(false);
  });
});

describe('createPaymentSchema', () => {
  it('rejects zero and negative amounts', () => {
    expect(
      createPaymentSchema.safeParse({ amount: 0, referenceNumber: 'TXN-1' })
        .success,
    ).toBe(false);
    expect(
      createPaymentSchema.safeParse({ amount: -50, referenceNumber: 'TXN-1' })
        .success,
    ).toBe(false);
  });

  it('accepts a positive amount with a reference number', () => {
    expect(
      createPaymentSchema.safeParse({ amount: 500, referenceNumber: 'TXN-1' })
        .success,
    ).toBe(true);
  });

  it('rejects a blank reference number', () => {
    expect(
      createPaymentSchema.safeParse({ amount: 500, referenceNumber: '   ' })
        .success,
    ).toBe(false);
  });
});

describe('gradeSchema (boolean handling)', () => {
  it('accepts a real boolean false for published', () => {
    const result = gradeSchema.safeParse({ score: 70, published: false });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.published).toBe(false);
  });

  it('rejects the string "false" rather than silently coercing it to true', () => {
    // This is the exact z.coerce.boolean() footgun the schema deliberately avoids: JS's Boolean("false") is true. A strict boolean schema should reject a string entirely rather than misinterpret it.
    const result = gradeSchema.safeParse({
      score: 70,
      published: 'false' as unknown as boolean,
    });
    expect(result.success).toBe(false);
  });

  it('defaults published to false when omitted', () => {
    const result = gradeSchema.safeParse({ score: 70 });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.published).toBe(false);
  });

  it('rejects out-of-range and non-integer scores', () => {
    expect(gradeSchema.safeParse({ score: -1 }).success).toBe(false);
    expect(gradeSchema.safeParse({ score: 101 }).success).toBe(false);
    expect(gradeSchema.safeParse({ score: 75.5 }).success).toBe(false);
  });
});
