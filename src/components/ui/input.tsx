import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block font-spline text-[9.5px] tracking-[.1em] uppercase text-[#9b9ca2] mb-1.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            "w-full h-[42px] rounded-[9px] border border-[#e6e6e9] bg-white px-[13px] text-sm text-content-primary placeholder-content-muted focus:outline-none focus:border-accent transition-colors",
            error && "border-red-500/50 focus:border-red-500/50",
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
