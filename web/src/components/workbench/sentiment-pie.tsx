"use client";

import { useEffect, useMemo, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { PMReport } from "@/types/analysis";

type Props = {
  sentiment: PMReport["sentiment"];
  title?: string;
  totalReviews?: number;
};

const COLORS = {
  positive: "#1db954",
  neutral: "#b3b3b3",
  negative: "#e91429",
} as const;

const ORDER = ["negative", "neutral", "positive"] as const;

function useAnimatedPercent(target: number, duration = 700) {
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

export function SentimentPie({ sentiment, title = "Sentiment Distribution", totalReviews }: Props) {
  const rows = useMemo(() => {
    const labels = { negative: "Negative", neutral: "Neutral", positive: "Positive" } as const;
    return ORDER.map((key) => ({
      key,
      label: labels[key],
      pct: Math.round(sentiment[key] ?? 0),
      color: COLORS[key],
    })).filter((d) => d.pct > 0);
  }, [sentiment]);

  const pieData = rows.map((d) => ({ name: d.label, key: d.key, value: d.pct }));

  const negAnim = useAnimatedPercent(sentiment.negative ?? 0);
  const neuAnim = useAnimatedPercent(sentiment.neutral ?? 0);
  const posAnim = useAnimatedPercent(sentiment.positive ?? 0);
  const anims = { negative: negAnim, neutral: neuAnim, positive: posAnim } as const;

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-muted/10 p-4 text-sm text-muted-foreground">
        No sentiment data available for this analysis.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-muted/10 p-4">
      <h3 className="text-sm font-semibold text-foreground mb-3">{title}</h3>

      <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-4 items-center">
        <div className="h-[168px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                innerRadius={52}
                outerRadius={76}
                paddingAngle={3}
                stroke="#121212"
                strokeWidth={2}
              >
                {pieData.map((d) => (
                  <Cell key={d.key} fill={COLORS[d.key as keyof typeof COLORS]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => [`${value ?? 0}%`, name]}
                contentStyle={{ backgroundColor: "#181818", border: "1px solid #282828", borderRadius: "8px" }}
                itemStyle={{ color: "#ffffff" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-2">
          {ORDER.map((key) => {
            const pct = Math.round(sentiment[key] ?? 0);
            if (pct <= 0) return null;
            const label = key === "negative" ? "Negative" : key === "neutral" ? "Neutral" : "Positive";
            const count = totalReviews != null ? Math.round((totalReviews * pct) / 100) : undefined;
            return (
              <div key={key} className="space-y-1">
                <div className="flex justify-between text-sm gap-3">
                  <span className="inline-flex items-center gap-2 font-medium text-foreground">
                    <span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ backgroundColor: COLORS[key] }} />
                    {label}
                  </span>
                  <span className="tabular-nums shrink-0">
                    <span className="font-semibold text-foreground">{anims[key]}%</span>
                    {count != null && (
                      <span className="text-muted-foreground ml-1.5">({count.toLocaleString()})</span>
                    )}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${anims[key]}%`, backgroundColor: COLORS[key] }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {totalReviews != null && (
        <p className="text-[11px] text-muted-foreground mt-3">
          Based on {totalReviews.toLocaleString()} discovery-relevant reviews
        </p>
      )}
    </div>
  );
}
