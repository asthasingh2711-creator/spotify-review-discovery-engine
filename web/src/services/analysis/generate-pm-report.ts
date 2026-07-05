import { formatQuoteMarkdown, parseInlineSourceText } from "@/lib/evidence-quote";
import type { EvidenceQuote, PMReport } from "@/types/analysis";

function divider(width = 72): string {
  return "─".repeat(width);
}

function quoteLines(quotes: EvidenceQuote[]): string[] {
  return quotes.map((q) => formatQuoteMarkdown(q));
}

export function generatePMReportMarkdown(report: PMReport): string {
  const lines: string[] = [];
  const es = report.executiveSummary;
  const scope = report.overview.scope === "discovery" ? "Discovery & Recommendations" : "Entire Product";
  const problems = es?.topDiscoveryProblems ?? report.summary.topProblems;
  const recommended = es?.candidateProblemStatements?.find((p) => p.id === es.recommendedProblemId);

  lines.push("SPOTIFY GROWTH TEAM · PRODUCT INTELLIGENCE REPORT");
  lines.push("");
  lines.push(divider());
  lines.push(`Dataset: ${report.overview.totalReviewsAnalyzed.toLocaleString()} reviews · ${scope}`);
  lines.push(`Period: Jan 2025 – Jun 2026 · Generated ${new Date().toISOString().slice(0, 10)}`);
  lines.push(
    `Sources: ${Object.entries(report.overview.sources)
      .map(([k, v]) => `${k} (${v})`)
      .join(", ")}`,
  );
  lines.push(divider());
  lines.push("");

  lines.push("TL;DR (60 seconds)");
  lines.push("");
  lines.push(`→ Focus: ${es?.recommendedPMFocus ?? "Intent-aware recommendations"}`);
  lines.push(`→ Top problem: ${problems[0] ?? "Recommendation misalignment"}`);
  lines.push(`→ Recommended MVP: ${es?.prioritizedRecommendation ?? opportunitiesFallback(report)}`);
  lines.push(`→ Next: ${es?.nextSteps?.[0] ?? "Validate top hypotheses with user interviews"}`);
  lines.push("");

  lines.push(divider());
  lines.push("");
  lines.push("EXECUTIVE SUMMARY");
  lines.push("");
  lines.push("Key findings");
  problems.slice(0, 5).forEach((x, i) => lines.push(`  ${i + 1}. ${formatPlainListItem(x)}`));
  lines.push("");

  if (es?.candidateProblemStatements?.length) {
    lines.push("Problem statements");
    for (const p of es.candidateProblemStatements) {
      const tag = p.id === es.recommendedProblemId ? " [RECOMMENDED]" : "";
      lines.push(`  ${p.label}${tag}`);
      lines.push(`  ${p.statement}`);
      lines.push("");
    }
  } else if (recommended?.statement || es?.recommendedProblemStatement) {
    lines.push(`Recommended: ${recommended?.statement ?? es?.recommendedProblemStatement}`);
    lines.push("");
  }

  if (es?.prioritizedRecommendation) {
    lines.push("Prioritized recommendation");
    lines.push(`  ${es.prioritizedRecommendation}`);
    if (es.rationale) lines.push(`  Why: ${es.rationale}`);
    lines.push("");
  }

  lines.push(divider());
  lines.push("");
  lines.push("EVIDENCE (with source links)");
  lines.push("");
  for (const t of report.themes.slice(0, 6)) {
    lines.push(`${t.theme} · ${t.frequency} mentions`);
    lines.push(`  Gist: ${t.description}`);
    for (const q of t.representativeQuotes.slice(0, 2)) {
      lines.push(`  ${formatQuoteMarkdown(q).replace(/\n/g, "\n  ")}`);
    }
    lines.push("");
  }

  lines.push(divider());
  lines.push("");
  lines.push("ROOT CAUSE MAP");
  lines.push("");
  for (const r of report.rootCauses.slice(0, 6)) {
    lines.push(`Complaint: ${r.complaint}`);
    lines.push(`  Gist: ${r.complaint}`);
    lines.push(`  AI interpretation: ${r.inferredRootCause}`);
    for (const q of r.evidenceQuotes.slice(0, 1)) {
      lines.push(`  ${formatQuoteMarkdown(q).replace(/\n/g, "\n  ")}`);
    }
    lines.push("");
  }

  lines.push(divider());
  lines.push("");
  lines.push("HYPOTHESES & INTERVIEW GUIDE");
  lines.push("");
  (es?.researchHypotheses ?? []).forEach((h, i) => lines.push(`${i + 1}. ${h}`));
  lines.push("");
  if (es?.interviewGuideByHypothesis?.length) {
    for (const group of es.interviewGuideByHypothesis) {
      lines.push(`▸ ${group.hypothesis}`);
      group.questions.forEach((q, i) => lines.push(`    ${i + 1}. ${q}`));
      lines.push("");
    }
  }

  lines.push(divider());
  lines.push("");
  lines.push("SOLUTION DIRECTIONS");
  lines.push("");
  (es?.solutionDirections ?? []).forEach((x, i) => lines.push(`${i + 1}. ${formatPlainListItem(x)}`));
  lines.push("");

  lines.push(divider());
  lines.push("");
  lines.push("PERSONAS");
  lines.push("");
  for (const p of report.personas ?? []) {
    lines.push(`${p.name} (~${Math.round(p.estimatedShare * 100)}%) — ${p.description}`);
    lines.push(`  Goals: ${p.goals.join("; ")}`);
    lines.push("");
  }

  lines.push(divider());
  lines.push("");
  lines.push("GROWTH OPPORTUNITIES");
  lines.push("");
  for (const o of report.opportunities.slice(0, 8)) {
    lines.push(`• ${o.opportunity}`);
    lines.push(`  ${o.priority.toUpperCase()} · ${o.businessImpact} · ${o.affectedSegments.join(", ")}`);
    for (const q of o.evidence.slice(0, 1)) {
      lines.push(`  ${formatQuoteMarkdown(q).replace(/\n/g, "\n  ")}`);
    }
    lines.push("");
  }

  lines.push(divider());
  lines.push("");
  lines.push("NEXT STEPS");
  lines.push("AI analysis → Human validation → Problem statement");
  lines.push("");
  (es?.nextSteps ?? []).forEach((s, i) => lines.push(`${i + 1}. ${s}`));
  lines.push("");

  lines.push(divider());
  lines.push("");
  lines.push("APPENDIX · DISCOVERY INSIGHTS (detail)");
  lines.push("");
  for (const insight of report.discoveryInsights ?? []) {
    lines.push(`Q: ${insight.question}`);
    if (insight.gist) lines.push(`Gist: ${insight.gist}`);
    if (insight.finding && insight.finding !== insight.gist) lines.push(`Detail: ${insight.finding}`);
    if (insight.aiOpportunity) lines.push(`AI opportunity: ${insight.aiOpportunity}`);
    for (const q of insight.representativeQuotes.slice(0, 2)) {
      lines.push(formatQuoteMarkdown(q));
    }
    lines.push("");
  }

  lines.push(divider());
  lines.push("");
  lines.push("APPENDIX · QUOTE INDEX");
  lines.push("");
  const allQuotes = [
    ...report.themes.flatMap((t) => t.representativeQuotes),
    ...report.painPoints.flatMap((p) => p.representativeQuotes),
    ...report.rootCauses.flatMap((r) => r.evidenceQuotes),
  ];
  quoteLines(allQuotes.slice(0, 20)).forEach((block) => {
    lines.push(block);
    lines.push("");
  });

  return lines.join("\n");
}

function opportunitiesFallback(report: PMReport): string {
  return report.opportunities[0]?.opportunity ?? "Intent-aware recommendation layer";
}

function formatPlainListItem(text: string): string {
  const { text: quote, url } = parseInlineSourceText(text);
  return url ? `${quote} — [Source](${url})` : quote;
}
