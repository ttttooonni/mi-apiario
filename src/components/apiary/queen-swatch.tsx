import { queenColorFromDate, QUEEN_COLOR_META, type QueenColor } from "@/lib/apiary";
import { cn } from "@/lib/utils";

export function QueenSwatch({
  date,
  color,
  size = "md",
  className,
}: {
  date?: string;
  color?: QueenColor;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const resolved = color ?? (date ? queenColorFromDate(date) : "white");
  const meta = QUEEN_COLOR_META[resolved];
  const dim = size === "sm" ? "size-3.5" : size === "lg" ? "size-8" : "size-5";
  return (
    <span
      className={cn("inline-block shrink-0 rounded-full border", dim, className)}
      style={{ backgroundColor: meta.fill, borderColor: meta.stroke }}
      title={meta.label}
      aria-label={meta.label}
    />
  );
}

export function QueenColorCaption({ date }: { date: string }) {
  const year = date.slice(0, 4);
  const color = queenColorFromDate(date);
  const meta = QUEEN_COLOR_META[color];
  return (
    <span className="inline-flex items-center gap-2 text-sm">
      <QueenSwatch date={date} />
      <span>
        {year} · {meta.label}
      </span>
    </span>
  );
}
