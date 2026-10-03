import { Badge } from "@/components/ui/badge";
import { COLONY_KIND_LABEL, type ColonyKind } from "@/lib/apiary";

export function ColonyKindBadge({ kind }: { kind: ColonyKind }) {
  return (
    <Badge variant={kind === "hive" ? "outline" : "secondary"}>
      {COLONY_KIND_LABEL[kind]}
    </Badge>
  );
}
