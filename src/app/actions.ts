'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 8, // 8 hours
};

export async function enterAsStaff() {
  const cookieStore = await cookies();
  cookieStore.set('sms_role', 'staff', COOKIE_OPTS);
  cookieStore.delete('sms_student_id');
  redirect('/staff');
}

export async function enterAsStudent(
  studentId: string,
): Promise<{ error: string } | void> {
  // Validate the student actually exists before trusting the cookie to it
  // otherwise a stale/forged id would just 404 on every page.
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { id: true },
  });
  if (!student) {
    return { error: 'That student record no longer exists.' };
  }

  const cookieStore = await cookies();
  cookieStore.set('sms_role', 'student', COOKIE_OPTS);
  cookieStore.set('sms_student_id', studentId, COOKIE_OPTS);
  redirect(`/student/${studentId}`);
}

export async function switchRole() {
  const cookieStore = await cookies();
  cookieStore.delete('sms_role');
  cookieStore.delete('sms_student_id');
  redirect('/');
}
