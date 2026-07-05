import { existsSync } from "node:fs";
import path from "node:path";

/** Resolve bundled data: web/data on Vercel, ../data when running locally from web/. */
export function dataDir() {
  const inWeb = path.resolve(process.cwd(), "data");
  const inParent = path.resolve(process.cwd(), "..", "data");
  if (existsSync(inWeb)) return inWeb;
  if (existsSync(inParent)) return inParent;
  return inWeb;
}
