"use client";

import { InputHTMLAttributes, forwardRef } from "react";

interface AuthInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  labelRight?: React.ReactNode;
  error?: string;
}

export const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(
  ({ label, labelRight, error, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {(label || labelRight) && (
          <div className="flex items-center justify-between mb-1.5">
            {label && (
              <span className="font-spline text-[9px] tracking-[.1em] uppercase text-[#9b9ca2]">
                {label}
              </span>
            )}
            {labelRight}
          </div>
        )}
        <input
          ref={ref}
          className={`w-full h-12 border border-[#e3e3e0] rounded-xl px-3.5 text-[15px] outline-none bg-white text-[#17181c] placeholder-content-muted focus:border-accent transition-colors ${error ? "border-red-500/50" : ""} ${className || ""}`}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      </div>
    );
  }
);

AuthInput.displayName = "AuthInput";
