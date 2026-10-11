import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  const titleClassName = description ? "text-4xl" : "text-5xl";
  return (
    <header className="flex flex-row items-end gap-2 transition-all w-full mt-2 pt-6 px-6 h-full">
      <div className="flex flex-col gap-1">
        <h1 className={cn("font-semibold tracking-tight mt-2", titleClassName)}>{title}</h1>
        {description && <p className="text-muted-foreground text-sm">{description}</p>}
      </div>
      <div className="ml-auto h-full flex items-end justify-end gap-2">{children}</div>
    </header>
  );
}
