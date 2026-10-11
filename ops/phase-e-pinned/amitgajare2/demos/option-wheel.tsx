"use client";

import React from "react";
import OptionWheel from "@/components/auto-index/option-wheel";

export default function Demo() {
  const genres = [
    "Ambient",
    "House",
    "Techno",
    "Jazz",
    "Lo-Fi",
    "Synthwave",
    "Trance",
    "Funk",
    "Disco",
    "Hip-Hop",
    "Chillwave",
    "Drum & Bass",
  ];

  return (
    <div className="flex h-[420px] w-full items-center justify-center overflow-hidden rounded-xl bg-zinc-950 p-6 text-zinc-100 shadow-xl">
      <div className="relative h-[340px] w-full max-w-md">
        <OptionWheel
          items={genres}
          defaultSelected={3}
          side="left"
          fontSize={2.5}
          textColor="#71717a"
          activeColor="#ffffff"
          className="h-full w-full"
        />
      </div>
    </div>
  );
}
