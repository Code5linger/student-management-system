import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireStaff, handleApiError } from '@/lib/api-guard';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireStaff();
  if (denied) return denied;

  const { id } = await params;

  try {
    const assessment = await prisma.assessment.findUnique({
      where: { id },
      include: {
        programme: true,
        submissions: {
          include: { student: true, grade: true },
          orderBy: { submittedAt: 'asc' },
        },
      },
    });

    if (!assessment) {
      return NextResponse.json(
        { error: 'Assessment not found.' },
        { status: 404 },
      );
    }
    return NextResponse.json(assessment);
  } catch (err) {
    return handleApiError(err, 'Could not load assessment.');
  }
}
