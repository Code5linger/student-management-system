import { NextRequest, NextResponse } from 'next/server';
import { prisma, Prisma } from '@/lib/prisma';
import { requireStaff, handleApiError } from '@/lib/api-guard';
import { computeBalance, OverpaymentError } from '@/lib/registry';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireStaff();
  if (denied) return denied;

  const { id } = await params;

  try {
    const body = await req.json();
    const { amount, referenceNumber, date } = body;

    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      return NextResponse.json(
        { error: 'Amount must be a positive number.' },
        { status: 400 },
      );
    }
    if (
      !referenceNumber ||
      typeof referenceNumber !== 'string' ||
      !referenceNumber.trim()
    ) {
      return NextResponse.json(
        { error: 'Reference number is required.' },
        { status: 400 },
      );
    }
    if (date && Number.isNaN(Date.parse(date))) {
      return NextResponse.json(
        { error: 'Payment date is not a valid date.' },
        { status: 400 },
      );
    }

    const payment = await prisma.$transaction(
      async (tx) => {
        const student = await tx.student.findUnique({
          where: { id },
          include: { payments: true },
        });

        if (!student) {
          throw new Error('STUDENT_NOT_FOUND');
        }

        const currentBalance = computeBalance(
          student.assignedFee,
          student.payments,
        );

        if (amt > currentBalance) {
          throw new OverpaymentError(
            `This payment (£${amt.toFixed(2)}) exceeds the outstanding balance (£${currentBalance.toFixed(2)}).`,
          );
        }

        return tx.payment.create({
          data: {
            studentId: id,
            amount: amt,
            referenceNumber: referenceNumber.trim(),
            date: date ? new Date(date) : new Date(),
          },
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );

    return NextResponse.json(payment, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message === 'STUDENT_NOT_FOUND') {
      return NextResponse.json(
        { error: 'Student not found.' },
        { status: 404 },
      );
    }
    return handleApiError(err, 'Could not record payment.');
  }
}
