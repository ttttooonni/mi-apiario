/** Public asset URL that respects Vite `base` (GitHub Pages lives under a subpath). */
export function publicUrl(path: string): string {
  const base = import.meta.env.BASE_URL || "/";
  const rel = String(path ?? "").replace(/^\/+/, "");
  if (base === "/" || base === "") return `/${rel}`;
  const prefix = base.endsWith("/") ? base : `${base}/`;
  return `${prefix}${rel}`;
}

/** TanStack Router `basepath` from Vite `BASE_URL`. Undefined at site root. */
export function routerBasepath(): string | undefined {
  const trimmed = String(import.meta.env.BASE_URL || "/")
    .replace(/\/+$/, "")
    .replace(/^\.$/, "");
  if (!trimmed || trimmed === "/" || trimmed === ".") return undefined;
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}
