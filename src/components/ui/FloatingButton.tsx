import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface FloatingButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  children?: ReactNode;
}

export function FloatingButton({
  className,
  children,
  ...props
}: FloatingButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[0.08] px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition duration-200 hover:bg-white/[0.14] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
