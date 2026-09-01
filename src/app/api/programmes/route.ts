import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireStaff, handleApiError } from '@/lib/api-guard';

export async function GET() {
  const denied = await requireStaff();
  if (denied) return denied;

  try {
    const programmes = await prisma.programme.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { students: true } } },
    });
    return NextResponse.json(programmes);
  } catch (err) {
    return handleApiError(err, 'Could not load programmes.');
  }
}

export async function POST(req: NextRequest) {
  const denied = await requireStaff();
  if (denied) return denied;

  try {
    const body = await req.json();
    const { name, feeAmount } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Programme name is required.' },
        { status: 400 },
      );
    }

    const fee = Number(feeAmount);
    if (!Number.isFinite(fee) || fee < 1) {
      return NextResponse.json(
        { error: 'Fee amount must be a positive number.' },
        { status: 400 },
      );
    }

    const programme = await prisma.programme.create({
      data: { name, feeAmount: fee },
    });
    return NextResponse.json(programme, { status: 201 });
  } catch (err) {
    return handleApiError(err, 'Could not create programme.');
  }
}
