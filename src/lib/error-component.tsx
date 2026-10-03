import type { ErrorComponentProps } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { TriangleAlert } from "lucide-react";

export function AppErrorComponent({ error }: ErrorComponentProps) {
  return (
    <main className="flex min-h-[50vh] flex-col items-center justify-center gap-3 px-6 text-center">
      <span className="text-destructive" aria-hidden="true">
        <TriangleAlert className="size-8" strokeWidth={1.8} />
      </span>
      <h1 className="font-display text-xl font-medium">Ha ocurrido un error</h1>
      <p className="max-w-md text-sm break-words text-muted-foreground">
        {error.message || "Error inesperado. Recarga la página."}
      </p>
      <Link to="/" className="mt-2 text-sm font-medium text-primary hover:underline">
        Volver al inicio
      </Link>
    </main>
  );
}
