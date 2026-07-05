import { NextResponse } from "next/server";
import { loadDiscoveryDataset, persistAnalysisResult } from "@/lib/persistence";
import { runAnalysis, type AnalysisProgressEvent } from "@/services/analysis/run-analysis";
import { formatLlmError } from "@/services/analysis/llm";

export const runtime = "nodejs";
export const maxDuration = 300;

function sseEncode(event: AnalysisProgressEvent | Record<string, unknown>) {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export async function POST(req: Request) {
  const accept = req.headers.get("accept") ?? "";
  const wantsStream = accept.includes("text/event-stream");

  try {
    const discovery = await loadDiscoveryDataset();
    if (!discovery || discovery.reviews.length === 0) {
      return NextResponse.json(
        { ok: false, error: "No discovery-relevant dataset. Refresh reviews to run ETL first." },
        { status: 400 },
      );
    }

    const reviews = discovery.reviews;
    const meta = discovery.meta;

    if (!wantsStream) {
      const result = await runAnalysis(reviews, {});
      await persistAnalysisResult({
        report: result.report,
        warnings: result.warnings,
        runId: result.runId,
        savedAt: new Date().toISOString(),
        meta,
      });
      return Response.json({
        ok: true,
        meta,
        report: result.report,
        warnings: result.warnings,
        runId: result.runId,
      });
    }

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        const send = (event: AnalysisProgressEvent | Record<string, unknown>) => {
          controller.enqueue(encoder.encode(sseEncode(event)));
        };

        try {
          const result = await runAnalysis(reviews, {
            onProgress: (e) => {
              if (e.type !== "done") send(e);
            },
          });
          await persistAnalysisResult({
            report: result.report,
            warnings: result.warnings,
            runId: result.runId,
            savedAt: new Date().toISOString(),
            meta,
          });
          send({
            type: "result",
            ok: true,
            meta,
            report: result.report,
            warnings: result.warnings,
            runId: result.runId,
          });
        } catch (err) {
          const message = formatLlmError(err);
          send({ type: "error", ok: false, error: message });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    const message = formatLlmError(err);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
