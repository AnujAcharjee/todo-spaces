import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "outline";
};

export function Button({
  className,
  children,
  variant = "primary",
  type = "button",
  ...props
}: ButtonProps) {
  const base = "px-4 py-2 rounded-md text-sm font-medium transition-all";

  const variants = {
    primary: "bg-sky-500 text-white hover:bg-sky-500 /80",
    secondary: "bg-gray-200 text-black hover:bg-gray-300",
    outline: "border border-gray-300 hover:bg-gray-100",
  };

  return (
    <button
      type={type}
      className={cn(base, variants[variant], className)}
      {...props}
    >
      {children}
    </button>
  );
}
