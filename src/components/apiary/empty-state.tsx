import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

export function EmptyState({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <Card className="flex flex-col items-start gap-4 p-6 sm:p-8">
      <div>
        <h2 className="font-display text-xl font-medium tracking-tight">{title}</h2>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </Card>
  );
}
