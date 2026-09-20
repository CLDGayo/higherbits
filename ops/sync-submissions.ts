import prisma from "../apps/web/lib/prisma";

async function syncSubmissions() {
  console.log("Checking components without submissions...");
  const componentsWithoutSubmission = await prisma.components.findMany({
    where: {
      submissions: null
    },
    select: {
      id: true,
      name: true,
      component_slug: true,
      user_id: true,
    }
  });

  console.log(`Found ${componentsWithoutSubmission.length} components needing a submission record.`);

  let createdCount = 0;
  for (const comp of componentsWithoutSubmission) {
    try {
      await prisma.submissions.create({
        data: {
          component_id: comp.id,
          status: "on_review",
          moderators_feedback: null,
        }
      });
      createdCount++;
      console.log(`[OK] Created on_review submission for #${comp.id} (${comp.name})`);
    } catch (err: any) {
      console.error(`[FAIL] Failed to create submission for #${comp.id}:`, err.message);
    }
  }

  console.log(`Successfully synced ${createdCount} of ${componentsWithoutSubmission.length} submissions.`);
}

syncSubmissions()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
