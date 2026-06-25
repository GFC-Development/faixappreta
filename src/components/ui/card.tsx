import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-[13px] border border-[#e9e9ec] bg-white p-4 sm:p-[18px]",
        className
      )}
    >
      {children}
    </div>
  );
}
