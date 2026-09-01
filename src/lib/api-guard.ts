import { NextResponse } from 'next/server';
import { getSession, isStaff, isStudent } from './session';
import { OverpaymentError, PublishedGradeEditError } from './registry';

/* Returns a 403 NextResponse if the current request isn't from a "staff" session, or null if it's fine to proceed. Use like: const denied = await requireStaff(); if (denied) return denied; */
export async function requireStaff(): Promise<NextResponse | null> {
  const session = await getSession();
  if (!isStaff(session)) {
    return NextResponse.json(
      { error: 'Staff access required.' },
      { status: 403 },
    );
  }
  return null;
}

/* Returns a 403 if the current request isn't a "student" session for the given studentId (or any student session, if studentId is omitted). */
export async function requireStudent(
  studentId?: string,
): Promise<NextResponse | null> {
  const session = await getSession();
  if (!isStudent(session, studentId)) {
    return NextResponse.json(
      { error: 'Student access required for this record.' },
      { status: 403 },
    );
  }
  return null;
}

/* Centralizes turning unexpected errors into a safe 500, and known error types into the right status code. */
export function handleApiError(
  err: unknown,
  fallbackMessage: string,
): NextResponse {
  if (
    err instanceof OverpaymentError ||
    err instanceof PublishedGradeEditError
  ) {
    return NextResponse.json({ error: err.message }, { status: 409 });
  }

  const code = (err as { code?: string } | null)?.code;
  if (code === 'P2025') {
    return NextResponse.json({ error: 'Record not found.' }, { status: 404 });
  }
  if (code === 'P2002') {
    return NextResponse.json(
      { error: 'That value is already in use.' },
      { status: 409 },
    );
  }

  if (
    code === '40001' ||
    (err as { message?: string } | null)?.message?.includes(
      'could not serialize access',
    )
  ) {
    return NextResponse.json(
      {
        error:
          'That conflicted with another update happening at the same time, please try again.',
      },
      { status: 409 },
    );
  }

  console.error(err);
  return NextResponse.json({ error: fallbackMessage }, { status: 500 });
}
