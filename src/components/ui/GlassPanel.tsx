import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type GlassPanelProps = HTMLAttributes<HTMLDivElement>;

export function GlassPanel({ className, ...props }: GlassPanelProps) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-md shadow-[0_14px_40px_rgba(15,23,42,0.12)]",
        className,
      )}
      {...props}
    />
  );
}
