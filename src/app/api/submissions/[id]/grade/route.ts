import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { classifyScore, PublishedGradeEditError } from '@/lib/registry';
import { requireStaff, handleApiError } from '@/lib/api-guard';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireStaff();
  if (denied) return denied;

  const { id } = await params;

  try {
    const body = await req.json();
    const { score, published } = body;

    const numericScore = Number(score);
    if (
      !Number.isInteger(numericScore) ||
      numericScore < 0 ||
      numericScore > 100
    ) {
      return NextResponse.json(
        { error: 'Score must be a whole number between 0 and 100.' },
        { status: 400 },
      );
    }

    const submission = await prisma.submission.findUnique({ where: { id } });
    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found.' },
        { status: 404 },
      );
    }

    const existing = await prisma.grade.findUnique({
      where: { submissionId: id },
    });
    const willPublish = Boolean(published);
    const scoreIsChanging =
      existing !== null && existing.score !== numericScore;

    // Published results are controlled academic records, a score can't be silently overwritten while it's still visible to the student. Staff must withhold (publish: false) before changing the score, then republish as a separate, explicit step.
    if (existing?.publishedAt && scoreIsChanging && willPublish) {
      throw new PublishedGradeEditError();
    }

    const classification = classifyScore(numericScore);
    // Preserve the original publish timestamp if it's already published and staying published (score unchanged); otherwise null (withheld) or a fresh timestamp for a brand-new publish.
    const publishedAt = willPublish
      ? (existing?.publishedAt ?? new Date())
      : null;

    const grade = await prisma.grade.upsert({
      where: { submissionId: id },
      update: { score: numericScore, classification, publishedAt },
      create: {
        submissionId: id,
        studentId: submission.studentId,
        score: numericScore,
        classification,
        publishedAt,
      },
    });

    return NextResponse.json(grade, { status: 200 });
  } catch (err) {
    return handleApiError(err, 'Could not save grade.');
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireStaff();
  if (denied) return denied;

  const { id } = await params;

  // Convenience endpoint for toggling publish state without resubmitting the score.
  try {
    const body = await req.json();
    const existing = await prisma.grade.findUnique({
      where: { submissionId: id },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Grade not found.' }, { status: 404 });
    }

    const willPublish = Boolean(body.published);
    const publishedAt = willPublish
      ? (existing.publishedAt ?? new Date())
      : null;

    const grade = await prisma.grade.update({
      where: { submissionId: id },
      data: { publishedAt },
    });
    return NextResponse.json(grade);
  } catch (err) {
    return handleApiError(err, 'Could not update grade.');
  }
}
