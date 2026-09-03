import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { saveSubmissionFile } from '@/lib/storage';
import { isLateSubmission } from '@/lib/registry';
import { requireStudent, handleApiError } from '@/lib/api-guard';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: assessmentId } = await params;

  try {
    const formData = await req.formData();
    const studentId = formData.get('studentId');
    const file = formData.get('file');

    if (!studentId || typeof studentId !== 'string') {
      return NextResponse.json(
        { error: 'studentId is required.' },
        { status: 400 },
      );
    }

    // A student may only ever submit as themselves, the session's studentId is the source of truth, not just whatever this request claims.
    const denied = await requireStudent(studentId);
    if (denied) return denied;

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'A PDF or DOCX file is required.' },
        { status: 400 },
      );
    }

    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
    });
    if (!assessment) {
      return NextResponse.json(
        { error: 'Assessment not found.' },
        { status: 404 },
      );
    }

    // A student can only submit against an assessment open to their programme(or one open to everyone) not any assessment id they happen to know.
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });
    if (!student) {
      return NextResponse.json(
        { error: 'Student not found.' },
        { status: 404 },
      );
    }
    if (
      assessment.programmeId &&
      assessment.programmeId !== student.programmeId
    ) {
      return NextResponse.json(
        { error: 'This assessment is not open to your programme.' },
        { status: 403 },
      );
    }

    const now = new Date();
    const existing = await prisma.submission.findUnique({
      where: { studentId_assessmentId: { studentId, assessmentId } },
    });

    // Resubmission is only allowed before the deadline. A brand-new (first-time) submission is still accepted after the deadline, just flagged late.
    const pastDeadline = now.getTime() > assessment.deadline.getTime();
    if (existing && pastDeadline) {
      return NextResponse.json(
        {
          error:
            'The deadline has passed, this submission can no longer be replaced.',
        },
        { status: 403 },
      );
    }

    const { fileName, filePath } = await saveSubmissionFile(file);
    const isLate = isLateSubmission(assessment.deadline, now);

    const submission = await prisma.submission.upsert({
      where: { studentId_assessmentId: { studentId, assessmentId } },
      update: { fileName, filePath, isLate, submittedAt: now },
      create: {
        studentId,
        assessmentId,
        fileName,
        filePath,
        isLate,
        submittedAt: now,
      },
    });

    return NextResponse.json(submission, { status: existing ? 200 : 201 });
  } catch (err) {
    if (err instanceof Error && err.message.includes('Only PDF or DOCX')) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return handleApiError(
      err,
      'Could not save submission. Max size 10 10MB and must be PDF or DOCX.',
    );
  }
}
