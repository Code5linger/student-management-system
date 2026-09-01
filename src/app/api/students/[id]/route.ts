import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireStaff, handleApiError } from '@/lib/api-guard';
import { normalizeEmail } from '@/lib/registry';
import { EnrolmentStatus } from '@/lib/prisma';

const VALID_STATUSES = ['ENROLLED', 'DEFERRED', 'WITHDRAWN', 'COMPLETED'];

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireStaff();
  if (denied) return denied;

  const { id } = await params;

  try {
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        programme: true,
        payments: { orderBy: { date: 'desc' } },
        submissions: {
          include: { assessment: true, grade: true },
          orderBy: { submittedAt: 'desc' },
        },
      },
    });

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found.' },
        { status: 404 },
      );
    }
    return NextResponse.json(student);
  } catch (err) {
    return handleApiError(err, 'Could not load student.');
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireStaff();
  if (denied) return denied;

  const { id } = await params;

  try {
    const body = await req.json();
    const allowed: Record<string, unknown> = {};

    if (body.fullName) allowed.fullName = String(body.fullName).trim();

    if (body.email) {
      const email = normalizeEmail(String(body.email));
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json(
          { error: 'That is not a valid email address.' },
          { status: 400 },
        );
      }
      allowed.email = email;
    }

    if (body.academicYear) {
      const year = Number(body.academicYear);
      if (!Number.isInteger(year) || year < 1 || year > 8) {
        return NextResponse.json(
          { error: 'Academic year must be a whole number between 1 and 8.' },
          { status: 400 },
        );
      }
      allowed.academicYear = year;
    }

    if (body.status) {
      if (!VALID_STATUSES.includes(body.status)) {
        return NextResponse.json(
          { error: `Status must be one of: ${VALID_STATUSES.join(', ')}.` },
          { status: 400 },
        );
      }
      allowed.status = body.status as EnrolmentStatus;
    }

    if (body.feeDueDate) {
      if (Number.isNaN(Date.parse(body.feeDueDate))) {
        return NextResponse.json(
          { error: 'Fee due date is not a valid date.' },
          { status: 400 },
        );
      }
      allowed.feeDueDate = new Date(body.feeDueDate);
    }

    if (body.assignedFee !== undefined) {
      const fee = Number(body.assignedFee);
      if (!Number.isFinite(fee) || fee < 0) {
        return NextResponse.json(
          { error: 'Assigned fee must be a non-negative number.' },
          { status: 400 },
        );
      }
      allowed.assignedFee = fee;
    }

    if (body.programmeId) {
      const programme = await prisma.programme.findUnique({
        where: { id: body.programmeId },
      });
      if (!programme) {
        return NextResponse.json(
          { error: 'Selected programme does not exist.' },
          { status: 400 },
        );
      }
      allowed.programmeId = body.programmeId;
      // Deliberately NOT auto-updating assignedFee here
    }

    const student = await prisma.student.update({
      where: { id },
      data: allowed,
      include: { programme: true },
    });

    return NextResponse.json(student);
  } catch (err) {
    return handleApiError(err, 'Could not update student.');
  }
}
