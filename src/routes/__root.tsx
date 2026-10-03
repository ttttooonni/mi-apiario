import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { AppShell } from "@/components/layout/app-shell";
import { Providers } from "@/components/layout/providers";
import { publicUrl } from "@/lib/asset";
import appCss from "../styles.css?url";

const APP_NAME = "mi-apiario";

function publicAppHost(value: unknown): string {
  const host = String(value ?? "")
    .split(",")[0]
    .trim()
    .split(":")[0]
    .toLowerCase();
  if (!host || !/^[a-z0-9.-]+$/.test(host) || !host.includes(".")) return "";
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(host)) return "";
  if (
    host === "vercel.app" ||
    host.endsWith(".vercel.app") ||
    host === "vercel.com" ||
    host.endsWith(".vercel.com")
  ) {
    return "";
  }
  return host;
}

export const Route = createRootRoute({
  head: () => {
    const host = publicAppHost(import.meta.env.VITE_PUBLIC_HOSTNAME);
    const xBanner = host ? `https://${host}${publicUrl("x-banner.jpg")}` : "";
    return {
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
        { title: APP_NAME },
        { name: "theme-color", content: "#f3efe4" },
        {
          name: "description",
          content: "Cuaderno de explotación apícola. Local, sencillo y profesional.",
        },
        ...(xBanner ? [{ property: "x:game:image", content: xBanner }] : []),
      ],
      links: [
        { rel: "icon", type: "image/png", sizes: "32x32", href: publicUrl("favicon-32.png") },
        { rel: "icon", type: "image/svg+xml", href: publicUrl("favicon.svg") },
        { rel: "stylesheet", href: appCss },
        { rel: "manifest", href: publicUrl("__grok/manifest.webmanifest") },
        { rel: "apple-touch-icon", href: publicUrl("__grok/icon-180.png") },
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Source+Sans+3:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap",
        },
      ],
    };
  },
  component: RootDocument,
});

function RootDocument() {
  return (
    <html lang="es" className="antialiased" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <PreviewHostBridge />
        <AuthProvider>
          <Providers>
            <AppShell>
              <Outlet />
            </AppShell>
          </Providers>
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  );
}
