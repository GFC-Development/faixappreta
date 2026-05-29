import { BELT_COLORS, KIDS_BELT_COLORS } from "@/lib/utils";

export function DegreeProgress({
  checkins,
  belt,
  nextDegree,
  requiredClasses,
  showCount = true,
}: {
  checkins: number;
  belt: string;
  nextDegree: number;
  requiredClasses: number;
  showCount?: boolean;
}) {
  if (requiredClasses <= 0) return null;

  const progress = Math.min(1, checkins / requiredClasses);
  const color = BELT_COLORS[belt] || KIDS_BELT_COLORS[belt]?.[0] || "#FFF";
  const height = showCount ? 6 : 14;
  const fillWidth = `${Math.round(progress * 100)}%`;

  return (
    <div className="mb-3 border-t border-zinc-800 pt-3 mt-3">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-zinc-500">
          Progresso para <span className="font-semibold text-zinc-300">{nextDegree}° grau</span>
        </span>
        {showCount && (
          <span className="text-xs font-medium text-zinc-400">
            {checkins} / {requiredClasses} · {Math.round(progress * 100)}%
          </span>
        )}
      </div>
      <div
        className="relative w-full rounded-full overflow-hidden"
        style={{ height, backgroundColor: "#27272a" }}
      >
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: fillWidth,
            backgroundColor: color === "#FFFFFF" ? "#a3a3a3" : color,
          }}
        />
        {!showCount && (
          <span
            className="absolute inset-0 flex items-center justify-center text-[9px] font-bold leading-none"
            style={{ color: progress > 0.45 ? (belt === "BRANCA" ? "#000" : "#fff") : "#a1a1aa" }}
          >
            {Math.round(progress * 100)}%
          </span>
        )}
      </div>
      {showCount && (
        <p className="text-xs text-zinc-400 mt-1.5">
          {checkins >= requiredClasses
            ? `Meta atingida! Aluno apto para o ${nextDegree}° grau.`
            : `Faltam ${requiredClasses - checkins} aulas para o ${nextDegree}° grau.`}
        </p>
      )}
    </div>
  );
}
