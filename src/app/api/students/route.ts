import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateStudentId } from '@/lib/registry.server';
import {
  defaultFeeDueDate,
  normalizeEmail,
  meetsMinimumAge,
  toNumber,
} from '@/lib/registry';
import { requireStaff, handleApiError } from '@/lib/api-guard';
import { EnrolmentStatus } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const denied = await requireStaff();
  if (denied) return denied;

  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q')?.trim();
    const programmeId = searchParams.get('programmeId') ?? undefined;
    const status = searchParams.get('status') as EnrolmentStatus | null;
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const pageSize = Math.min(
      100,
      Math.max(1, Number(searchParams.get('pageSize')) || 20),
    );

    const where = {
      AND: [
        q
          ? {
              OR: [
                { fullName: { contains: q, mode: 'insensitive' as const } },
                { studentId: { contains: q, mode: 'insensitive' as const } },
                { email: { contains: q, mode: 'insensitive' as const } },
              ],
            }
          : {},
        programmeId ? { programmeId } : {},
        status ? { status } : {},
      ],
    };

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        include: { programme: true, payments: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.student.count({ where }),
    ]);

    return NextResponse.json({ students, total, page, pageSize });
  } catch (err) {
    return handleApiError(err, 'Could not load students.');
  }
}

export async function POST(req: NextRequest) {
  const denied = await requireStaff();
  if (denied) return denied;

  try {
    const body = await req.json();
    const {
      fullName,
      dateOfBirth,
      programmeId,
      academicYear,
      status,
      assignedFee,
    } = body;
    const email =
      typeof body.email === 'string' ? normalizeEmail(body.email) : body.email;

    if (!fullName || typeof fullName !== 'string' || !fullName.trim()) {
      return NextResponse.json(
        { error: 'Full name is required.' },
        { status: 400 },
      );
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'A valid email is required.' },
        { status: 400 },
      );
    }
    if (!dateOfBirth || Number.isNaN(Date.parse(dateOfBirth))) {
      return NextResponse.json(
        { error: 'A valid date of birth is required.' },
        { status: 400 },
      );
    }
    if (!programmeId) {
      return NextResponse.json(
        { error: 'A programme is required.' },
        { status: 400 },
      );
    }
    if (
      !Number.isInteger(Number(academicYear)) ||
      Number(academicYear) < 1 ||
      Number(academicYear) > 8
    ) {
      return NextResponse.json(
        { error: 'Academic year must be a whole number between 1 and 8.' },
        { status: 400 },
      );
    }

    const dob = new Date(dateOfBirth);
    const now = new Date();
    if (dob.getTime() > now.getTime()) {
      return NextResponse.json(
        { error: 'Date of birth cannot be in the future.' },
        { status: 400 },
      );
    }
    if (!meetsMinimumAge(dob, now.getFullYear())) {
      return NextResponse.json(
        {
          error:
            'Student must be at least 5 years old as of January 1st of the enrolment year.',
        },
        { status: 400 },
      );
    }

    const programme = await prisma.programme.findUnique({
      where: { id: programmeId },
    });
    if (!programme) {
      return NextResponse.json(
        { error: 'Selected programme does not exist.' },
        { status: 400 },
      );
    }

    // Fee is snapshotted from the programme at enrolment time (optionally
    // overridden by staff) so a later programme fee change doesn't
    // retroactively alter what an already-enrolled student owes.
    let fee = toNumber(programme.feeAmount);
    if (
      assignedFee !== undefined &&
      assignedFee !== null &&
      assignedFee !== ''
    ) {
      const overrideFee = Number(assignedFee);
      if (!Number.isFinite(overrideFee) || overrideFee < 0) {
        return NextResponse.json(
          { error: 'Assigned fee must be a non-negative number.' },
          { status: 400 },
        );
      }
      fee = overrideFee;
    }

    const studentId = await generateStudentId(now);

    const student = await prisma.student.create({
      data: {
        studentId,
        fullName: fullName.trim(),
        email,
        dateOfBirth: dob,
        programmeId,
        academicYear: Number(academicYear),
        status: (status as EnrolmentStatus) ?? 'ENROLLED',
        assignedFee: fee,
        feeDueDate: defaultFeeDueDate(now),
      },
      include: { programme: true },
    });

    return NextResponse.json(student, { status: 201 });
  } catch (err) {
    return handleApiError(err, 'Could not create student.');
  }
}
