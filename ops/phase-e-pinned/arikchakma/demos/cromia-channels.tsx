import React, { useState } from "react";

export function CromiaChannelsDemo() {
  const [hue, setHue] = useState(210);
  const [saturation, setSaturation] = useState(85);
  const [lightness, setLightness] = useState(55);
  const [alpha, setAlpha] = useState(1);

  const currentColor = `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;

  return (
    <div className="mx-auto my-6 w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Cromia Channels</h3>
        <div
          className="h-8 w-16 rounded-md border border-zinc-300 shadow-inner dark:border-zinc-700"
          style={{ backgroundColor: currentColor }}
          aria-label="Color preview"
        />
      </div>

      <div className="space-y-4 text-xs font-medium text-zinc-600 dark:text-zinc-400">
        <div>
          <div className="mb-1.5 flex justify-between">
            <span>Hue</span>
            <span className="font-mono text-zinc-900 dark:text-zinc-100">{hue}°</span>
          </div>
          <input
            type="range"
            min="0"
            max="360"
            value={hue}
            onChange={(e) => setHue(Number(e.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gradient-to-r from-red-500 via-green-500 via-blue-500 to-red-500"
          />
        </div>

        <div>
          <div className="mb-1.5 flex justify-between">
            <span>Saturation</span>
            <span className="font-mono text-zinc-900 dark:text-zinc-100">{saturation}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={saturation}
            onChange={(e) => setSaturation(Number(e.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-zinc-200 dark:bg-zinc-800"
          />
        </div>

        <div>
          <div className="mb-1.5 flex justify-between">
            <span>Lightness</span>
            <span className="font-mono text-zinc-900 dark:text-zinc-100">{lightness}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={lightness}
            onChange={(e) => setLightness(Number(e.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-zinc-200 dark:bg-zinc-800"
          />
        </div>

        <div>
          <div className="mb-1.5 flex justify-between">
            <span>Alpha</span>
            <span className="font-mono text-zinc-900 dark:text-zinc-100">{Math.round(alpha * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={alpha}
            onChange={(e) => setAlpha(Number(e.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-zinc-200 dark:bg-zinc-800"
          />
        </div>
      </div>
    </div>
  );
}
