import React from "react";

const candles = [
  { t: "09:30", o: 150, h: 158, l: 148, c: 156 },
  { t: "10:00", o: 156, h: 162, l: 154, c: 160 },
  { t: "10:30", o: 160, h: 164, l: 155, c: 157 },
  { t: "11:00", o: 157, h: 159, l: 151, c: 152 },
  { t: "11:30", o: 152, h: 165, l: 150, c: 163 },
  { t: "12:00", o: 163, h: 168, l: 161, c: 166 },
];

export function CandlestickChartDemo() {
  return (
    <div className="mx-auto my-6 w-full max-w-lg rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Market Price Action</h4>
        <p className="text-xs text-zinc-500">OHLC Candlesticks with high/low wicks</p>
      </div>
      <div className="relative h-48 w-full">
        <svg viewBox="0 0 450 180" className="h-full w-full">
          {candles.map((c, i) => {
            const x = 35 + i * 70;
            const isUp = c.c >= c.o;
            const topY = 180 - (Math.max(c.o, c.c) - 140) * 5;
            const botY = 180 - (Math.min(c.o, c.c) - 140) * 5;
            const highY = 180 - (c.h - 140) * 5;
            const lowY = 180 - (c.l - 140) * 5;
            const color = isUp ? "#10b981" : "#ef4444";

            return (
              <g key={c.t}>
                <line x1={x} y1={highY} x2={x} y2={lowY} stroke={color} strokeWidth="1.5" />
                <rect
                  x={x - 12}
                  y={topY}
                  width="24"
                  height={Math.max(botY - topY, 4)}
                  fill={color}
                  rx="2"
                />
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
