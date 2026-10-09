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

// Keep the HTML shell revalidatable and let already-open pages detect a new
// asset manifest. GitHub Pages does not support custom Cache-Control headers,
// so the client compares the current asset hashes with a fresh no-store fetch.
const updateGuard = [
  '<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">',
  '<script id="mi-apiario-update-check">',
  '(() => {',
  '  const base = ' + JSON.stringify(startUrl) + ';',
  '  const assets = (html) => [...new Set((html.match(/\\/assets\\/[^"\\s<>?#]+/g) || []).filter((x) => /\\.(?:js|css)$/.test(x)))].sort().join("|");',
  '  const currentAssets = assets(document.documentElement.outerHTML);',
  '  let shown = false;',
  '  const check = async () => {',
  '    try {',
  '      const versionResponse = await fetch(base + "version.json?check=" + Date.now(), { cache: "no-store", credentials: "same-origin" });',
  '      const versionInfo = versionResponse.ok ? await versionResponse.json() : null;',
  '      if (versionInfo?.buildId && localStorage.getItem("mi-apiario:app-build-seen") === versionInfo.buildId) return;',
  '      if (document.getElementById("mi-apiario-app-update-notice")) return;',
  '      const response = await fetch(base + "index.html?check=" + Date.now(), { cache: "no-store", credentials: "same-origin" });'
  '      if (!response.ok) return;',
  '      const latestAssets = assets(await response.text());',
  '      if (!latestAssets || latestAssets === currentAssets || shown) return;',
  '      shown = true;',
  '      const notice = document.createElement("div");',
  '      notice.setAttribute("role", "status");',
  '      notice.style.cssText = "position:fixed;z-index:2147483647;left:12px;right:12px;bottom:12px;padding:14px 16px;border:1px solid #d9cba8;border-radius:14px;background:#fffdf6;color:#29261f;box-shadow:0 8px 32px #0003;font:500 14px/1.4 system-ui,sans-serif;display:flex;align-items:center;justify-content:space-between;gap:12px";',
  '      const text = document.createElement("span");',
  '      text.textContent = "Hay una nueva versión de Mi Apiario disponible.";',
  '      const button = document.createElement("button");',
  '      button.type = "button";',
  '      button.textContent = "Actualizar";',
  '      button.style.cssText = "flex-shrink:0;border:0;border-radius:9px;padding:10px 14px;background:#365c36;color:white;font:600 14px system-ui,sans-serif";',
  '      button.addEventListener("click", () => { location.replace(location.pathname + "?actualizacion=" + Date.now() + location.hash); });',
  '      notice.append(text, button);',
  '      document.body.appendChild(notice);',
  '    } catch { /* Sin conexión: se mantiene la versión actual disponible. */ }',
  '  };',
  '  window.setTimeout(check, 2500);',
  '  window.setInterval(check, 120000);',
  '})();',
  '</script>',
].join("\n");
const nativePwaHead = `<link rel="manifest" href="${basePrefix}/manifest.webmanifest"><link rel="apple-touch-icon" href="${basePrefix}/icon-192.png"><meta name="theme-color" content="#244A35">`;
const pwaCleaned = rewritten.replace(/<link rel="manifest" href="[^"]*">/g, "").replace(/<link rel="apple-touch-icon" href="[^"]*">/g, "").replace(/<meta name="theme-color" content="[^"]*">/g, "");
const guarded = pwaCleaned.replace("</head>", nativePwaHead + updateGuard + "</head>");
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
    { src: `${startUrl}icon-192.png`, sizes: "192x192", type: "image/png", purpose: "any" },
    { src: `${startUrl}icon-512.png`, sizes: "512x512", type: "image/png", purpose: "any" },
  ],
};
const manifestJson = `${JSON.stringify(manifest, null, 2)}\n`;
writeFileSync(join(dest, "manifest.webmanifest"), manifestJson);

console.log(`[build-pages] Listo: ${dest} (base ${startUrl})`);
