"use client";
import { useState } from "react";
import Drawer from "@/components/auto-index/edilozi-drawer/drawer";

export default function Demo() {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex min-h-[320px] w-full items-center justify-center overflow-auto p-6">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
      >
        Open drawer
      </button>
      <Drawer open={open} setOpen={setOpen} anchor="right">
        <div className="h-full w-72 bg-white p-6 shadow-xl dark:bg-zinc-900">
          <h3 className="mb-2 text-lg font-semibold">Drawer panel</h3>
          <p className="text-sm text-zinc-500">Press Escape or click outside to close.</p>
        </div>
      </Drawer>
    </div>
  );
}
