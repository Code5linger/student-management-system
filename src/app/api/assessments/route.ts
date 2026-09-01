import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireStaff, handleApiError } from '@/lib/api-guard';

export async function GET() {
  const denied = await requireStaff();
  if (denied) return denied;

  try {
    const assessments = await prisma.assessment.findMany({
      include: {
        programme: true,
        _count: { select: { submissions: true } },
      },
      orderBy: { deadline: 'asc' },
    });
    return NextResponse.json(assessments);
  } catch (err) {
    return handleApiError(err, 'Could not load assessments.');
  }
}

export async function POST(req: NextRequest) {
  const denied = await requireStaff();
  if (denied) return denied;

  try {
    const body = await req.json();
    const { title, module, deadline, programmeId } = body;

    if (!title || !module || !deadline) {
      return NextResponse.json(
        { error: 'Title, module, and deadline are required.' },
        { status: 400 },
      );
    }
    if (Number.isNaN(Date.parse(deadline))) {
      return NextResponse.json(
        { error: 'Deadline is not a valid date/time.' },
        { status: 400 },
      );
    }
    if (programmeId) {
      const programme = await prisma.programme.findUnique({
        where: { id: programmeId },
      });
      if (!programme) {
        return NextResponse.json(
          { error: 'Selected programme does not exist.' },
          { status: 400 },
        );
      }
    }

    const assessment = await prisma.assessment.create({
      data: {
        title,
        module,
        deadline: new Date(deadline),
        programmeId: programmeId || null,
      },
    });

    return NextResponse.json(assessment, { status: 201 });
  } catch (err) {
    return handleApiError(err, 'Could not create assessment.');
  }
}
