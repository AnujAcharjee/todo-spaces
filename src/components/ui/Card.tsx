import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type CardProps = {
  className?: string;
  children?: ReactNode;
};

export function Card({ className, children }: CardProps) {
  return (
    <div
      className={cn(
        "flex items-center text-center p-5 w-full",
        className,
      )}
    >
      {children}
    </div>
  );
}
