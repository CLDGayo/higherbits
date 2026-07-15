const fs = require('fs');
const path = require('path');

const serverFile = path.join(__dirname, 'apps/web/lib/api/server/components.ts');
let serverCode = fs.readFileSync(serverFile, 'utf8');

if (!serverCode.includes('deleteComponent')) {
  serverCode += `
export const deleteComponent = async (componentId: number, userId: string) => {
  const component = await prisma.components.findUnique({
    where: { id: componentId }
  });

  if (!component) {
    throw new Error("Component not found");
  }

  // Only allow owner or admin to delete
  if (component.user_id !== userId) {
    throw new Error("Unauthorized to delete this component");
  }

  await prisma.components.delete({
    where: { id: componentId }
  });
};
`;
  fs.writeFileSync(serverFile, serverCode);
}

const apiFile = path.join(__dirname, 'apps/web/lib/api/components.ts');
let apiCode = fs.readFileSync(apiFile, 'utf8');

if (!apiCode.includes('deleteComponentAction')) {
  // modify the import statement
  apiCode = apiCode.replace(/import { getComponentBundles, transferOwnership } from ".\/server\/components"/, 'import { getComponentBundles, transferOwnership, deleteComponent } from "./server/components"');
  
  apiCode += `
const deleteComponentSchema = z.object({
  componentId: z.number().int().positive(),
});

export const deleteComponentAction = async (
  input: z.infer<typeof deleteComponentSchema>,
) => {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const { componentId } = deleteComponentSchema.parse(input);
  await deleteComponent(componentId, userId);
  return { success: true };
};
`;
  fs.writeFileSync(apiFile, apiCode);
}
