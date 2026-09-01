import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { computeBalance, isOverdue } from '@/lib/registry';
import { requireStaff, handleApiError } from '@/lib/api-guard';

export async function GET() {
  const denied = await requireStaff();
  if (denied) return denied;

  try {
    const students = await prisma.student.findMany({
      include: { programme: true, payments: true },
    });

    const overdue = students
      .map((s: (typeof students)[number]) => {
        const balance = computeBalance(s.assignedFee, s.payments);
        return { ...s, balance };
      })
      .filter((s: { feeDueDate: Date; balance: number }) =>
        isOverdue(s.feeDueDate, s.balance),
      );

    const lateSubmissions = await prisma.submission.findMany({
      where: { isLate: true },
      include: { student: true, assessment: true },
      orderBy: { submittedAt: 'desc' },
      take: 10,
    });

    const pendingGrades = await prisma.grade.findMany({
      where: { publishedAt: null },
      include: { student: true, submission: { include: { assessment: true } } },
      orderBy: { gradedAt: 'desc' },
      take: 10,
    });

    const counts = {
      totalStudents: students.length,
      enrolled: students.filter(
        (s: (typeof students)[number]) => s.status === 'ENROLLED',
      ).length,
      deferred: students.filter(
        (s: (typeof students)[number]) => s.status === 'DEFERRED',
      ).length,
      withdrawn: students.filter(
        (s: (typeof students)[number]) => s.status === 'WITHDRAWN',
      ).length,
      completed: students.filter(
        (s: (typeof students)[number]) => s.status === 'COMPLETED',
      ).length,
      overdueCount: overdue.length,
    };

    return NextResponse.json({
      counts,
      overdue: overdue.map((s: (typeof overdue)[number]) => ({
        id: s.id,
        studentId: s.studentId,
        fullName: s.fullName,
        status: s.status,
        balance: s.balance,
        feeDueDate: s.feeDueDate,
      })),
      lateSubmissions,
      pendingGrades,
    });
  } catch (err) {
    return handleApiError(err, 'Could not load dashboard data.');
  }
}
