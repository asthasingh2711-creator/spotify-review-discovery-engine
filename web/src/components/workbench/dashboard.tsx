"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Sidebar, type WorkbenchSection } from "@/components/layout/sidebar";
import { SpotifyHeader } from "@/components/layout/spotify-header";
import { IntelligencePanel } from "@/components/intelligence/intelligence-panel";
import { RatingSentimentChart } from "@/components/workbench/rating-sentiment-split";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import {
  computeRatingSentimentSplit,
  sortReviewsByRating,
  type RatingSort,
} from "@/lib/sentiment-from-rating";
import { filterReviewsByKeyword } from "@/lib/review-search";
import type { AnalyzeResponse, IntelligenceTab } from "@/types/analysis";
import type { NormalizedReview } from "@/types/reviews";
import { formatLlmError } from "@/services/analysis/llm";

type WorkflowStep =
  | "Parsing reviews..."
  | "Cleaning data..."
  | "Chunking reviews..."
  | "Running AI analysis..."
  | "Aggregating results..."
  | "Done.";

const STEPS: WorkflowStep[] = [
  "Parsing reviews...",
  "Cleaning data...",
  "Chunking reviews...",
  "Running AI analysis...",
  "Aggregating results...",
  "Done.",
];

type AppConfig = {
  cerebrasConfigured: boolean;
  refreshAvailable: boolean;
  model: string;
};

export function Dashboard() {
  const [section, setSection] = useState<WorkbenchSection>("reviews");
  const [reviews, setReviews] = useState<NormalizedReview[]>([]);
  const [relevantReviews, setRelevantReviews] = useState<NormalizedReview[]>([]);
  const [relevantMeta, setRelevantMeta] = useState<any>(null);
  const [rawMeta, setRawMeta] = useState<any>(null);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);
  const [isLoadingRelevant, setIsLoadingRelevant] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [stepIdx, setStepIdx] = useState<number>(0);
  const [progressMessage, setProgressMessage] = useState<string | null>(null);
  const [intelligenceTab, setIntelligenceTab] = useState<IntelligenceTab>("discovery");
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [q, setQ] = useState("");
  const [rq, setRq] = useState("");
  const [page, setPage] = useState(1);
  const [rpage, setRpage] = useState(1);
  const [ratingSort, setRatingSort] = useState<RatingSort>("rating-desc");
  const perPage = 50;

  const counts = useMemo(() => {
    const src: Record<string, number> = {};
    for (const r of reviews) src[r.source] = (src[r.source] ?? 0) + 1;
    return src;
  }, [reviews]);

  const filtered = useMemo(() => filterReviewsByKeyword(reviews, q), [reviews, q]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageRows = filtered.slice((page - 1) * perPage, page * perPage);

  const relevantSentiment = useMemo(
    () => computeRatingSentimentSplit(relevantReviews),
    [relevantReviews],
  );

  const relevantFiltered = useMemo(() => {
    const rows = filterReviewsByKeyword(relevantReviews, rq);
    return sortReviewsByRating(rows, ratingSort);
  }, [relevantReviews, rq, ratingSort]);

  const rpageCount = Math.max(1, Math.ceil(relevantFiltered.length / perPage));
  const rpageRows = relevantFiltered.slice((rpage - 1) * perPage, rpage * perPage);

  const loadReviews = useCallback(async (notify = false) => {
    setIsLoadingReviews(true);
    try {
      const res = await fetch("/api/reviews");
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Failed to load reviews");
      setReviews(json.reviews ?? []);
      setRawMeta(json.rawMeta ?? null);
      setPage(1);
      if (notify) {
        toast.success(`Loaded ${Number(json.total ?? 0).toLocaleString()} entries.`);
      }
      return Number(json.total ?? 0);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load reviews";
      toast.error(msg);
      return 0;
    } finally {
      setIsLoadingReviews(false);
    }
  }, []);

  const loadRelevant = useCallback(async (notify = false) => {
    setIsLoadingRelevant(true);
    try {
      const res = await fetch("/api/reviews/relevant");
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Failed to load relevant reviews");
      setRelevantReviews(json.reviews ?? []);
      setRelevantMeta(json.meta ?? null);
      setRpage(1);
      if (notify) {
        toast.success(`Loaded ${Number(json.total ?? 0).toLocaleString()} discovery-relevant entries.`);
      }
      return Number(json.total ?? 0);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load relevant reviews";
      if (notify) toast.error(msg);
      return 0;
    } finally {
      setIsLoadingRelevant(false);
    }
  }, []);

  const loadAnalysis = useCallback(async () => {
    try {
      const res = await fetch("/api/analysis");
      const json = await res.json();
      if (res.ok && json.ok && json.hasAnalysis && json.report) {
        setResult({ report: json.report, warnings: json.warnings ?? [] });
      }
    } catch {
      // non-fatal
    }
  }, []);

  const loadConfig = useCallback(async () => {
    try {
      const res = await fetch("/api/config");
      const json = await res.json();
      if (res.ok && json.ok) {
        setConfig({
          cerebrasConfigured: Boolean(json.cerebrasConfigured),
          refreshAvailable: Boolean(json.refreshAvailable),
          model: json.model ?? "gemma-4-31b",
        });
      }
    } catch {
      // non-fatal
    }
  }, []);

  useEffect(() => {
    void loadReviews(true);
    void loadRelevant(false);
    void loadAnalysis();
    void loadConfig();
  }, [loadReviews, loadRelevant, loadAnalysis, loadConfig]);

  async function analyze() {
    if (!config?.cerebrasConfigured) {
      toast.error(
        config?.refreshAvailable === false
          ? "Add GEMINI_API_KEY (or CEREBRAS_API_KEY) in Vercel project settings, then redeploy."
          : "Set GEMINI_API_KEY in web/.env.local, then restart the dev server.",
      );
      setSection("agent");
      return;
    }

    if (relevantReviews.length === 0) {
      toast.error("No discovery-relevant reviews. Refresh the dataset to run ETL.");
      setSection("relevant");
      return;
    }

    setSection("agent");
    setIsAnalyzing(true);
    setResult(null);
    setStepIdx(0);
    setProgressMessage("Starting analysis...");

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({}),
      });

      if (!res.ok || !res.body) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Analysis failed");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let finished = false;

      while (!finished) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const blocks = buffer.split("\n\n");
        buffer = blocks.pop() ?? "";

        for (const block of blocks) {
          const line = block.trim();
          if (!line.startsWith("data: ")) continue;
          const payload = JSON.parse(line.slice(6));

          if (payload.type === "status") {
            setProgressMessage(String(payload.message));
            if (String(payload.message).toLowerCase().includes("chunk")) setStepIdx(2);
            else if (String(payload.message).toLowerCase().includes("merg")) setStepIdx(4);
            else if (String(payload.message).toLowerCase().includes("synth")) setStepIdx(4);
          } else if (payload.type === "chunk") {
            setProgressMessage(String(payload.message));
            setStepIdx(3);
          } else if (payload.type === "result") {
            if (payload.ok === false) {
              throw new Error(payload.error || "Analysis failed");
            }
            setStepIdx(STEPS.length - 1);
            setProgressMessage("Done.");
            setResult({ report: payload.report, warnings: payload.warnings ?? [] });
            toast.success("PM report generated.");
            setSection("dashboard");
            finished = true;
          } else if (payload.type === "error") {
            throw new Error(payload.error || payload.message || "Analysis failed");
          }
        }
      }
    } catch (e) {
      const msg = formatLlmError(e);
      toast.error(msg, { duration: 8000 });
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function refresh() {
    setIsRefreshing(true);
    toast.info("Scraping latest reviews… this may take 1–2 minutes.");
    try {
      const res = await fetch("/api/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Refresh failed");
      }
      setRawMeta(json.rawMeta ?? null);
      const total = await loadReviews(false);
      const relevantTotal = await loadRelevant(false);
      toast.success(`Refreshed. ${total.toLocaleString()} entries · ${relevantTotal.toLocaleString()} discovery-relevant.`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Refresh failed";
      toast.error(msg);
    } finally {
      setIsRefreshing(false);
    }
  }

  async function restoreFromCsv() {
    setIsRestoring(true);
    try {
      const before = reviews.length;
      const res = await fetch("/api/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Restore failed");
      }
      setRawMeta(json.rawMeta ?? null);
      const after = await loadReviews(false);
      await loadRelevant(false);
      toast.success(`Restored from CSV. ${before.toLocaleString()} → ${after.toLocaleString()} entries.`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Restore failed";
      toast.error(msg);
    } finally {
      setIsRestoring(false);
    }
  }

  return (
    <div className="min-h-dvh flex bg-background">
      <Sidebar
        section={section}
        onSectionChange={setSection}
        reviewCount={reviews.length}
        relevantCount={relevantReviews.length}
        hasAnalysis={Boolean(result)}
        intelligenceTab={intelligenceTab}
        onIntelligenceTabChange={setIntelligenceTab}
      />

      <div className="flex-1 min-w-0 flex flex-col h-dvh overflow-hidden">
        <SpotifyHeader section={sectionHeaderCopy(section, intelligenceTab)} />
        <div className="lg:hidden shrink-0 border-b border-border bg-card px-4 py-2 overflow-x-auto">
          <Tabs value={section} onValueChange={(v) => setSection(v as WorkbenchSection)}>
            <TabsList className="w-max min-w-full bg-muted rounded-full p-1">
              <TabsTrigger value="reviews" className="rounded-full data-active:bg-card data-active:text-foreground data-active:shadow-sm">Reviews</TabsTrigger>
              <TabsTrigger value="relevant" className="rounded-full data-active:bg-card data-active:text-foreground data-active:shadow-sm">Relevant</TabsTrigger>
              <TabsTrigger value="agent" className="rounded-full data-active:bg-card data-active:text-foreground data-active:shadow-sm">Agent</TabsTrigger>
              <TabsTrigger value="dashboard" className="rounded-full data-active:bg-card data-active:text-foreground data-active:shadow-sm">Dashboard</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <main className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
          <header className="space-y-1">
            <h1 className="spotify-page-title">{sectionTitle(section, intelligenceTab)}</h1>
            {sectionHeaderCopy(section, intelligenceTab) ? (
              <p className="spotify-page-subtitle">{sectionHeaderCopy(section, intelligenceTab)}</p>
            ) : null}
          </header>

          {section === "reviews" ? (
            <ReviewsSection
              counts={counts}
              rawMeta={rawMeta}
              isLoadingReviews={isLoadingReviews}
              isRefreshing={isRefreshing}
              isRestoring={isRestoring}
              refreshAvailable={config?.refreshAvailable ?? true}
              reviews={reviews}
              filtered={filtered}
              pageRows={pageRows}
              page={page}
              pageCount={pageCount}
              perPage={perPage}
              q={q}
              isAnalyzing={isAnalyzing}
              onGoToAnalysis={() => setSection("agent")}
              onRefresh={refresh}
              onRestore={restoreFromCsv}
              onQChange={(v) => {
                setQ(v);
                setPage(1);
              }}
              onPageChange={setPage}
            />
          ) : section === "relevant" ? (
            <RelevantReviewsSection
              relevantMeta={relevantMeta}
              isLoadingRelevant={isLoadingRelevant}
              totalFull={reviews.length}
              relevantReviews={relevantReviews}
              sentiment={relevantSentiment}
              filtered={relevantFiltered}
              pageRows={rpageRows}
              page={rpage}
              pageCount={rpageCount}
              perPage={perPage}
              q={rq}
              ratingSort={ratingSort}
              onRatingSortChange={(v) => {
                setRatingSort(v);
                setRpage(1);
              }}
              onGoToAgent={() => setSection("agent")}
              onQChange={(v) => {
                setRq(v);
                setRpage(1);
              }}
              onPageChange={setRpage}
            />
          ) : section === "agent" ? (
            <AgentSection
              config={config}
              relevantCount={relevantReviews.length}
              isAnalyzing={isAnalyzing}
              stepIdx={stepIdx}
              progressMessage={progressMessage}
              onAnalyze={analyze}
              onGoToRelevant={() => setSection("relevant")}
            />
          ) : section === "dashboard" ? (
            result ? (
              <IntelligencePanel
                result={result}
                activeTab={intelligenceTab}
                onTabChange={setIntelligenceTab}
              />
            ) : (
              <EmptyAnalysisCard onRun={() => setSection("agent")} label="Run the AI Product Intelligence Agent to populate the dashboard." />
            )
          ) : null}
        </div>
        </main>
      </div>
    </div>
  );
}

type ReviewsSectionProps = {
  counts: Record<string, number>;
  rawMeta: any;
  isLoadingReviews: boolean;
  isRefreshing: boolean;
  isRestoring: boolean;
  refreshAvailable: boolean;
  reviews: NormalizedReview[];
  filtered: NormalizedReview[];
  pageRows: NormalizedReview[];
  page: number;
  pageCount: number;
  perPage: number;
  q: string;
  isAnalyzing: boolean;
  onGoToAnalysis: () => void;
  onRefresh: () => void;
  onRestore: () => void;
  onQChange: (v: string) => void;
  onPageChange: (p: number) => void;
};

function ReviewsSection({
  counts,
  rawMeta,
  isLoadingReviews,
  isRefreshing,
  isRestoring,
  refreshAvailable,
  reviews,
  filtered,
  pageRows,
  page,
  pageCount,
  perPage,
  q,
  isAnalyzing,
  onGoToAnalysis,
  onRefresh,
  onRestore,
  onQChange,
  onPageChange,
}: ReviewsSectionProps) {
  return (
    <>
      <Card className="spotify-card">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-foreground font-bold">Dataset</CardTitle>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" className="rounded-full border-border" disabled={isRefreshing || isRestoring} onClick={onRestore}>
              {isRestoring ? "Restoring..." : "Restore from CSV"}
            </Button>
            <Button variant="secondary" className="rounded-full" disabled={isRefreshing || isRestoring || !refreshAvailable} onClick={onRefresh}>
              {isRefreshing ? "Refreshing… (1–2 min)" : "Refresh latest"}
            </Button>
            <Button className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={reviews.length === 0 || isAnalyzing} onClick={onGoToAnalysis}>
              Go to Analysis
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(counts).map(([k, v]) => (
              <div key={k} className="spotify-stat">
                <div className="text-xs text-muted-foreground">{k}</div>
                <div className="text-lg font-bold text-foreground">{v.toLocaleString()}</div>
              </div>
            ))}
            <div className="spotify-stat">
              <div className="text-xs text-muted-foreground">Total entries</div>
              <div className="text-lg font-bold text-foreground">
                {isLoadingReviews ? "…" : reviews.length.toLocaleString()}
              </div>
            </div>
          </div>

          {rawMeta?.scraped_at && (
            <div className="text-xs text-muted-foreground">
              Last scraped: <span className="text-foreground">{String(rawMeta.scraped_at)}</span>
            </div>
          )}

          {isRefreshing && (
            <div className="rounded-xl border border-primary/30 bg-primary/10 p-3 text-sm text-muted-foreground">
              Running Python scrapers in the background. The page will update automatically when complete.
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="spotify-card">
        <CardHeader>
          <CardTitle className="text-foreground font-bold">All Reviews & Discussions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="Search by keyword..."
            value={q}
            onChange={(e) => onQChange(e.target.value)}
            className="border-border bg-card max-w-xl"
          />

          <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
            <div>
              Showing {(page - 1) * perPage + 1}-{Math.min(page * perPage, filtered.length)} of{" "}
              {filtered.length.toLocaleString()}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" className="rounded-full" disabled={page <= 1} onClick={() => onPageChange(Math.max(1, page - 1))}>
                Prev
              </Button>
              <div className="text-xs">
                Page {page} / {pageCount}
              </div>
              <Button
                variant="secondary"
                className="rounded-full"
                disabled={page >= pageCount}
                onClick={() => onPageChange(Math.min(pageCount, page + 1))}
              >
                Next
              </Button>
            </div>
          </div>

          <ScrollArea className="h-[min(520px,50vh)] rounded-xl border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="w-[140px] text-muted-foreground">Date</TableHead>
                  <TableHead className="w-[160px] text-muted-foreground">Source</TableHead>
                  <TableHead className="w-[110px] text-muted-foreground">Type</TableHead>
                  <TableHead className="w-[90px] text-muted-foreground">Rating</TableHead>
                  <TableHead className="w-[260px] text-muted-foreground">Title</TableHead>
                  <TableHead className="text-muted-foreground">Body</TableHead>
                  <TableHead className="w-[180px] text-muted-foreground">Author</TableHead>
                  <TableHead className="w-[90px] text-muted-foreground">Link</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.map((r) => (
                  <TableRow key={r.id} className="border-border/60">
                    <TableCell className="text-xs text-muted-foreground">
                      {r.date ? r.date.slice(0, 10) : "—"}
                    </TableCell>
                    <TableCell className="text-xs">{r.source}</TableCell>
                    <TableCell className="text-xs">{r.type}</TableCell>
                    <TableCell className="text-xs">{r.rating ?? "—"}</TableCell>
                    <TableCell className="text-sm font-medium">{r.title || "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {r.body?.slice(0, 280) || "—"}
                      {r.body && r.body.length > 280 ? "…" : ""}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{r.author ?? "—"}</TableCell>
                    <TableCell className="text-xs">
                      {r.url ? (
                        <a className="text-primary hover:underline font-medium" href={r.url} target="_blank" rel="noreferrer">
                          Open
                        </a>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </>
  );
}

function sectionTitle(section: WorkbenchSection, tab?: IntelligenceTab) {
  switch (section) {
    case "reviews":
      return "Reviews & Data";
    case "relevant":
      return "Relevant Reviews";
    case "agent":
      return "AI Product Intelligence";
    case "dashboard":
      return tab === "report" ? "PM Report" : "Dashboard";
  }
}

function sectionHeaderCopy(section: WorkbenchSection, tab?: IntelligenceTab): string {
  switch (section) {
    case "reviews":
      return "Browse and refresh the full review dataset loaded from the backend.";
    case "relevant":
      return "Discovery-relevant reviews after ETL filtering — the target dataset for AI analysis.";
    case "agent":
      return "Run batched AI analysis on discovery-relevant reviews to generate PM intelligence.";
    case "dashboard":
      return tab === "report" ? "Print, email, or download the executive summary and advanced analysis." : "";
  }
}

function EmptyAnalysisCard({ onRun, label }: { onRun: () => void; label: string }) {
  return (
    <Card className="spotify-card">
      <CardContent className="py-16 text-center space-y-4">
        <p className="text-muted-foreground">{label}</p>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6" onClick={onRun}>
          Go to AI Agent
        </Button>
      </CardContent>
    </Card>
  );
}

type RelevantReviewsSectionProps = {
  relevantMeta: any;
  isLoadingRelevant: boolean;
  totalFull: number;
  relevantReviews: NormalizedReview[];
  sentiment: ReturnType<typeof computeRatingSentimentSplit>;
  filtered: NormalizedReview[];
  pageRows: NormalizedReview[];
  page: number;
  pageCount: number;
  perPage: number;
  q: string;
  ratingSort: RatingSort;
  onRatingSortChange: (v: RatingSort) => void;
  onGoToAgent: () => void;
  onQChange: (v: string) => void;
  onPageChange: (p: number) => void;
};

function RelevantReviewsSection({
  relevantMeta,
  isLoadingRelevant,
  totalFull,
  relevantReviews,
  sentiment,
  filtered,
  pageRows,
  page,
  pageCount,
  perPage,
  q,
  ratingSort,
  onRatingSortChange,
  onGoToAgent,
  onQChange,
  onPageChange,
}: RelevantReviewsSectionProps) {
  return (
    <>
      <ScrollReveal>
        <Card className="spotify-card">
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-foreground">Discovery Intelligence Dataset (ETL)</CardTitle>
              <div className="text-sm text-muted-foreground mt-1">
                {relevantReviews.length.toLocaleString()} discovery-relevant reviews — this is the only dataset used for AI analysis.
              </div>
            </div>
            <Button
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6"
              disabled={relevantReviews.length === 0}
              onClick={onGoToAgent}
            >
              Go to AI Agent
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatTile label="Full dataset" value={totalFull.toLocaleString()} />
              <StatTile label="Relevant (ETL)" value={isLoadingRelevant ? "…" : relevantReviews.length.toLocaleString()} highlight />
              <StatTile
                label="Excluded"
                value={relevantMeta?.excluded != null ? Number(relevantMeta.excluded).toLocaleString() : "—"}
              />
              <StatTile
                label="ETL updated"
                value={relevantMeta?.etl_at ? String(relevantMeta.etl_at).slice(0, 19) : "—"}
                small
              />
            </div>
          </CardContent>
        </Card>
      </ScrollReveal>

      <RatingSentimentChart split={sentiment} />

      <ScrollReveal delay={80}>
        <Card className="spotify-card">
          <CardHeader>
            <CardTitle className="text-foreground">Relevant Reviews</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ReviewsTable
              q={q}
              filtered={filtered}
              pageRows={pageRows}
              page={page}
              pageCount={pageCount}
              perPage={perPage}
              ratingSort={ratingSort}
              onRatingSortChange={onRatingSortChange}
              showRatingStars
              onQChange={onQChange}
              onPageChange={onPageChange}
            />
          </CardContent>
        </Card>
      </ScrollReveal>
    </>
  );
}

function StatTile({
  label,
  value,
  highlight,
  small,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  small?: boolean;
}) {
  return (
    <div className={["spotify-stat", highlight ? "border-primary/30 bg-primary/10" : ""].filter(Boolean).join(" ")}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={small ? "text-sm font-semibold text-foreground truncate" : "text-lg font-bold text-foreground"}>
        {value}
      </div>
    </div>
  );
}

type ReviewsTableProps = {
  q: string;
  filtered: NormalizedReview[];
  pageRows: NormalizedReview[];
  page: number;
  pageCount: number;
  perPage: number;
  ratingSort?: RatingSort;
  onRatingSortChange?: (v: RatingSort) => void;
  showRatingStars?: boolean;
  onQChange: (v: string) => void;
  onPageChange: (p: number) => void;
};

function ReviewsTable({
  q,
  filtered,
  pageRows,
  page,
  pageCount,
  perPage,
  ratingSort,
  onRatingSortChange,
  showRatingStars,
  onQChange,
  onPageChange,
}: ReviewsTableProps) {
  return (
    <>
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
        <Input
          placeholder="Search by keyword..."
          value={q}
          onChange={(e) => onQChange(e.target.value)}
          className="border-border bg-card flex-1 max-w-xl"
        />
        {onRatingSortChange && (
          <select
            value={ratingSort ?? "rating-desc"}
            onChange={(e) => onRatingSortChange(e.target.value as RatingSort)}
            className="h-9 rounded-lg border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="rating-desc">Rating: High → Low</option>
            <option value="rating-asc">Rating: Low → High</option>
            <option value="date-desc">Date: Newest first</option>
            <option value="date-asc">Date: Oldest first</option>
            <option value="default">Default order</option>
          </select>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
        <div>
          Showing {(page - 1) * perPage + 1}-{Math.min(page * perPage, filtered.length)} of{" "}
          {filtered.length.toLocaleString()}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" className="rounded-full" disabled={page <= 1} onClick={() => onPageChange(Math.max(1, page - 1))}>
            Prev
          </Button>
          <div className="text-xs">
            Page {page} / {pageCount}
          </div>
          <Button
            variant="secondary"
            className="rounded-full"
            disabled={page >= pageCount}
            onClick={() => onPageChange(Math.min(pageCount, page + 1))}
          >
            Next
          </Button>
        </div>
      </div>

      <ScrollArea className="h-[min(520px,55vh)] rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="w-[140px] text-muted-foreground">Date</TableHead>
              <TableHead className="w-[160px] text-muted-foreground">Source</TableHead>
              <TableHead className="w-[110px] text-muted-foreground">Type</TableHead>
              <TableHead className="w-[120px] text-muted-foreground">Rating</TableHead>
              <TableHead className="w-[260px] text-muted-foreground">Title</TableHead>
              <TableHead className="text-muted-foreground">Body</TableHead>
              <TableHead className="w-[180px] text-muted-foreground">Author</TableHead>
              <TableHead className="w-[90px] text-muted-foreground">Link</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.map((r, i) => (
              <TableRow
                key={r.id}
                className="border-border/60 animate-in fade-in duration-300"
                style={{ animationDelay: `${Math.min(i, 8) * 30}ms` }}
              >
                <TableCell className="text-xs text-muted-foreground">
                  {r.date ? r.date.slice(0, 10) : "—"}
                </TableCell>
                <TableCell className="text-xs">{r.source}</TableCell>
                <TableCell className="text-xs">{r.type}</TableCell>
                <TableCell className="text-xs">
                  {showRatingStars ? <StarRating rating={r.rating} /> : (r.rating ?? "—")}
                </TableCell>
                <TableCell className="text-sm font-medium">{r.title || "—"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {r.body?.slice(0, 280) || "—"}
                  {r.body && r.body.length > 280 ? "…" : ""}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{r.author ?? "—"}</TableCell>
                <TableCell className="text-xs">
                  {r.url ? (
                    <a className="text-primary hover:underline font-medium" href={r.url} target="_blank" rel="noreferrer">
                      Open
                    </a>
                  ) : (
                    "—"
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </>
  );
}

function StarRating({ rating }: { rating?: number }) {
  if (rating == null) return <span className="text-muted-foreground">—</span>;
  const full = Math.round(rating);
  return (
    <span className="inline-flex gap-0.5" title={`${rating} stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < full ? "text-primary" : "text-muted"}>
          ★
        </span>
      ))}
    </span>
  );
}

type AgentSectionProps = {
  config: AppConfig | null;
  relevantCount: number;
  isAnalyzing: boolean;
  stepIdx: number;
  progressMessage: string | null;
  onAnalyze: () => void;
  onGoToRelevant: () => void;
};

function AgentSection({
  config,
  relevantCount,
  isAnalyzing,
  stepIdx,
  progressMessage,
  onAnalyze,
  onGoToRelevant,
}: AgentSectionProps) {
  return (
    <div className="space-y-6">
      <Card className="spotify-card">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-foreground">AI Product Intelligence Agent</CardTitle>
            <div className="text-sm text-muted-foreground mt-1">
              Analyzes <strong className="text-foreground">{relevantCount.toLocaleString()}</strong> ETL-filtered discovery reviews only
              — not the full {relevantCount < 801 ? "" : "3,776-entry "}dataset.
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" className="rounded-full border-border" onClick={onGoToRelevant}>
              View Relevant Reviews
            </Button>
            <Button
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full"
              disabled={relevantCount === 0 || isAnalyzing || !config?.cerebrasConfigured}
              onClick={onAnalyze}
            >
              {isAnalyzing ? "Analyzing..." : "Generate PM Intelligence"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!config?.cerebrasConfigured && (
            <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4 space-y-2">
              <div className="text-sm font-medium">AI API key required</div>
              {config?.refreshAvailable === false ? (
                <>
                  <div className="text-sm text-muted-foreground">
                    Add <code className="px-1">GEMINI_API_KEY</code> in your Vercel project, then redeploy:
                  </div>
                  <pre className="rounded-md border border-border bg-muted/30 p-3 text-xs overflow-x-auto">
{`Vercel Dashboard → spotify-discovery-dashboard
→ Settings → Environment Variables
→ GEMINI_API_KEY = your-key
→ Redeploy`}
                  </pre>
                </>
              ) : (
                <>
                  <div className="text-sm text-muted-foreground">
                    Create <code className="px-1">web/.env.local</code> with your Gemini key:
                  </div>
                  <pre className="rounded-md border border-border bg-muted/30 p-3 text-xs overflow-x-auto">
{`cd web
cp .env.example .env.local
# edit .env.local:
GEMINI_API_KEY=your-key
npm run dev`}
                  </pre>
                </>
              )}
            </div>
          )}

          {config?.cerebrasConfigured && (
            <div className="text-xs text-muted-foreground">
              Model: <span className="text-foreground/80">{config.model}</span>
            </div>
          )}

          {(isAnalyzing || progressMessage) && (
            <div className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-foreground">
              {progressMessage ?? "Working..."}
            </div>
          )}

          <div className="space-y-2">
            <div className="text-sm font-semibold text-foreground">Workflow</div>
            <ol className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {STEPS.map((s, i) => (
                <li
                  key={s}
                  className={[
                    "rounded-xl border px-3 py-2.5 text-sm",
                    i < stepIdx ? "border-primary/40 bg-primary/10 text-foreground" : "border-border bg-muted/50 text-muted-foreground",
                    i === stepIdx && isAnalyzing ? "ring-2 ring-primary/30" : "",
                  ].join(" ")}
                >
                  {s}
                </li>
              ))}
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
