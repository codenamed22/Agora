const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const events = [
    {
      title: "Introduction to Tensor Processing Units (TPUs)",
      description:
        "Deepak Singh, SWE 3 at Google and previously SDE 2 at Uber and Microsoft plus SDE Intern at Amazon, will introduce Tensor Processing Units, why they matter for modern machine learning workloads, how they differ from GPUs, and when builders should consider using them for training or inference.",
      imageUrl: "https://fbxzb7sb0uusum4k.public.blob.vercel-storage.com/event1",
      location: "Online",
      startsAt: new Date("2026-06-22T17:30:00.000Z"),
      endsAt: new Date("2026-06-22T18:30:00.000Z"),
      published: true,
    },
  ];

  for (const event of events) {
    const existingEvent = await prisma.event.findFirst({
      where: { title: event.title },
      select: { id: true },
    });

    if (existingEvent) {
      await prisma.event.update({
        where: { id: existingEvent.id },
        data: event,
      });
    } else {
      await prisma.event.create({ data: event });
    }
  }

  const problems = [
    {
      slug: "sum-two-numbers",
      title: "Sum Two Numbers",
      statement:
        "Read two integers from standard input and print their sum.\n\nThis warm-up problem verifies that your program can read input and write output in the ShardUp judge.",
      constraints: "-10^9 <= a, b <= 10^9",
      tags: ["Math", "Warm-up"],
      difficulty: "EASY",
      timeLimitMs: 2000,
      published: true,
      testCases: [
        { input: "2 3\n", expectedOutput: "5\n", isSample: true, order: 1 },
        { input: "-4 10\n", expectedOutput: "6\n", isSample: true, order: 2 },
        {
          input: "1000000000 1000000000\n",
          expectedOutput: "2000000000\n",
          isSample: false,
          order: 3,
        },
      ],
    },
  ];

  for (const problem of problems) {
    const { testCases, ...problemData } = problem;
    const savedProblem = await prisma.problem.upsert({
      where: { slug: problem.slug },
      update: problemData,
      create: problemData,
      select: { id: true },
    });

    await prisma.testCase.deleteMany({ where: { problemId: savedProblem.id } });
    await prisma.testCase.createMany({
      data: testCases.map((testCase) => ({ ...testCase, problemId: savedProblem.id })),
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
