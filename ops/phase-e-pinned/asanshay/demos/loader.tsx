import React, { useState } from "react";

type Shape = "sphere" | "swirl" | "ripple";
type StyleVariant = "plain" | "blur" | "dither";

export function LoaderDemo() {
  const [shape, setShape] = useState<Shape>("sphere");
  const [variant, setVariant] = useState<StyleVariant>("dither");
  const [color, setColor] = useState("#38bdf8");

  return (
    <div className="mx-auto my-6 flex w-full max-w-xl flex-col items-center gap-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-8 text-white shadow-xl">
      <div className="flex w-full items-center justify-between border-b border-zinc-800/80 pb-3">
        <span className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
          WebGL Shader Loader
        </span>
        <span className="font-mono text-xs text-sky-400">{shape} • {variant}</span>
      </div>

      <div className="relative flex size-48 items-center justify-center rounded-2xl bg-black/60 shadow-inner">
        {/* Animated shader particle canvas simulation */}
        <div
          className="relative size-32 rounded-full flex items-center justify-center transition-all duration-300"
          style={{
            boxShadow: variant === "blur" ? `0 0 40px ${color}` : "none",
          }}
        >
          <div
            className="absolute inset-0 rounded-full border-2 border-dashed border-sky-400 animate-spin"
            style={{
              borderColor: color,
              animationDuration: shape === "ripple" ? "1.5s" : "3s",
              filter: variant === "dither" ? "contrast(200%)" : undefined,
            }}
          />
          <div
            className="size-16 rounded-full animate-ping opacity-75"
            style={{ backgroundColor: color, animationDuration: "2s" }}
          />
          <div
            className="size-8 rounded-full shadow-lg"
            style={{ backgroundColor: color }}
          />
        </div>
      </div>

      <div className="grid w-full grid-cols-2 gap-4 text-xs">
        <div className="flex flex-col gap-1.5">
          <label className="text-zinc-400">Shape</label>
          <div className="flex rounded-lg border border-zinc-800 bg-zinc-900 p-0.5">
            {(["sphere", "swirl", "ripple"] as Shape[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setShape(s)}
                className={`flex-1 rounded-md py-1 capitalize transition ${
                  shape === s ? "bg-zinc-800 text-white font-medium" : "text-zinc-400 hover:text-white"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-zinc-400">Style</label>
          <div className="flex rounded-lg border border-zinc-800 bg-zinc-900 p-0.5">
            {(["plain", "blur", "dither"] as StyleVariant[]).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setVariant(v)}
                className={`flex-1 rounded-md py-1 capitalize transition ${
                  variant === v ? "bg-zinc-800 text-white font-medium" : "text-zinc-400 hover:text-white"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
