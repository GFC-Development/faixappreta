import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "success";
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
          variant === "primary" &&
            "bg-accent text-accent-on font-bold hover:bg-accent-dark hover:text-accent-dark-on rounded-[9px]",
          variant === "secondary" &&
            "bg-white text-content-primary border border-[#e6e6e9] hover:border-[#cfcfd4] rounded-[9px]",
          variant === "success" &&
            "bg-[#e7f4ec] text-[#0f7a4d] border border-[#b9e2cb] font-bold hover:bg-[#d8eddf] rounded-lg",
          variant === "danger" &&
            "bg-white text-[#b42318] border border-[#f0d2cb] hover:bg-[#fdeee9] rounded-lg",
          variant === "ghost" &&
            "text-content-secondary hover:bg-surface-secondary hover:text-content-primary rounded-lg",
          size === "sm" && "px-3.5 h-8 text-xs",
          size === "md" && "px-4 h-9 text-[12.5px]",
          size === "lg" && "px-5 h-[38px] text-[12.5px]",
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
