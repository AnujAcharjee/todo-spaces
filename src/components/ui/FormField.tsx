import type { ReactNode } from "react";

interface FormFieldProps {
  label: string;
  htmlFor: string;
  hint?: string;
  children: ReactNode;
}

export function FormField({
  label,
  htmlFor,
  hint,
  children,
}: FormFieldProps) {
  return (
    <label htmlFor={htmlFor} className="flex flex-col gap-2">
      <span className="text-sm font-medium text-white/85">{label}</span>
      {children}
      {hint ? <span className="text-xs text-white/45">{hint}</span> : null}
    </label>
  );
}
