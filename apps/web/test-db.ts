import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const components = await prisma.component.findMany({ select: { id: true, name: true, is_public: true }})
  const demos = await prisma.demo.findMany({ select: { id: true, name: true, component_id: true }})
  console.log("Components:", components)
  console.log("Demos:", demos)
}
main().catch(console.error).finally(() => prisma.$disconnect())
