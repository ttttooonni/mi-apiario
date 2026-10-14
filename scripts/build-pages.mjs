#!/usr/bin/env node
/**
 * Static SPA build for GitHub Pages (no Node server).
 * Default `npm run build` stays on the Vercel/Nitro path.
 *
 *   PAGES_BASE=/mi-apiario/ npm run build:pages
 */
import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const dest = join(root, "dist", "pages");
const base = process.env.PAGES_BASE || "/mi-apiario/";
const basePrefix = base.endsWith("/") ? base.slice(0, -1) : base;
const startUrl = `${basePrefix}/`;

process.env.PAGES = "1";
process.env.PAGES_BASE = base.endsWith("/") ? base : `${base}/`;

const gitSha = spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf8", cwd: root });
const buildId = (process.env.GITHUB_SHA || (gitSha.status === 0 ? gitSha.stdout.trim() : "") || String(Date.now())).trim();
process.env.VITE_APP_BUILD_ID = buildId;

const build = spawnSync(process.execPath, ["scripts/with-app-env.mjs", "vite", "build"], {
  stdio: "inherit",
  env: process.env,
  cwd: root,
});
if (build.status !== 0) process.exit(build.status ?? 1);

const candidates = [join(root, "dist", "client"), join(root, ".output", "public"), join(root, "dist")];

function looksLikeSite(dir) {
  if (!existsSync(dir)) return false;
  try {
    const names = readdirSync(dir);
    return names.some((n) => n === "index.html" || n === "_shell.html" || n === "assets");
  } catch {
    return false;
  }
}

const src = candidates.find(looksLikeSite);
if (!src) {
  console.error("[build-pages] No se encontró HTML estático (index.html / assets).");
  process.exit(1);
}

rmSync(dest, { recursive: true, force: true });
mkdirSync(dest, { recursive: true });

for (const name of readdirSync(src)) {
  if (name === "pages") continue;
  cpSync(join(src, name), join(dest, name), { recursive: true });
}

const shellCandidates = ["index.html", "_shell.html", "index.html.html"].map((n) => join(dest, n));
const shell = shellCandidates.find((p) => existsSync(p));
if (!shell) {
  console.error("[build-pages] El build no emitió index.html ni _shell.html.");
  process.exit(1);
}
if (shell !== join(dest, "index.html")) {
  copyFileSync(shell, join(dest, "index.html"));
}

function rewriteRootUrls(html) {
  const prefixRel = basePrefix.replace(/^\//, "");
  return html.replace(/(href|src)="\/(?!\/)([^"]*)"/g, (full, attr, path) => {
    if (path === prefixRel || path.startsWith(`${prefixRel}/`)) return full;
    return `${attr}="${basePrefix}/${path}"`;
  });
}

const indexPath = join(dest, "index.html");
const rewritten = rewriteRootUrls(readFileSync(indexPath, "utf8"));

const iconVersion = encodeURIComponent(buildId);\nconst nativePwaHead = `<link rel="manifest" href="${basePrefix}/manifest.webmanifest?v=${iconVersion}"><link rel="apple-touch-icon" href="${basePrefix}/icon-192.png?v=${iconVersion}"><meta name="theme-color" content="#244A35">`;
const pwaCleaned = rewritten.replace(/<link rel="manifest" href="[^"]*">/g, "").replace(/<link rel="apple-touch-icon" href="[^"]*">/g, "").replace(/<meta name="theme-color" content="[^"]*">/g, "");
const guarded = pwaCleaned.replace("</head>", nativePwaHead + "</head>");
writeFileSync(indexPath, guarded);
writeFileSync(join(dest, "404.html"), guarded);
writeFileSync(join(dest, ".nojekyll"), "");

const manifest = {
  name: "Mi Apiario",
  short_name: "Mi Apiario",
  id: startUrl,
  start_url: startUrl,
  scope: startUrl,
  display: "standalone",
  background_color: "#F6F1E6",
  theme_color: "#244A35",
  description: "Cuaderno de explotación apícola gratuito, local y sencillo.",
  lang: "es",
  icons: [
    { src: `${startUrl}icon-192.png?v=${iconVersion}`, sizes: "192x192", type: "image/png", purpose: "any" },
    { src: `${startUrl}icon-512.png?v=${iconVersion}`, sizes: "512x512", type: "image/png", purpose: "any" },
  ],
};
const manifestJson = `${JSON.stringify(manifest, null, 2)}\n`;
writeFileSync(join(dest, "manifest.webmanifest"), manifestJson);

const typesSource = readFileSync(join(root, "src", "lib", "apiary", "types.ts"), "utf8");
const versionMatch = typesSource.match(/export const APP_VERSION = ["']([^"']+)["'];/);
if (!versionMatch) {
  console.error("[build-pages] No se pudo leer APP_VERSION desde src/lib/apiary/types.ts.");
  process.exit(1);
}
const versionInfo = { version: versionMatch[1], buildId };
writeFileSync(join(dest, "version.json"), `${JSON.stringify(versionInfo, null, 2)}\n`);

console.log(`[build-pages] Versión ${versionInfo.version}, build ${buildId}`);
console.log(`[build-pages] Listo: ${dest} (base ${startUrl})`);
