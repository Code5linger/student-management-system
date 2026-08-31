import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { classifyScore } from '../src/lib/registry';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Clearing existing data...');

  await prisma.grade.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.assessment.deleteMany();
  await prisma.student.deleteMany();
  await prisma.programme.deleteMany();
  await prisma.idCounter.deleteMany();

  const daysAgo = (n: number) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d;
  };

  const daysFromNow = (n: number) => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d;
  };

  console.log('Creating programmes...');

  const computing = await prisma.programme.create({
    data: {
      name: 'BSc (Hons) Computer Science',
      feeAmount: 9250,
    },
  });

  const business = await prisma.programme.create({
    data: {
      name: 'BA (Hons) Business Management',
      feeAmount: 8500,
    },
  });

  console.log(
    'Enrolling Olivia at the original Computer Science fee (£9,250)...',
  );

  const olivia = await prisma.student.create({
    data: {
      studentId: 'SMS-2026-0001',
      fullName: 'Olivia Thompson',
      email: 'olivia.thompson@example.ac.uk',
      dateOfBirth: new Date('2000-09-30'),
      programmeId: computing.id,
      academicYear: 3,
      status: 'COMPLETED',
      assignedFee: 9250,
      feeDueDate: daysAgo(300),
      createdAt: daysAgo(900),
    },
  });

  console.log(
    'Raising the Computer Science programme fee to £9,500 (simulating a later fee increase)...',
  );

  await prisma.programme.update({
    where: { id: computing.id },
    data: {
      feeAmount: 9500,
    },
  });

  console.log('Enrolling the rest of the cohort at current fees...');

  const [amelia, james, sophie, daniel] = await Promise.all([
    prisma.student.create({
      data: {
        studentId: 'SMS-2026-0002',
        fullName: 'Amelia Hughes',
        email: 'amelia.hughes@example.ac.uk',
        dateOfBirth: new Date('2003-04-12'),
        programmeId: computing.id,
        academicYear: 2,
        status: 'ENROLLED',
        assignedFee: 9500,
        feeDueDate: daysAgo(5),
        createdAt: daysAgo(200),
      },
    }),

    prisma.student.create({
      data: {
        studentId: 'SMS-2026-0003',
        fullName: 'James Wilson',
        email: 'james.wilson@example.ac.uk',
        dateOfBirth: new Date('2002-11-03'),
        programmeId: computing.id,
        academicYear: 3,
        status: 'ENROLLED',
        assignedFee: 9500,
        feeDueDate: daysFromNow(20),
        createdAt: daysAgo(150),
      },
    }),

    prisma.student.create({
      data: {
        studentId: 'SMS-2026-0004',
        fullName: 'Sophie Patel',
        email: 'sophie.patel@example.ac.uk',
        dateOfBirth: new Date('2004-01-22'),
        programmeId: business.id,
        academicYear: 1,
        status: 'DEFERRED',
        assignedFee: 8500,
        feeDueDate: daysAgo(10),
        createdAt: daysAgo(60),
      },
    }),

    prisma.student.create({
      data: {
        studentId: 'SMS-2026-0005',
        fullName: 'Daniel Morgan',
        email: 'daniel.morgan@example.ac.uk',
        dateOfBirth: new Date('2001-07-15'),
        programmeId: business.id,
        academicYear: 3,
        status: 'WITHDRAWN',
        assignedFee: 8500,
        feeDueDate: daysAgo(90),
        createdAt: daysAgo(400),
      },
    }),
  ]);

  console.log(
    'Seeding the Student ID counter so live-created students continue from SMS-2026-0006...',
  );

  await prisma.idCounter.create({
    data: {
      key: 'student',
      value: 5,
    },
  });

  console.log(
    "Recording payments (each within its student's assigned fee, no over payments)...",
  );

  await prisma.payment.createMany({
    data: [
      {
        studentId: amelia.id,
        amount: 2500,
        referenceNumber: 'PAY-UK-1001',
        date: daysAgo(190),
      },
      {
        studentId: james.id,
        amount: 9500,
        referenceNumber: 'PAY-UK-1002',
        date: daysAgo(140),
      },
      {
        studentId: daniel.id,
        amount: 4000,
        referenceNumber: 'PAY-UK-1003',
        date: daysAgo(395),
      },
      {
        studentId: olivia.id,
        amount: 9250,
        referenceNumber: 'PAY-UK-1004',
        date: daysAgo(880),
      },
    ],
  });

  console.log('Creating assessments...');

  const programmingAssessment = await prisma.assessment.create({
    data: {
      title: 'Programming Fundamentals Coursework',
      module: 'Programming Fundamentals',
      deadline: daysAgo(3),
      programmeId: computing.id,
    },
  });

  const businessAssessment = await prisma.assessment.create({
    data: {
      title: 'Strategic Marketing Case Study',
      module: 'Strategic Marketing',
      deadline: daysFromNow(10),
      programmeId: business.id,
    },
  });

  console.log('Creating submissions (on-time, late, and ungraded)...');

  const onTimeSubmission = await prisma.submission.create({
    data: {
      studentId: james.id,
      assessmentId: programmingAssessment.id,
      fileName: 'james-wilson-programming-coursework.pdf',
      filePath: '/uploads/seed-placeholder.pdf',
      isLate: false,
      submittedAt: daysAgo(5),
    },
  });

  const lateSubmission = await prisma.submission.create({
    data: {
      studentId: amelia.id,
      assessmentId: programmingAssessment.id,
      fileName: 'amelia-hughes-programming-coursework.pdf',
      filePath: '/uploads/seed-placeholder.pdf',
      isLate: true,
      submittedAt: daysAgo(1),
    },
  });

  await prisma.submission.create({
    data: {
      studentId: sophie.id,
      assessmentId: businessAssessment.id,
      fileName: 'sophie-patel-marketing-case-study.pdf',
      filePath: '/uploads/seed-placeholder.pdf',
      isLate: false,
      submittedAt: daysAgo(2),
    },
  });

  console.log(
    'Entering grades (one published, one withheld, one left ungraded)...',
  );

  await prisma.grade.create({
    data: {
      submissionId: onTimeSubmission.id,
      studentId: james.id,
      score: 78,
      classification: classifyScore(78),
      publishedAt: daysAgo(4),
    },
  });

  await prisma.grade.create({
    data: {
      submissionId: lateSubmission.id,
      studentId: amelia.id,
      score: 52,
      classification: classifyScore(52),
      publishedAt: null,
    },
  });

  console.log('Seed complete.');

  console.log({
    programmes: 2,
    students: 5,
    payments: 4,
    assessments: 2,
    submissions: 3,
    grades: 2,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
