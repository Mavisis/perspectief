import type { BiasLabel } from "@/lib/types";
import { BIAS_META } from "@/lib/types";
import { cn } from "@/lib/utils";

interface BiasTagProps {
  bias: BiasLabel;
  size?: "sm" | "md";
  className?: string;
}

const biasColorClass: Record<BiasLabel, string> = {
  left: "bg-bias-left",
  "center-left": "bg-bias-center-left",
  center: "bg-bias-center",
  "center-right": "bg-bias-center-right",
  right: "bg-bias-right",
  religious: "bg-bias-religious",
};

export function BiasTag({ bias, size = "sm", className }: BiasTagProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-body font-medium text-primary-foreground",
        size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm",
        biasColorClass[bias],
        className
      )}
    >
      {BIAS_META[bias].label}
    </span>
  );
}

interface BiasBarProps {
  biases: BiasLabel[];
  className?: string;
}

export function BiasBar({ biases, className }: BiasBarProps) {
  const counts: Partial<Record<BiasLabel, number>> = {};
  biases.forEach((b) => (counts[b] = (counts[b] || 0) + 1));
  const total = biases.length;

  return (
    <div className={cn("flex h-2 w-full overflow-hidden rounded-full", className)}>
      {(Object.entries(counts) as [BiasLabel, number][]).map(([bias, count]) => (
        <div
          key={bias}
          className={cn("h-full transition-all", biasColorClass[bias])}
          style={{ width: `${(count / total) * 100}%` }}
          title={`${BIAS_META[bias].label}: ${count} artikel${count > 1 ? "en" : ""}`}
        />
      ))}
    </div>
  );
}
