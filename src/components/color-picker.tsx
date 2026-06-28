"use client";

const PRESET_COLORS = [
  "#f97316", "#ef4444", "#ec4899", "#a855f7",
  "#6366f1", "#3b82f6", "#06b6d4", "#14b8a6",
  "#22c55e", "#84cc16", "#eab308", "#f59e0b",
  "#78716c", "#64748b", "#0ea5e9", "#e11d48",
];

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  return (
    <div>
      <label className="block font-spline text-[9.5px] tracking-[.1em] uppercase text-[#6b6c73] mb-2">
        {label}
      </label>
      <div className="grid grid-cols-8 gap-2">
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            className="w-8 h-8 rounded-full border-2 transition-transform hover:scale-110"
            style={{
              backgroundColor: color,
              borderColor: value === color ? "#ffffff" : "transparent",
              transform: value === color ? "scale(1.15)" : undefined,
            }}
          />
        ))}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <div
          className="w-6 h-6 rounded border border-[#2a2b33]"
          style={{ backgroundColor: value }}
        />
        <span className="font-spline text-[11px] text-[#6b6c73]">{value}</span>
      </div>
    </div>
  );
}
