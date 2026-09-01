import { cookies } from 'next/headers';

export type Session =
  | { role: 'staff' }
  | { role: 'student'; studentId: string }
  | null;

export async function getSession(): Promise<Session> {
  const store = await cookies();
  const role = store.get('sms_role')?.value;

  if (role === 'staff') return { role: 'staff' };

  if (role === 'student') {
    const studentId = store.get('sms_student_id')?.value;
    if (studentId) return { role: 'student', studentId };
  }

  return null;
}

export function isStaff(session: Session): session is { role: 'staff' } {
  return session?.role === 'staff';
}

export function isStudent(
  session: Session,
  studentId?: string,
): session is { role: 'student'; studentId: string } {
  if (session?.role !== 'student') return false;
  return studentId ? session.studentId === studentId : true;
}
