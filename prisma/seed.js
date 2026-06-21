const { PrismaClient } = require("@prisma/client");
const { randomUUID } = require("node:crypto");

const prisma = new PrismaClient();

async function main() {
  // Active cohort with a couple of default questions so the apply flow works.
  await prisma.cohort.upsert({
    where: { year: 2027 },
    update: {},
    create: {
      year: 2027,
      isActive: true,
      questions: [
        {
          id: randomUUID(),
          label: "What do you want to build or improve through ShardUp?",
          required: true,
        },
        { id: randomUUID(), label: "Relevant experience or projects", required: false },
      ],
    },
  });

  // Sample events.
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
      await prisma.event.update({ where: { id: existingEvent.id }, data: event });
    } else {
      await prisma.event.create({ data: event });
    }
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
