"use client";
import { ScrollArea } from "@/components/auto-index/linasameer-scroll-area-1/scroll-area";

const items = Array.from({ length: 40 }, (_, i) => `Entry ${String(i + 1).padStart(2, "0")}`);

export default function Demo() {
  return (
    <div className="flex min-h-[320px] w-full items-center justify-center overflow-auto p-6">
      <ScrollArea className="bg-background h-72 w-56 rounded-md border">
        <div className="p-4">
          <h4 className="mb-4 text-sm leading-none font-medium">Entries</h4>
          {items.map((item) => (
            <div key={item} className="border-b border-border/50 py-2 text-sm last:border-none">
              {item}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
