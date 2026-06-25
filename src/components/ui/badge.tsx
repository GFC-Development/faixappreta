import { cn } from "@/lib/utils";

export function Badge({
  children,
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  variant?: "default" | "success" | "green" | "warning" | "danger";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[20px] px-2 py-[2px] text-[11px] font-semibold",
        variant === "default" && "bg-[#f4f4f6] text-[#3d3e44]",
        variant === "success" && "bg-[#fdf0db] text-[#c9781a]",
        variant === "green" && "bg-[#e7f4ec] text-[#0f7a4d]",
        variant === "warning" && "bg-[#fbf0dd] text-[#b45309]",
        variant === "danger" && "bg-[#fdeee9] text-[#b42318]",
        className
      )}
    >
      {children}
    </span>
  );
}
