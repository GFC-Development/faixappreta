"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";

interface AuthButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
}

export const AuthButton = forwardRef<HTMLButtonElement, AuthButtonProps>(
  ({ variant = "primary", className, children, disabled, ...props }, ref) => {
    const base =
      "w-full h-[50px] rounded-xl text-[15px] font-bold flex items-center justify-center transition-all cursor-pointer";

    const variants = {
      primary: disabled
        ? "bg-[#efe7da] text-[#bba277] cursor-not-allowed"
        : "bg-accent text-[#17181c] hover:bg-accent-dark",
      secondary:
        "bg-white border border-[#e3e3e0] text-[#17181c] text-[14.5px] font-semibold hover:border-[#cfcfcb]",
    };

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={`${base} ${variants[variant]} ${className || ""}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

AuthButton.displayName = "AuthButton";
