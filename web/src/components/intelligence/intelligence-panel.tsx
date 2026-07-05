"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { SentimentPie } from "@/components/workbench/sentiment-pie";
import { InsightClusterDiagram } from "@/components/intelligence/insight-cluster-diagram";
import { DISCOVERY_MODULES } from "@/constants/discovery-questions";
import { InsightTile } from "@/components/intelligence/insight-tile";
import { QuoteCitation } from "@/components/intelligence/quote-citation";
import { generatePMReportMarkdown } from "@/services/analysis/generate-pm-report";
import { coerceEvidenceQuote, evidenceQuoteFromInlineText, sourceLinkLabel, classifyReviewUrl } from "@/lib/evidence-quote";
import type { AnalyzeResponse, DiscoveryInsight, EvidenceQuote, IntelligenceTab } from "@/types/analysis";

type Props = {
  result: AnalyzeResponse;
  activeTab?: IntelligenceTab;
  onTabChange?: (tab: IntelligenceTab) => void;
  showReportTab?: boolean;
};

const MODULE_PREFIX: Record<string, string[]> = {
  discovery: ["d"],
  behaviour: ["b"],
  segments: ["s"],
  jtbd: ["j", "p"],
  rootcauses: ["r"],
  opportunities: ["o"],
  business: ["bi"],
};

function insightsForModule(insights: DiscoveryInsight[], moduleId: string) {
  const prefixes = MODULE_PREFIX[moduleId] ?? [];
  return insights.filter((i) => prefixes.some((p) => i.questionId.startsWith(p)));
}

export function IntelligencePanel({ result, activeTab, onTabChange, showReportTab = true }: Props) {
  const [tab, setTab] = useState<IntelligenceTab>(activeTab ?? "discovery");

  const setActive = (t: IntelligenceTab) => {
    setTab(t);
    onTabChange?.(t);
  };

  const report = result.report;
  const insights = report.discoveryInsights ?? [];
  const es = report.executiveSummary;
  const advanced = report.advancedAnalysis;

  return (
    <Tabs value={activeTab ?? tab} onValueChange={(v) => setActive(v as IntelligenceTab)} className="space-y-4">
      <div className="spotify-tabs-scroll rounded-xl bg-card border border-border p-1.5">
        <TabsList className="flex flex-nowrap h-auto gap-1 bg-transparent p-0 min-w-max">
          <TabsTrigger value="discovery" className="rounded-full px-4 py-2 data-active:bg-foreground data-active:text-background whitespace-nowrap">Discovery</TabsTrigger>
          <TabsTrigger value="behaviour" className="rounded-full px-4 py-2 data-active:bg-foreground data-active:text-background whitespace-nowrap">Behaviour</TabsTrigger>
          <TabsTrigger value="segments" className="rounded-full px-4 py-2 data-active:bg-foreground data-active:text-background whitespace-nowrap">Segments</TabsTrigger>
          <TabsTrigger value="jtbd" className="rounded-full px-4 py-2 data-active:bg-foreground data-active:text-background whitespace-nowrap">JTBD</TabsTrigger>
          <TabsTrigger value="rootcauses" className="rounded-full px-4 py-2 data-active:bg-foreground data-active:text-background whitespace-nowrap">Root Causes</TabsTrigger>
          <TabsTrigger value="opportunities" className="rounded-full px-4 py-2 data-active:bg-foreground data-active:text-background whitespace-nowrap">Opportunities</TabsTrigger>
          <TabsTrigger value="business" className="rounded-full px-4 py-2 data-active:bg-foreground data-active:text-background whitespace-nowrap">Business</TabsTrigger>
          {showReportTab && (
            <TabsTrigger value="report" className="rounded-full px-4 py-2 data-active:bg-primary data-active:text-primary-foreground whitespace-nowrap">PM Report</TabsTrigger>
          )}
        </TabsList>
      </div>

      <TabsContent value="discovery" className="space-y-4">
        <ModuleHeader
          title="Discovery Intelligence"
          description="Why users struggle to discover music, recommendation frustrations, and unmet discovery needs."
        />
        <ModuleInsights insights={insightsForModule(insights, "discovery")} fallbackModuleId="discovery" report={result} />
      </TabsContent>

      <TabsContent value="behaviour" className="space-y-4">
        <ModuleHeader
          title="Listening Behaviour"
          description="Exploratory vs repetitive listening triggers and contexts."
        />
        <ModuleInsights insights={insightsForModule(insights, "behaviour")} fallbackModuleId="behaviour" report={result} />
        <Card className="spotify-card ring-0">
          <CardHeader>
            <CardTitle className="text-base text-foreground font-semibold">Behaviour clusters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(report.listeningBehaviours ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No listening behaviour clusters extracted.</p>
            ) : (
              report.listeningBehaviours!.map((b) => (
                <div key={b.behaviour} className="rounded-lg border border-border bg-muted/10 p-4">
                  <div className="flex justify-between gap-2">
                    <div className="font-medium">{b.behaviour}</div>
                    <Badge variant="outline">{b.frequency} mentions</Badge>
                  </div>
                  {b.contexts.length > 0 && (
                    <div className="text-xs text-muted-foreground mt-1">Contexts: {b.contexts.join(", ")}</div>
                  )}
                  {b.examples[0] && <QuoteCitation quote={b.examples[0]} compact />}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="segments" className="space-y-4">
        <ModuleHeader title="User Segments" description="Natural segments and discovery struggles by cohort." />
        <ModuleInsights insights={insightsForModule(insights, "segments")} fallbackModuleId="segments" report={result} />
        <Card className="spotify-card ring-0">
          <CardHeader>
            <CardTitle className="text-base text-foreground font-semibold">Emerging segments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {report.segments.map((s) => (
              <div key={s.segment} className="rounded-lg border border-border bg-muted/10 p-4">
                <div className="flex justify-between gap-2">
                  <div className="font-medium">{s.segment}</div>
                  <Badge variant="secondary">~{Math.round(s.estimatedShare * 100)}%</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{s.description}</p>
              </div>
            ))}
            {(report.personas ?? []).map((p) => (
              <div key={p.name} className="rounded-lg border border-primary/20 bg-primary/10 p-4">
                <div className="flex justify-between gap-2">
                  <div className="font-medium">{p.name}</div>
                  <Badge variant="outline">~{Math.round(p.estimatedShare * 100)}%</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{p.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="jtbd" className="space-y-4">
        <ModuleHeader title="JTBD & Pain Points" description="Jobs users hire Spotify for and discovery blockers." />
        <ModuleInsights insights={insightsForModule(insights, "jtbd")} fallbackModuleId="jtbd" report={result} />
        <Card className="spotify-card ring-0">
          <CardHeader>
            <CardTitle className="text-base text-foreground font-semibold">Jobs To Be Done</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="py-2 pr-4">JTBD</th>
                    <th className="py-2">Frequency</th>
                  </tr>
                </thead>
                <tbody>
                  {report.jtbds.slice(0, 20).map((j) => (
                    <tr key={j.job} className="border-b border-border/50">
                      <td className="py-3 pr-4">{j.job}</td>
                      <td className="py-3">{j.frequency}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        <Card className="spotify-card ring-0">
          <CardHeader>
            <CardTitle className="text-base text-foreground font-semibold">Pain Points</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {report.painPoints.slice(0, 12).map((p) => (
              <div key={p.painPoint} className="rounded-lg border border-border bg-muted/10 p-4">
                <div className="font-medium">{p.painPoint}</div>
                <div className="text-xs text-muted-foreground mt-1">{p.frequency} mentions</div>
                {p.representativeQuotes[0] && <QuoteCitation quote={p.representativeQuotes[0]} compact />}
              </div>
            ))}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="rootcauses" className="space-y-4">
        <ModuleHeader title="Root Causes" description="Symptoms vs underlying causes — algorithmic vs UX." />
        <ModuleInsights insights={insightsForModule(insights, "rootcauses")} fallbackModuleId="rootcause" report={result} />
        <Card className="spotify-card ring-0">
          <CardHeader>
            <CardTitle className="text-base text-foreground font-semibold">Root Cause Map</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {report.rootCauses.slice(0, 12).map((r) => (
              <div key={r.complaint} className="rounded-lg border border-border bg-muted/5 p-4 text-sm">
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Complaint</div>
                <div className="font-medium mt-1">{r.complaint}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide mt-3">AI interpretation</div>
                <div className="text-muted-foreground mt-1">{r.inferredRootCause}</div>
                {r.evidenceQuotes[0] && (
                  <div className="mt-2">
                    <QuoteCitation quote={r.evidenceQuotes[0]} compact />
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="opportunities" className="space-y-4">
        <ModuleHeader title="AI Opportunity Analysis" description="Growth-aligned opportunities, especially AI-enabled." />
        <ModuleInsights insights={insightsForModule(insights, "opportunities")} fallbackModuleId="opportunity" report={result} />
        <Card className="spotify-card ring-0">
          <CardHeader>
            <CardTitle className="text-base text-foreground font-semibold">Product Opportunities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {report.opportunities.slice(0, 15).map((o) => (
              <div key={o.opportunity} className="rounded-lg border border-border bg-muted/10 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-medium">{o.opportunity}</div>
                  <div className="text-xs text-muted-foreground">
                    {o.priority.toUpperCase()} · {o.businessImpact} impact · {Math.round(o.confidence * 100)}%
                  </div>
                </div>
                {o.evidence[0] && (
                  <div className="mt-2">
                    <QuoteCitation quote={o.evidence[0]} compact />
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="business" className="space-y-4">
        <ModuleHeader title="Business Impact" description="Engagement, retention, and repetitive listening risks." />
        <ModuleInsights insights={insightsForModule(insights, "business")} fallbackModuleId="business" report={result} />
        {(report.pmRecommendations ?? []).length > 0 && (
          <Card className="spotify-card ring-0">
            <CardHeader>
              <CardTitle className="text-base text-foreground font-semibold">Growth Team Priorities</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {report.pmRecommendations!.map((rec) => (
                <div key={rec.title} className="rounded-lg border border-primary/20 bg-primary/10 p-4">
                  <div className="font-medium">{rec.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Priority {rec.priority.toUpperCase()} · {rec.impact} impact · {Math.round(rec.confidence * 100)}%
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">{rec.rationale}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </TabsContent>

      {showReportTab && (
        <TabsContent value="report" className="mt-0 space-y-4">
          <PMReportPanel result={result} />
        </TabsContent>
      )}
    </Tabs>
  );
}

export function ExecutiveSummaryCard({ report: result }: { report: AnalyzeResponse }) {
  const report = result.report;
  const es = report.executiveSummary;
  const advanced = report.advancedAnalysis;

  return (
    <>
      <Card className="spotify-card ring-0">
        <CardHeader>
          <CardTitle className="text-foreground font-bold">Executive Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-border bg-muted/10 p-3 text-sm">
            <div className="font-medium text-foreground mb-1">TL;DR</div>
            <p className="text-muted-foreground">
              {es?.recommendedPMFocus ?? report.summary.keyInsights[0] ?? "Discovery-focused product intelligence."}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <Badge variant="secondary">Discovery & Recommendations</Badge>
            <Badge variant="secondary">{report.overview.totalReviewsAnalyzed.toLocaleString()} reviews analyzed</Badge>
          </div>

          {es?.candidateProblemStatements && es.candidateProblemStatements.length > 0 ? (
            <div className="space-y-3">
              <div className="text-sm font-medium">Problem Statements</div>
              {es.candidateProblemStatements.map((p) => (
                <div
                  key={p.id}
                  className={`rounded-lg border p-4 ${p.id === es.recommendedProblemId ? "border-primary/25 bg-primary/10" : "border-border bg-muted/10"}`}
                >
                  <div className="text-sm font-medium">
                    {p.label}
                    {p.id === es.recommendedProblemId && (
                      <span className="ml-2 text-xs text-primary">Recommended</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{p.statement}</p>
                </div>
              ))}
            </div>
          ) : es?.recommendedProblemStatement ? (
            <div className="rounded-lg border border-primary/25 bg-primary/10 p-4">
              <div className="text-sm font-medium mb-1">Recommended Problem Statement</div>
              <p className="text-sm text-muted-foreground">{es.recommendedProblemStatement}</p>
            </div>
          ) : null}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-4">
              <SentimentPie
                sentiment={report.sentiment}
                title="Review Sentiment Distribution"
                totalReviews={report.overview.totalReviewsAnalyzed}
              />
              {report.themes.length > 0 && (
                <InsightClusterDiagram themes={report.themes} />
              )}
            </div>
            <div className="space-y-3">
              <InsightList title="Top Discovery Problems" items={es?.topDiscoveryProblems ?? es?.topFrustrations ?? report.summary.topProblems} />
              <InsightList title="Top Recommendation Frustrations" items={es?.topRecommendationFrustrations ?? []} />
              <InsightList title="Top Unmet Needs" items={es?.topUnmetNeeds ?? []} />
              <InsightList title="Top Product Opportunities" items={es?.topProductOpportunities ?? es?.topOpportunities ?? report.summary.topOpportunities} />
            </div>
          </div>

          {es?.researchHypotheses && es.researchHypotheses.length > 0 && (
            <InsightList title="Research Hypotheses" items={es.researchHypotheses} />
          )}
          {es?.recommendedPMFocus && (
            <div className="rounded-lg border border-border bg-muted/10 p-4 text-sm">
              <div className="font-medium">Recommended PM Focus</div>
              <p className="text-muted-foreground mt-1">{es.recommendedPMFocus}</p>
            </div>
          )}
          {es?.solutionDirections && es.solutionDirections.length > 0 && (
            <InsightList title="Top Solution Directions" items={es.solutionDirections} />
          )}
          {es?.suggestedInterviewQuestions && es.suggestedInterviewQuestions.length > 0 && (
            <div className="rounded-lg border border-border bg-muted/10 p-4">
              <div className="text-sm font-medium mb-2">Interview Guide ({es.suggestedInterviewQuestions.length} questions)</div>
              {es.interviewGuideByHypothesis?.map((group) => (
                <div key={group.hypothesis} className="mb-4 last:mb-0">
                  <div className="text-xs font-medium text-muted-foreground mb-1">{group.hypothesis}</div>
                  <ol className="list-decimal pl-5 text-sm text-muted-foreground space-y-1">
                    {group.questions.map((q) => (
                      <li key={q}>{q}</li>
                    ))}
                  </ol>
                </div>
              )) ?? (
                <ol className="list-decimal pl-5 text-sm text-muted-foreground space-y-1">
                  {es.suggestedInterviewQuestions.map((q) => (
                    <li key={q}>{q}</li>
                  ))}
                </ol>
              )}
            </div>
          )}
          {es?.nextSteps && es.nextSteps.length > 0 && (
            <div className="rounded-lg border border-border bg-muted/10 p-4">
              <div className="text-sm font-medium mb-1">Next Steps</div>
              <p className="text-xs text-muted-foreground mb-2">AI analysis → Human validation → Problem statement</p>
              <ol className="list-decimal pl-5 text-sm text-muted-foreground space-y-1">
                {es.nextSteps.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
            </div>
          )}
        </CardContent>
      </Card>

      {advanced && (
        <Card className="spotify-card ring-0">
          <CardHeader>
            <CardTitle className="text-foreground font-bold">Advanced Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {advanced.competitive && (
              <div>
                <div className="text-sm font-medium mb-2">Competitive Intelligence</div>
                <InsightList title="Competitors mentioned" items={advanced.competitive.competitors} />
                <InsightList title="Requested competitor features" items={advanced.competitive.requestedFeatures} />
                <InsightList title="Comparison reasons" items={advanced.competitive.comparisonReasons} />
              </div>
            )}
            {advanced.sentiment && (
              <div>
                <div className="text-sm font-medium mb-2">Sentiment Analysis</div>
                <InsightList title="Dominant positive themes" items={advanced.sentiment.positiveThemes} />
                <InsightList title="Dominant negative themes" items={advanced.sentiment.negativeThemes} />
                <InsightList title="Polarizing topics" items={advanced.sentiment.polarizingTopics} />
              </div>
            )}
            {advanced.featureRequests && (
              <div>
                <div className="text-sm font-medium mb-2">Generic Feature Requests</div>
                <InsightList title="Most requested features" items={advanced.featureRequests.topRequests} />
                <InsightList title="Cross-platform requests" items={advanced.featureRequests.crossPlatformRequests} />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {result.warnings.length > 0 && (
        <div className="rounded-lg border border-yellow-500/25 bg-yellow-500/5 p-3 text-sm">
          <div className="font-medium mb-1">Warnings</div>
          <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
            {result.warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

export function PMReportPanel({ result }: { result: AnalyzeResponse }) {
  const report = result.report;
  const markdown = generatePMReportMarkdown(report);

  const handlePrint = () => window.print();

  const handleEmail = () => {
    const subject = encodeURIComponent("Spotify Growth Team · Product Intelligence Report");
    const excerpt = markdown.slice(0, 2800);
    const body = encodeURIComponent(
      `${excerpt}${markdown.length > excerpt.length ? "\n\n…[Open the app to download the full report as Markdown]" : ""}`,
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <div className="space-y-4">
      <Card className="spotify-card ring-0 no-print">
        <CardContent className="flex flex-wrap gap-2 py-4">
          <Button className="rounded-full bg-[#1db954] hover:bg-[#1ed760] text-white" onClick={handlePrint}>
            Print / Save PDF
          </Button>
          <Button variant="secondary" className="rounded-full" onClick={handleEmail}>
            Send as Email
          </Button>
          <Button
            variant="secondary"
            className="rounded-full"
            onClick={() => downloadText("spotify-product-intelligence-report.md", markdown)}
          >
            Download Markdown
          </Button>
          <Button variant="outline" className="rounded-full border-border" onClick={() => downloadText("report.json", JSON.stringify(report, null, 2))}>
            JSON
          </Button>
        </CardContent>
      </Card>
      <div id="pm-report-print" className="pm-report-print space-y-4">
        <ExecutiveSummaryCard report={result} />
      </div>
    </div>
  );
}

/** @deprecated Use PMReportPanel — kept for any external imports */
export function ReportExportPanel({ result }: { result: AnalyzeResponse }) {
  return <PMReportPanel result={result} />;
}

function ModuleHeader({ title, description }: { title: string; description: string }) {
  return (
    <Card className="spotify-card ring-0">
      <CardHeader>
        <CardTitle className="text-foreground font-bold">{title}</CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
    </Card>
  );
}

function ModuleInsights({
  insights,
  fallbackModuleId,
  report,
}: {
  insights: DiscoveryInsight[];
  fallbackModuleId: string;
  report: AnalyzeResponse;
}) {
  const module = DISCOVERY_MODULES.find((m) => m.id === fallbackModuleId);
  if (insights.length === 0) {
    return <DiscoveryFallbackCards module={module} report={report} />;
  }
  return (
    <div className="space-y-2">
      {insights.map((insight) => (
        <InsightTile key={insight.questionId} insight={insight} totalReviews={report.report.overview.totalReviewsAnalyzed} />
      ))}
    </div>
  );
}

function DiscoveryFallbackCards({
  module,
  report,
}: {
  module: (typeof DISCOVERY_MODULES)[0] | undefined;
  report: AnalyzeResponse;
}) {
  const questions = module?.questions ?? [];
  return (
    <>
      {questions.map((q, i) => {
        const theme = report.report.themes[i];
        const pain = report.report.painPoints[i];
        return (
          <Card key={q.id} className="spotify-card ring-0">
            <CardHeader>
              <CardTitle className="text-base text-foreground">{q.question}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              {theme ? (
                <>
                  <p>{theme.description}</p>
                  {theme.representativeQuotes[0] && (
                    <QuoteCitation quote={theme.representativeQuotes[0]} />
                  )}
                </>
              ) : pain ? (
                <p>{pain.painPoint}</p>
              ) : (
                <p>Run the AI Product Intelligence Agent to populate structured insights.</p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </>
  );
}

function InsightList({ title, items }: { title: string; items: Array<string | EvidenceQuote> }) {
  if (!items.length) return null;
  const normalized = items
    .map((item) => (typeof item === "string" ? evidenceQuoteFromInlineText(item) : coerceEvidenceQuote(item)))
    .filter((q): q is EvidenceQuote => q != null);

  return (
    <div className="rounded-lg border border-border bg-muted/20 p-4">
      <div className="text-sm font-medium">{title}</div>
      <ul className="mt-2 space-y-2 text-sm text-muted-foreground list-none pl-0">
        {normalized.slice(0, 8).map((q, i) => (
          <li key={`${title}-${i}`} className="leading-relaxed">
            <span>{q.quote}</span>
            {q.url && classifyReviewUrl(q.url).valid && (
              <a
                href={q.url}
                target="_blank"
                rel="noreferrer"
                className="ml-2 text-primary hover:underline font-medium text-xs whitespace-nowrap"
              >
                {sourceLinkLabel(q)} ↗
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
