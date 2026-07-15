const fs = require('fs');
const filePath = 'apps/web/lib/api/components.ts';
let code = fs.readFileSync(filePath, 'utf8');

const newAction = `
const deleteComponentSchema = z.object({
  componentId: z.number().int().positive(),
})

export const deleteComponentAction = async (
  input: z.infer<typeof deleteComponentSchema>,
) => {
  const { userId } = await auth()
  if (!userId) {
    throw new Error("You must be logged in to delete a component")
  }
  
  const { componentId } = deleteComponentSchema.parse(input)
  
  // We need to use supabase admin or client.
  // Actually let's import it
}
`;

// wait, I can just use sed or manually write it.
