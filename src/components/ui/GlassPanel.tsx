import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type GlassPanelProps = HTMLAttributes<HTMLDivElement>;

export function GlassPanel({ className, ...props }: GlassPanelProps) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-white/15 bg-slate-950/50 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.35)]",
        className,
      )}
      {...props}
    />
  );
}
