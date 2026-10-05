import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Archive, CircleHelp, Hexagon, History, Home, Scale, Shield, Share2 } from "lucide-react";
import type { ReactNode } from "react";
import { InstallAppButton } from "@/components/apiary/install-app";
import { useTutorial } from "@/components/apiary/tutorial";
import { HiveMark } from "@/components/brand/hive-mark";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { APP_BUILD_ID, APP_VERSION } from "@/lib/apiary";

const NAV = [
  { to: "/", label: "Inicio", icon: Home, exact: true },
  { to: "/apiarios", label: "Apiarios", icon: Hexagon },
  { to: "/sanidad", label: "Sanidad", icon: Shield },
  { to: "/produccion", label: "Producción", icon: Scale },
  { to: "/historico", label: "Histórico", icon: History },
  { to: "/datos", label: "Datos", icon: Archive },
] as const;

function isActive(pathname: string, to: string, exact?: boolean) {
  if (exact || to === "/") return pathname === "/";
  return pathname === to || pathname.startsWith(`${to}/`);
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { show } = useTutorial();
  const [updateVisible, setUpdateVisible] = useState(false);
  const [updateVersion, setUpdateVersion] = useState(APP_VERSION);\n  const [updateBuildId, setUpdateBuildId] = useState(APP_BUILD_ID);

  useEffect(() => {
    let cancelled = false;

    async function checkVersion() {
      let seen: string | null = null;
      try {
        seen = window.localStorage.getItem("mi-apiario:app-build-seen") ?? window.localStorage.getItem("mi-apiario:app-version-seen");
      } catch {
        // El aviso seguirá funcionando aunque localStorage no esté disponible.
      }

      let targetVersion = APP_VERSION;
      let targetBuildId = APP_BUILD_ID;

      try {
        const response = await fetch(`${import.meta.env.BASE_URL}version.json?ts=${Date.now()}`, {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" },
        });
        if (response.ok) {
          const remote = (await response.json()) as { version?: string };
          if (remote.version) targetVersion = remote.version;
        }
      } catch {
        // Sin red usamos la versión incluida en la aplicación.
      }

      if (cancelled) return;
      setUpdateVersion(targetVersion);
      setUpdateVisible(seen !== targetVersion);
    }

    void checkVersion();
    return () => {
      cancelled = true;
    };
  }, []);

  function updateApp() {\n    const url = `${window.location.pathname}?actualizacion=${Date.now()}${window.location.hash}`;\n    window.location.replace(url);\n  }\n\n  function dismissUpdate() {
    try {\n      window.localStorage.setItem("mi-apiario:app-version-seen", updateVersion);\n      window.localStorage.setItem("mi-apiario:app-build-seen", updateBuildId);\n    } catch { /* best effort */ }
    setUpdateVisible(false);
  }

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-border bg-card md:flex">
        <Link to="/" aria-label="Ir al inicio de Mi Apiario" className="flex items-center gap-2.5 rounded-lg px-5 pt-6 pb-5 transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
          <HiveMark className="size-10" />
          <div>
            <p className="font-display text-lg leading-none tracking-tight">mi-apiario</p>
            <p className="mt-1 text-xs text-muted-foreground">Cuaderno de explotación</p>
          </div>
        </Link>
        <nav className="flex flex-1 flex-col gap-0.5 px-3">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              {...item}
              active={isActive(pathname, item.to, "exact" in item && item.exact)}
              layout="side"
            />
          ))}
        </nav>
        <div className="grid gap-2 px-3 pb-5">
          <Button type="button" variant="outline" size="sm" onClick={show}>
            <CircleHelp />
            Guía
          </Button>
          <InstallAppButton size="sm" label="Descargar app" />
          <p className="px-1 text-xs text-muted-foreground">Datos en este dispositivo</p>
        </div>
      </aside>

      <header className="sticky top-0 z-30 flex h-14 items-center gap-1 border-b border-border bg-background/95 px-3 backdrop-blur-sm md:hidden">
        <Link to="/" aria-label="Ir al inicio de Mi Apiario" className="flex min-w-0 flex-1 items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
          <HiveMark className="size-8" />
          <p className="font-display truncate text-base tracking-tight">mi-apiario</p>
        </Link>
        <Button type="button" variant="ghost" size="icon" aria-label="Guía" onClick={show}>
          <CircleHelp />
        </Button>
        <InstallAppButton iconOnly variant="ghost" label="Descargar aplicación" />
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 pt-5 pb-8 md:pl-[calc(15rem+2rem)] md:pr-8 md:pt-8 md:pb-12">
        {updateVisible ? (
          <section className="mb-4 flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4" role="status">
            <span className="text-lg" aria-hidden="true">🆕</span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">Nueva versión de Mi Apiario</p>
              <p className="mt-1 text-sm text-muted-foreground">Versión {updateVersion} disponible. Incluye mejoras y conserva tus datos locales.</p>
              <p className="mt-1 text-xs text-muted-foreground">Si no ves los cambios, recarga la aplicación.</p>
            </div>
            <div className="flex shrink-0 gap-1"><Button type="button" variant="ghost" size="sm" onClick={dismissUpdate}>Después</Button><Button type="button" size="sm" onClick={updateApp}>Actualizar</Button></div>
          </section>
        ) : null}
        {children}
      </main>

      <footer className="mx-auto w-full max-w-5xl px-4 pb-24 pt-6 md:pl-[calc(15rem+2rem)] md:pr-8 md:pb-8">
        <section className="rounded-2xl border border-emerald-800/20 bg-emerald-50/70 p-5 text-center shadow-sm dark:bg-emerald-950/20 sm:p-6">
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-emerald-800/10 text-emerald-800 dark:text-emerald-200"><Share2 className="size-6" /></div>
          <h2 className="font-display text-xl font-semibold">Comparte Mi Apiario</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">¿Conoces a otros apicultores? Comparte esta aplicación gratuita y ayúdanos a llegar a más personas.</p>
          <Button asChild className="mt-4 min-h-12 w-full text-base sm:w-auto"><a href="https://wa.me/?text=Descubre%20Mi%20Apiario%2C%20una%20app%20gratuita%20para%20apicultores%3A%20https%3A%2F%2Fttttooonni.github.io%2Fmi-apiario%2F" target="_blank" rel="noreferrer"><Share2 className="mr-2 size-5" />Compartir por WhatsApp</a></Button>
        </section>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-center text-xs text-muted-foreground">
          <span>Mi Apiario · gratuito para apicultores</span><span aria-hidden="true">·</span>
          <a className="underline underline-offset-2" href="mailto:ttttooonni.ia@gmail.com">Contacto por email</a><span aria-hidden="true">·</span>
          <a className="underline underline-offset-2" href="https://wa.me/34639623598?text=Hola%2C%20te%20contacto%20por%20Mi%20Apiario." target="_blank" rel="noreferrer">WhatsApp: 639 623 598</a>
        </div>
      </footer>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] md:hidden">
        <div className="grid grid-cols-6">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              {...item}
              active={isActive(pathname, item.to, "exact" in item && item.exact)}
              layout="bottom"
            />
          ))}
        </div>
      </nav>
    </div>
  );
}

function NavLink({
  to,
  label,
  icon: Icon,
  active,
  layout,
}: {
  to: string;
  label: string;
  icon: typeof Home;
  active: boolean;
  layout: "side" | "bottom";
}) {
  if (layout === "bottom") {
    return (
      <Link
        to={to}
        className={cn(
          "flex min-h-14 flex-col items-center justify-center gap-1 px-0.5 text-[10px] font-medium",
          active ? "text-primary" : "text-muted-foreground",
        )}
      >
        <Icon className="size-5" strokeWidth={active ? 2.2 : 1.8} />
        {label}
      </Link>
    );
  }

  return (
    <Link
      to={to}
      className={cn(
        "flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors duration-150",
        active ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground",
      )}
    >
      <Icon className="size-4" />
      {label}
    </Link>
  );
}
