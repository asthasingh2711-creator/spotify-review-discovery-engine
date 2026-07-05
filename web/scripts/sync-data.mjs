import { cpSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";

const src = path.resolve(process.cwd(), "..", "data");
const dest = path.resolve(process.cwd(), "data");

if (!existsSync(src)) {
  console.warn("[sync-data] No ../data directory — skipping (already synced or local-only).");
  process.exit(0);
}

mkdirSync(dest, { recursive: true });
cpSync(src, dest, { recursive: true });
console.log(`[sync-data] Copied ${src} → ${dest}`);
