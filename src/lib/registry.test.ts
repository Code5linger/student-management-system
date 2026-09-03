import { describe, it, expect } from 'vitest';
import {
  computeBalance,
  isOverdue,
  classifyScore,
  isLateSubmission,
  normalizeEmail,
  meetsMinimumAge,
  defaultFeeDueDate,
  OverpaymentError,
  PublishedGradeEditError,
} from './registry';

describe('computeBalance', () => {
  it('returns the full fee when there are no payments', () => {
    expect(computeBalance(4500, [])).toBe(4500);
  });

  it('subtracts a single partial payment', () => {
    expect(computeBalance(4500, [{ amount: 1500 }])).toBe(3000);
  });

  it('sums multiple payments', () => {
    expect(
      computeBalance(4500, [
        { amount: 1500 },
        { amount: 1000 },
        { amount: 500 },
      ]),
    ).toBe(1500);
  });

  it('returns zero when fully paid', () => {
    expect(computeBalance(4500, [{ amount: 4500 }])).toBe(0);
  });

  it('handles string/Decimal-like inputs the same as numbers', () => {
    expect(computeBalance('4500.00', [{ amount: '1500.00' }])).toBe(3000);
  });

  it('rounds to two decimal places to avoid floating point noise', () => {
    // 0.1 + 0.2 !== 0.3 in raw floating point - this is exactly the kind of bug computeBalance's rounding step exists to prevent.
    expect(computeBalance(1, [{ amount: 0.1 }, { amount: 0.2 }])).toBe(0.7);
  });
});

describe('isOverdue', () => {
  const past = new Date('2020-01-01');
  const future = new Date('2099-01-01');
  const now = new Date('2026-01-01');

  it('is not overdue when the balance is fully paid, even if the due date has passed', () => {
    expect(isOverdue(past, 0, now)).toBe(false);
  });

  it('is overdue when there is a balance and the due date has passed', () => {
    expect(isOverdue(past, 100, now)).toBe(true);
  });

  it('is not overdue when there is a balance but the due date is in the future', () => {
    expect(isOverdue(future, 100, now)).toBe(false);
  });

  it('treats a negative balance as not overdue (defensive - should not occur given overpayment rejection)', () => {
    expect(isOverdue(past, -50, now)).toBe(false);
  });
});

describe('classifyScore', () => {
  it('classifies below 40 as Fail', () => {
    expect(classifyScore(0)).toBe('Fail');
    expect(classifyScore(39)).toBe('Fail');
  });

  it('classifies 40-59 as Pass, including the lower boundary', () => {
    expect(classifyScore(40)).toBe('Pass');
    expect(classifyScore(59)).toBe('Pass');
  });

  it('classifies 60-69 as Merit, including the lower boundary', () => {
    expect(classifyScore(60)).toBe('Merit');
    expect(classifyScore(69)).toBe('Merit');
  });

  it('classifies 70 and above as Distinction, including the boundary and the maximum', () => {
    expect(classifyScore(70)).toBe('Distinction');
    expect(classifyScore(100)).toBe('Distinction');
  });
});

describe('isLateSubmission', () => {
  const deadline = new Date('2026-06-15T23:59:59Z');

  it('is not late when submitted before the deadline', () => {
    expect(isLateSubmission(deadline, new Date('2026-06-15T12:00:00Z'))).toBe(
      false,
    );
  });

  it('is late when submitted after the deadline', () => {
    expect(isLateSubmission(deadline, new Date('2026-06-16T00:00:01Z'))).toBe(
      true,
    );
  });

  it('is not late when submitted at exactly the deadline instant', () => {
    expect(isLateSubmission(deadline, new Date(deadline.getTime()))).toBe(
      false,
    );
  });
});

describe('normalizeEmail', () => {
  it('lowercases the email', () => {
    expect(normalizeEmail('Alice@Example.com')).toBe('alice@example.com');
  });

  it('trims surrounding whitespace', () => {
    expect(normalizeEmail('  bob@example.com  ')).toBe('bob@example.com');
  });

  it('treats case-and-whitespace variants as the same normalized value', () => {
    expect(normalizeEmail(' Carol@EXAMPLE.com')).toBe(
      normalizeEmail('carol@example.com  '),
    );
  });
});

describe('meetsMinimumAge', () => {
  it('accepts a student who is exactly the minimum age as of Jan 1st', () => {
    // Born Jan 1 2021, minimum age 5, as-of year 2026 -> exactly 5 on the reference date.
    expect(meetsMinimumAge(new Date(Date.UTC(2021, 0, 1)), 2026, 5)).toBe(true);
  });

  it('rejects a student who is one day short of the minimum age', () => {
    expect(meetsMinimumAge(new Date(Date.UTC(2021, 0, 2)), 2026, 5)).toBe(
      false,
    );
  });

  it('accepts a student well older than the minimum age', () => {
    expect(meetsMinimumAge(new Date(Date.UTC(2000, 5, 15)), 2026, 5)).toBe(
      true,
    );
  });
});

describe('defaultFeeDueDate', () => {
  it('is 30 days after the given enrolment date', () => {
    const enrolledAt = new Date(Date.UTC(2026, 0, 1));
    const due = defaultFeeDueDate(enrolledAt);
    const diffDays =
      (due.getTime() - enrolledAt.getTime()) / (1000 * 60 * 60 * 24);
    expect(diffDays).toBe(30);
  });
});

describe('business-rule errors', () => {
  it('OverpaymentError carries a descriptive default message and correct name', () => {
    const err = new OverpaymentError();
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('OverpaymentError');
    expect(err.message).toMatch(/exceed/i);
  });

  it('PublishedGradeEditError carries a descriptive default message and correct name', () => {
    const err = new PublishedGradeEditError();
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('PublishedGradeEditError');
    expect(err.message).toMatch(/withhold/i);
  });
});
