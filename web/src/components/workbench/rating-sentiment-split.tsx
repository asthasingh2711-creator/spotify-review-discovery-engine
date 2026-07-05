"use client";

import { useEffect, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import type { RatingSentimentSplit } from "@/lib/sentiment-from-rating";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

const COLORS = {
  negative: "#e91429",
  neutral: "#b3b3b3",
  positive: "#1db954",
} as const;

function useAnimatedPercent(target: number, duration = 900) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - t) ** 3;
      setValue(Math.round(target * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);
  return value;
}

type Props = {
  split: RatingSentimentSplit;
};

export function RatingSentimentChart({ split }: Props) {
  const data = [
    { name: "Negative", key: "negative" as const, value: split.negative, pct: split.negativePct },
    { name: "Neutral", key: "neutral" as const, value: split.neutral, pct: split.neutralPct },
    { name: "Positive", key: "positive" as const, value: split.positive, pct: split.positivePct },
  ].filter((d) => d.value > 0);

  const posAnim = useAnimatedPercent(split.positivePct);
  const neuAnim = useAnimatedPercent(split.neutralPct);
  const negAnim = useAnimatedPercent(split.negativePct);

  if (split.totalRated === 0) {
    return (
      <div className="spotify-card p-6 text-sm text-muted-foreground">
        No star ratings in this dataset slice. Sentiment split applies to App Store / Play Store reviews with ratings.
      </div>
    );
  }

  return (
    <ScrollReveal className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="spotify-card p-6">
        <h3 className="text-lg font-bold text-foreground mb-4">Sentiment Split</h3>
        <div className="h-[220px] w-full animate-in fade-in duration-700">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={62}
                outerRadius={92}
                paddingAngle={3}
                stroke="#121212"
                strokeWidth={2}
                animationBegin={0}
                animationDuration={800}
              >
                {data.map((d) => (
                  <Cell key={d.key} fill={COLORS[d.key]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap justify-center gap-5 mt-2 text-sm font-medium">
          <LegendItem color={COLORS.negative} label="Negative" />
          <LegendItem color={COLORS.neutral} label="Neutral" />
          <LegendItem color={COLORS.positive} label="Positive" />
        </div>
        <p className="text-xs text-muted-foreground text-center mt-4">
          Based on {split.totalRated.toLocaleString()} rated reviews ({split.unrated.toLocaleString()} without ratings excluded)
        </p>
      </div>

      <div className="spotify-card p-6 flex flex-col justify-center">
        <h3 className="text-lg font-bold text-foreground mb-4">Distribution</h3>
        <div className="space-y-3">
          <DistRow label="Positive" pct={posAnim} color={COLORS.positive} count={split.positive} />
          <DistRow label="Neutral" pct={neuAnim} color={COLORS.neutral} count={split.neutral} />
          <DistRow label="Negative" pct={negAnim} color={COLORS.negative} count={split.negative} />
        </div>
      </div>
    </ScrollReveal>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2" style={{ color }}>
      <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

function DistRow({ label, pct, color, count }: { label: string; pct: number; color: string; count: number }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="font-medium text-foreground">{label}</span>
        <span>
          <span className="font-semibold text-foreground">{pct}%</span>
          <span className="text-muted-foreground ml-2">({count})</span>
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
