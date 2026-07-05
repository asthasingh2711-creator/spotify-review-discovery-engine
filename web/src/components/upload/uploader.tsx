"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { parseUploadedJson } from "@/lib/normalize";
import type { UploadedDataset } from "@/types/reviews";

type Props = {
  onDatasetReady: (dataset: UploadedDataset, raw: unknown) => void;
};

export function Uploader({ onDatasetReady }: Props) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [count, setCount] = useState<number>(0);

  const hint = useMemo(() => {
    if (!fileName) return "Upload a JSON export containing reviews and discussions.";
    return `${fileName} · ${count.toLocaleString()} reviews/discussions parsed`;
  }, [fileName, count]);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    try {
      const text = await file.text();
      const raw = JSON.parse(text);
      const dataset = parseUploadedJson(raw);
      setCount(dataset.reviews.length);
      if (dataset.reviews.length === 0) {
        toast.error("Parsed 0 reviews. Check your JSON structure.");
        return;
      }
      toast.success(`Loaded ${dataset.reviews.length.toLocaleString()} entries.`);
      onDatasetReady(dataset, raw);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to read file";
      toast.error(msg);
    }
  }

  return (
    <Card className="bg-card/60">
      <CardHeader>
        <CardTitle>Upload Reviews JSON</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input type="file" accept="application/json" onChange={onChange} />
        <p className="text-sm text-muted-foreground">{hint}</p>
        <div className="text-xs text-muted-foreground">
          Tip: you can upload the file generated at <code className="px-1">data/reviews_discussions.json</code>.
        </div>
      </CardContent>
    </Card>
  );
}

