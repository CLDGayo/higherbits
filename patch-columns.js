const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'apps/web/components/features/studio/ui/components-table.tsx');
let code = fs.readFileSync(file, 'utf8');

// Find the end of the columns array
// It's before `if (isAdmin) {`

const adminColIndex = code.indexOf('if (isAdmin) {');
if (adminColIndex > -1) {
  const codeBefore = code.substring(0, adminColIndex);
  const codeAfter = code.substring(adminColIndex);
  
  const actionsCol = `
  if (isOwnProfile || isAdmin) {
    columns.push({
      header: "Actions",
      id: "actions",
      cell: ({ row }) => {
        const componentId = row.original.component_id ?? row.original.component?.id;
        const [isDeleting, setIsDeleting] = useState(false);

        if (!componentId) return null;

        const handleDelete = async (e: React.MouseEvent) => {
          e.stopPropagation();
          if (!confirm("Are you sure you want to delete this component? This action cannot be undone.")) return;
          
          setIsDeleting(true);
          try {
            await deleteComponentAction({ componentId });
            toast.success("Component deleted successfully");
            router.refresh();
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to delete component");
            setIsDeleting(false);
          }
        };

        return (
          <div className="flex justify-end pr-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              <Trash2 size={16} />
              <span className="sr-only">Delete</span>
            </Button>
          </div>
        );
      },
      size: 80,
    });
  }

  `;
  
  fs.writeFileSync(file, codeBefore + actionsCol + codeAfter);
}
