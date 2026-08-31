import { prisma } from '@/lib/prisma';
import { NewStudentForm } from './new-student-form';

export const dynamic = 'force-dynamic';

export default async function NewStudentPage() {
  const programmes = await prisma.programme.findMany({
    orderBy: { name: 'asc' },
  });

  const programmeOptions = programmes.map((programme) => ({
    id: programme.id,
    name: programme.name,
    feeAmount: programme.feeAmount.toString(),
  }));

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-semibold">Add student</h1>

      <NewStudentForm programmes={programmeOptions} />
    </div>
  );
}
