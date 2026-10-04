import { Badge } from "@/components/ui/badge";
import { COLONY_KIND_LABEL, type ColonyKind } from "@/lib/apiary";

export function ColonyKindBadge({ kind }: { kind: ColonyKind }) {
  return (
    <Badge
      variant="outline"
      className={
        kind === "hive"
          ? "border-emerald-700/30 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
          : "border-amber-700/30 bg-amber-50 text-amber-950 dark:bg-amber-950/40 dark:text-amber-100"
      }
    >
      {COLONY_KIND_LABEL[kind]}
    </Badge>
  );
}
