"use client";

import { useMemo, useState } from "react";
import type { ThemeCluster } from "@/types/analysis";

const CLUSTER_COLORS = [
  "#1db954",
  "#509bf5",
  "#e91429",
  "#f59e0b",
  "#a855f7",
  "#ec4899",
  "#14b8a6",
  "#f97316",
] as const;

type BubbleLayout = {
  theme: ThemeCluster;
  x: number;
  y: number;
  r: number;
  pct: number;
  color: string;
};

function layoutBubbles(themes: ThemeCluster[], width: number, height: number): BubbleLayout[] {
  const sorted = [...themes].sort((a, b) => b.frequency - a.frequency).slice(0, 8);
  const total = sorted.reduce((s, t) => s + t.frequency, 0) || 1;
  const maxFreq = sorted[0]?.frequency ?? 1;
  const minR = 28;
  const maxR = Math.min(width, height) * 0.22;

  const placed: BubbleLayout[] = [];
  const cx = width / 2;
  const cy = height / 2;

  sorted.forEach((theme, i) => {
    const r = minR + (theme.frequency / maxFreq) * (maxR - minR);
    let x = cx;
    let y = cy;

    if (i > 0) {
      const angle = i * 2.399963;
      const orbit = r + (placed[i - 1]?.r ?? minR) * 0.55 + i * 6;
      x = cx + Math.cos(angle) * orbit;
      y = cy + Math.sin(angle) * orbit;
    }

    placed.push({
      theme,
      x,
      y,
      r,
      pct: Math.round((theme.frequency / total) * 100),
      color: CLUSTER_COLORS[i % CLUSTER_COLORS.length],
    });
  });

  return placed;
}

type Props = {
  themes: ThemeCluster[];
  title?: string;
};

export function InsightClusterDiagram({ themes, title = "Discovery Insight Clusters" }: Props) {
  const [active, setActive] = useState<string | null>(null);
  const width = 360;
  const height = 260;

  const bubbles = useMemo(() => layoutBubbles(themes, width, height), [themes]);
  const totalMentions = useMemo(() => themes.reduce((s, t) => s + t.frequency, 0), [themes]);
  const highlighted = bubbles.find((b) => b.theme.theme === active);

  if (bubbles.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-border bg-muted/10 p-4">
      <h3 className="text-sm font-semibold text-foreground mb-3">{title}</h3>

      <div className="relative mx-auto w-full max-w-[380px]">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" role="img" aria-label={title}>
          {bubbles.map((b) => {
            const isActive = active === b.theme.theme;
            const dimmed = active != null && !isActive;
            return (
              <g
                key={b.theme.theme}
                className="cursor-pointer transition-opacity duration-200"
                style={{ opacity: dimmed ? 0.35 : 1 }}
                onMouseEnter={() => setActive(b.theme.theme)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(b.theme.theme)}
                onBlur={() => setActive(null)}
                tabIndex={0}
              >
                <circle
                  cx={b.x}
                  cy={b.y}
                  r={b.r}
                  fill={b.color}
                  fillOpacity={isActive ? 0.95 : 0.78}
                  stroke={isActive ? "#ffffff" : "#121212"}
                  strokeWidth={isActive ? 2.5 : 1.5}
                />
                <text
                  x={b.x}
                  y={b.y - 4}
                  textAnchor="middle"
                  fill="#000"
                  fontSize={b.r > 42 ? 11 : 9}
                  fontWeight={700}
                >
                  {b.pct}%
                </text>
                <text
                  x={b.x}
                  y={b.y + 10}
                  textAnchor="middle"
                  fill="#000"
                  fontSize={9}
                  fontWeight={600}
                  opacity={0.85}
                >
                  {b.theme.frequency}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {(highlighted ?? bubbles[0]) && (
        <div className="mt-2 rounded-md border border-border bg-card/80 px-3 py-2 text-xs min-h-[52px]">
          <div className="font-medium text-foreground">{(highlighted ?? bubbles[0]).theme.theme}</div>
          <p className="text-muted-foreground mt-0.5 line-clamp-2">{(highlighted ?? bubbles[0]).theme.description}</p>
        </div>
      )}

      <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
        {bubbles.map((b) => (
          <li
            key={b.theme.theme}
            className={`flex items-center gap-2 truncate ${active === b.theme.theme ? "text-foreground" : "text-muted-foreground"}`}
            onMouseEnter={() => setActive(b.theme.theme)}
            onMouseLeave={() => setActive(null)}
          >
            <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: b.color }} />
            <span className="truncate">{b.theme.theme}</span>
            <span className="ml-auto shrink-0 tabular-nums">{b.theme.frequency}</span>
          </li>
        ))}
      </ul>

      <p className="text-[11px] text-muted-foreground text-center mt-2">
        Bubble size = mention frequency · {totalMentions.toLocaleString()} theme mentions across {themes.length} clusters
      </p>
    </div>
  );
}
