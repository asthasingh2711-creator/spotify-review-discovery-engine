import { existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const bundledInWeb = () => path.resolve(process.cwd(), "data");
const bundledInParent = () => path.resolve(process.cwd(), "..", "data");

export function isVercelRuntime() {
  return Boolean(process.env.VERCEL);
}

/** Dataset baked into the deployment at build time. */
export function bundledDataDir(): string {
  const inWeb = bundledInWeb();
  if (existsSync(inWeb)) return inWeb;
  const inParent = bundledInParent();
  if (existsSync(inParent)) return inParent;
  return inWeb;
}

/** Writable directory — /tmp on Vercel, bundled path locally. */
export function writableDataDir(): string {
  if (isVercelRuntime()) {
    return path.join(os.tmpdir(), "nl-spotify-data");
  }
  return bundledDataDir();
}

/** @deprecated use bundledDataDir or writableDataDir */
export function dataDir() {
  return writableDataDir();
}

export function dataFilePath(...parts: string[]) {
  return path.join(writableDataDir(), ...parts);
}

export function bundledFilePath(...parts: string[]) {
  return path.join(bundledDataDir(), ...parts);
}
