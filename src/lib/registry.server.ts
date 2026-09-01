import { prisma } from './prisma';

export async function generateStudentId(
  enrolmentDate: Date = new Date(),
): Promise<string> {
  const year = enrolmentDate.getFullYear();

  const rows = await prisma.$queryRaw<{ value: number }[]>`
    INSERT INTO "IdCounter" (key, value) VALUES ('student', 1)
    ON CONFLICT (key) DO UPDATE SET value = "IdCounter".value + 1
    RETURNING value;
  `;

  const sequence = rows[0].value;
  return `SMS-${year}-${String(sequence).padStart(4, '0')}`;
}
