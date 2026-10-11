import React, { useState } from "react";

export function MotionBlurTextDemo() {
  const [text, setText] = useState("KINETIC");
  const [blurAmount, setBlurAmount] = useState(60);
  const [angle, setAngle] = useState(135);
  const [opacity, setOpacity] = useState(0.06);
  const [bidirectional, setBidirectional] = useState(true);

  // Generate multi-layer text shadows dynamically
  const getShadows = () => {
    const shadows = [];
    const radianAngle = (angle * Math.PI) / 180;
    const xStep = Math.cos(radianAngle);
    const yStep = Math.sin(radianAngle);

    for (let i = 1; i <= blurAmount; i++) {
      if (i % 4 !== 0) continue;
      const baseOpacity = opacity;
      const opacityStep = baseOpacity / (blurAmount + 2);
      const layerOpacity = baseOpacity - i * opacityStep;
      const x = xStep * i;
      const y = yStep * i;
      const blur = (i + 4) / 4;

      shadows.push(
        `${x.toFixed(2)}px ${y.toFixed(2)}px ${blur}px rgba(255, 255, 255, ${layerOpacity.toFixed(3)})`
      );

      if (bidirectional) {
        shadows.push(
          `${(-x).toFixed(2)}px ${(-y).toFixed(2)}px ${blur}px rgba(255, 255, 255, ${layerOpacity.toFixed(3)})`
        );
      }
    }

    return shadows.join(", ");
  };

  return (
    <div className="mx-auto my-6 flex w-full max-w-xl flex-col items-center gap-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-8 text-white shadow-xl">
      <div className="flex w-full items-center justify-between border-b border-zinc-800/80 pb-3">
        <span className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
          Motion Blur Text Preview
        </span>
        <span className="font-mono text-xs text-zinc-500">{angle}° angle</span>
      </div>

      <div className="flex min-h-[160px] w-full items-center justify-center overflow-hidden rounded-xl bg-black/60 p-6">
        <h2
          className="text-5xl font-black tracking-widest uppercase transition-all duration-150 sm:text-6xl"
          style={{ textShadow: getShadows() }}
        >
          {text}
        </h2>
      </div>

      <div className="grid w-full grid-cols-2 gap-4 text-xs">
        <div className="flex flex-col gap-1.5">
          <label className="text-zinc-400">Word</label>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 font-medium text-white outline-none focus:border-zinc-700"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-zinc-400">Angle ({angle}°)</label>
          <input
            type="range"
            min="0"
            max="360"
            value={angle}
            onChange={(e) => setAngle(Number(e.target.value))}
            className="accent-white"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-zinc-400">Blur Amount ({blurAmount})</label>
          <input
            type="range"
            min="10"
            max="120"
            value={blurAmount}
            onChange={(e) => setBlurAmount(Number(e.target.value))}
            className="accent-white"
          />
        </div>
        <div className="flex flex-col justify-end">
          <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
            <input
              type="checkbox"
              checked={bidirectional}
              onChange={(e) => setBidirectional(e.target.checked)}
              className="rounded accent-white"
            />
            Bidirectional Blur
          </label>
        </div>
      </div>
    </div>
  );
}
