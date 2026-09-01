import { prisma } from '@/lib/prisma';
import { NewAssessmentForm } from './new-assessment-form';

export const dynamic = 'force-dynamic';

export default async function NewAssessmentPage() {
  const programmes = await prisma.programme.findMany({
    orderBy: { name: 'asc' },
  });

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-semibold">New assessment</h1>
      <NewAssessmentForm programmes={JSON.parse(JSON.stringify(programmes))} />
    </div>
  );
}
