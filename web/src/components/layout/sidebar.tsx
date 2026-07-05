"use client";

import {
  BarChart3,
  BookOpen,
  Compass,
  FileText,
  Filter,
  Sparkles,
  Table2,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import type { IntelligenceTab } from "@/types/analysis";

export type WorkbenchSection = "reviews" | "relevant" | "agent" | "dashboard";

type SidebarProps = {
  section: WorkbenchSection;
  onSectionChange: (section: WorkbenchSection) => void;
  reviewCount: number;
  relevantCount: number;
  hasAnalysis: boolean;
  intelligenceTab?: IntelligenceTab;
  onIntelligenceTabChange?: (tab: IntelligenceTab) => void;
};

const pipelineNav: { id: WorkbenchSection; label: string; icon: typeof Table2; step?: string }[] = [
  { id: "reviews", label: "Reviews", icon: Table2, step: "1" },
  { id: "relevant", label: "Relevant Reviews", icon: Filter, step: "2" },
  { id: "agent", label: "AI Product Intelligence", icon: Sparkles, step: "3" },
  { id: "dashboard", label: "Dashboard", icon: BarChart3, step: "4" },
];

const dashboardTabs: { id: IntelligenceTab; label: string; icon: typeof Compass }[] = [
  { id: "discovery", label: "Discovery Intelligence", icon: Compass },
  { id: "behaviour", label: "Listening Behaviour", icon: BookOpen },
  { id: "segments", label: "User Segments", icon: Users },
  { id: "jtbd", label: "JTBD & Pain Points", icon: Target },
  { id: "rootcauses", label: "Root Causes", icon: Target },
  { id: "opportunities", label: "AI Opportunity Analysis", icon: Sparkles },
  { id: "business", label: "Business Impact", icon: TrendingUp },
  { id: "report", label: "PM Report", icon: FileText },
];

export function Sidebar({
  section,
  onSectionChange,
  reviewCount,
  relevantCount,
  hasAnalysis,
  intelligenceTab,
  onIntelligenceTabChange,
}: SidebarProps) {
  return (
    <aside className="hidden lg:flex lg:w-72 lg:flex-col border-r border-border bg-black shrink-0 h-dvh sticky top-0">
      <div className="px-6 py-5 flex items-center gap-3 border-b border-border">
        <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center">
          <Compass className="h-4 w-4 text-primary-foreground" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-bold text-foreground">Review Discovery</div>
          <div className="text-xs text-muted-foreground">Growth · Internal</div>
        </div>
      </div>

      <nav className="px-3 py-4 space-y-1">
        {pipelineNav.map((item) => {
          const Icon = item.icon;
          const active = section === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSectionChange(item.id)}
              className={[
                "w-full flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium transition-all duration-200 text-left",
                active
                  ? "bg-foreground text-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted",
              ].join(" ")}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.step && (
                <span
                  className={[
                    "text-[10px] rounded-full px-1.5 py-0.5",
                    active ? "bg-background/20 text-background" : "bg-muted text-muted-foreground",
                  ].join(" ")}
                >
                  {item.step}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {hasAnalysis && (
        <div className="mt-2 px-3">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-4 mb-2">Dashboard</div>
          <div className="space-y-0.5 max-h-[280px] overflow-y-auto scroll-smooth">
            {dashboardTabs.map((item) => {
              const Icon = item.icon;
              const active = section === "dashboard" && intelligenceTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSectionChange("dashboard");
                    onIntelligenceTabChange?.(item.id);
                  }}
                  className={[
                    "w-full flex items-center gap-3 rounded-lg px-4 py-2 text-sm transition-colors text-left",
                    active ? "bg-primary/15 text-primary font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  ].join(" ")}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-auto px-6 pb-6">
        <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <div>
            <div className="text-xs text-muted-foreground">Full dataset</div>
            <div className="text-sm font-bold text-foreground">{reviewCount.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Analysis dataset (ETL)</div>
            <div className="text-sm font-bold text-primary">{relevantCount.toLocaleString()}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
