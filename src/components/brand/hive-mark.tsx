import { publicUrl } from "@/lib/asset";
import { cn } from "@/lib/utils";

export function HiveMark({ className }: { className?: string }) {
  return (
    <img
      src={publicUrl("icon-192.png")}
      alt=""
      width={40}
      height={40}
      className={cn("size-10 shrink-0 rounded-lg ring-1 ring-border/70", className)}
      aria-hidden
    />
  );
}
