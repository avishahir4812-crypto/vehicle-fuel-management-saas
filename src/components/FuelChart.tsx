"use client";

import { useId, useMemo, useState, type PointerEvent } from "react";
import { cn } from "@/lib/utils";

export type DayPoint = { day: number; amount: number; liters: number };

const W = 720;
const H = 240;
const PAD_X = 6;
const PAD_TOP = 18;
const PAD_BOTTOM = 26;
const PAD_LEFT = 44;

function catmullRom(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) {
    const p = points[0];
    return `M ${p.x},${p.y} L ${p.x + 0.01},${p.y}`;
  }
  let d = `M ${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x},${c1y} ${c2x},${c2y} ${p2.x},${p2.y}`;
  }
  return d;
}

export function FuelChart({
  days,
  points,
  monthLabel,
  labels,
  emptyText,
}: {
  days: number;
  points: DayPoint[];
  monthLabel: string;
  labels: { amount: string; liters: string; amountShort: string; litersShort: string };
  emptyText: string;
}) {
  const [metric, setMetric] = useState<"amount" | "liters">("amount");
  const [hover, setHover] = useState<number | null>(null);
  const gradientId = useId().replace(/:/g, "");

  const series = useMemo(() => {
    const map = new Map(points.map((p) => [p.day, p]));
    return Array.from({ length: days }, (_, i) => map.get(i + 1) ?? { day: i + 1, amount: 0, liters: 0 });
  }, [days, points]);

  const hasData = points.length > 0;
  const values = series.map((p) => p[metric]);
  const max = Math.max(...values, 1) * 1.12;

  const x = (i: number) =>
    PAD_LEFT + (i * (W - PAD_LEFT - PAD_X)) / Math.max(days - 1, 1);
  const y = (v: number) => H - PAD_BOTTOM - (v / max) * (H - PAD_TOP - PAD_BOTTOM);

  const plotted = series.map((p, i) => ({ x: x(i), y: y(p[metric]), raw: p }));
  const entryPoints = plotted.filter((p) => p.raw.amount > 0 || p.raw.liters > 0);

  const linePath = hasData ? catmullRom(plotted) : "";
  const areaPath = hasData
    ? `${linePath} L ${x(days - 1)},${H - PAD_BOTTOM} L ${x(0)},${H - PAD_BOTTOM} Z`
    : "";

  const gridVals = [0.25, 0.5, 0.75, 1].map((f) => max * f);
  const compact = (v: number) =>
    metric === "amount"
      ? `₹${Intl.NumberFormat("en-IN", { notation: "compact" }).format(v)}`
      : `${Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(v)}L`;

  const xTickDays = useMemo(() => {
    const step = Math.max(1, Math.ceil(days / 6));
    const ticks: number[] = [];
    for (let d = 1; d <= days; d += step) ticks.push(d);
    if (ticks[ticks.length - 1] !== days) ticks.push(days);
    return ticks;
  }, [days]);

  function onMove(e: PointerEvent<SVGRectElement>) {
    const rect = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const ratio = (px - PAD_LEFT) / Math.max(W - PAD_LEFT - PAD_X, 1);
    const idx = Math.round(ratio * (days - 1));
    setHover(Math.min(Math.max(idx, 0), days - 1));
  }

  const hoverPoint = hover !== null && hasData ? plotted[hover] : null;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-bold tracking-tight text-ink">{monthLabel}</h3>
        </div>
        <div className="flex rounded-full border border-line bg-paper p-0.5">
          {(
            [
              { key: "amount", label: labels.amountShort, color: "bg-brand" },
              { key: "liters", label: labels.litersShort, color: "bg-mint" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setMetric(opt.key)}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition-all",
                metric === opt.key ? "bg-ink text-paper" : "text-ink-soft hover:text-ink"
              )}
            >
              <span className={cn("size-1.5 rounded-full", opt.color)} />
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full select-none"
          role="img"
          aria-label={monthLabel}
        >
          <defs>
            <linearGradient id={`g-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor={metric === "amount" ? "#e8930c" : "#0d9488"}
                stopOpacity="0.32"
              />
              <stop
                offset="100%"
                stopColor={metric === "amount" ? "#e8930c" : "#0d9488"}
                stopOpacity="0"
              />
            </linearGradient>
          </defs>

          {gridVals.reverse().map((v) => (
            <g key={v}>
              <line
                x1={PAD_LEFT}
                x2={W - PAD_X}
                y1={y(v)}
                y2={y(v)}
                stroke="#e7e4dc"
                strokeDasharray="3 5"
              />
              <text
                x={PAD_LEFT - 8}
                y={y(v) + 4}
                textAnchor="end"
                className="fill-ink-soft"
                fontSize="10"
                fontWeight="600"
              >
                {compact(v)}
              </text>
            </g>
          ))}
          <line
            x1={PAD_LEFT}
            x2={W - PAD_X}
            y1={H - PAD_BOTTOM}
            y2={H - PAD_BOTTOM}
            stroke="#d8d4c8"
          />

          {xTickDays.map((d) => (
            <text
              key={d}
              x={x(d - 1)}
              y={H - 8}
              textAnchor="middle"
              className="fill-ink-soft"
              fontSize="10"
              fontWeight="600"
            >
              {d}
            </text>
          ))}

          {hasData && (
            <>
              <path d={areaPath} fill={`url(#g-${gradientId})`} />
              <path
                d={linePath}
                fill="none"
                stroke={metric === "amount" ? "#e8930c" : "#0d9488"}
                strokeWidth="2.4"
                strokeLinecap="round"
                className="chart-line-draw"
              />
              {entryPoints.map((p) => (
                <circle
                  key={p.raw.day}
                  cx={p.x}
                  cy={p.y}
                  r={hover !== null && plotted[hover].raw.day === p.raw.day ? 5 : 3.5}
                  fill="#fff"
                  stroke={metric === "amount" ? "#e8930c" : "#0d9488"}
                  strokeWidth="2.4"
                  className="transition-all duration-150"
                />
              ))}
            </>
          )}

          {hoverPoint && (
            <line
              x1={hoverPoint.x}
              x2={hoverPoint.x}
              y1={PAD_TOP - 8}
              y2={H - PAD_BOTTOM}
              stroke="#171510"
              strokeWidth="1"
              strokeDasharray="2 3"
              opacity="0.35"
            />
          )}

          <rect
            x={PAD_LEFT - 8}
            y={0}
            width={W - PAD_LEFT - PAD_X + 14}
            height={H}
            fill="transparent"
            onPointerMove={onMove}
            onPointerLeave={() => setHover(null)}
          />
        </svg>

        {!hasData && (
          <div className="absolute inset-0 grid place-items-center">
            <p className="rounded-full border border-line bg-surface/90 px-4 py-2 text-[13px] font-semibold text-ink-soft shadow-soft">
              {emptyText}
            </p>
          </div>
        )}

        {hoverPoint && (
          <div
            className="pointer-events-none absolute z-10 w-40 -translate-x-1/2 rounded-xl border border-line bg-ink px-3 py-2.5 text-white shadow-lift"
            style={{
              left: `${(hoverPoint.x / W) * 100}%`,
              top: 0,
              transform: `translateX(${
                hoverPoint.x / W > 0.8 ? "-92%" : hoverPoint.x / W < 0.15 ? "-8%" : "-50%"
              })`,
            }}
          >
            <p className="text-[11px] font-bold uppercase tracking-wider text-white/50">
              {monthLabel} · {hoverPoint.raw.day}
            </p>
            <div className="mt-1.5 flex items-center justify-between text-[13px] font-semibold">
              <span className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-brand" />
                {labels.amountShort}
              </span>
              <span>
                ₹{Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(hoverPoint.raw.amount)}
              </span>
            </div>
            <div className="mt-0.5 flex items-center justify-between text-[13px] font-semibold">
              <span className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-mint" />
                {labels.litersShort}
              </span>
              <span>
                {Intl.NumberFormat("en-IN", { maximumFractionDigits: 1 }).format(hoverPoint.raw.liters)} L
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
