"use client";

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function OtpInput({ value, onChange, disabled }: OtpInputProps) {
  const cells = Array.from({ length: 6 }, (_, i) => {
    const filled = !!value[i];
    const active = i === value.length;
    return { char: value[i] || "", filled, active };
  });

  return (
    <div className="relative">
      <div className="flex gap-[9px] justify-between">
        {cells.map((c, i) => (
          <div
            key={i}
            className="flex-1 h-14 rounded-[13px] bg-white flex items-center justify-center font-archivo font-bold text-[22px] text-[#17181c]"
            style={{
              border: `1.5px solid ${c.active ? "#e08a1e" : c.filled ? "#cfcfcb" : "#e3e3e0"}`,
              boxShadow: c.active
                ? "0 0 0 3px rgba(224,138,30,.15)"
                : "none",
            }}
          >
            {c.char}
          </div>
        ))}
      </div>
      <input
        value={value}
        onChange={(e) =>
          onChange(e.target.value.replace(/\D/g, "").slice(0, 6))
        }
        inputMode="numeric"
        maxLength={6}
        disabled={disabled}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-base"
        autoComplete="one-time-code"
      />
    </div>
  );
}
