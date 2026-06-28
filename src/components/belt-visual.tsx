import { BELT_COLORS, KIDS_BELT_COLORS, KIDS_BELT_LABELS } from "@/lib/utils";

function getBeltColor(belt: string): string {
  if (BELT_COLORS[belt]) return BELT_COLORS[belt];
  const kids = KIDS_BELT_COLORS[belt];
  if (kids) return kids[0];
  return "#FFFFFF";
}

function getBeltLabel(belt: string): string {
  return KIDS_BELT_LABELS[belt] || belt;
}

function isKidsDualColor(belt: string): boolean {
  const colors = KIDS_BELT_COLORS[belt];
  return !!colors && colors[0] !== colors[1];
}

export function BeltVisual({
  belt,
  degrees = 0,
  width = 280,
}: {
  belt: string;
  degrees?: number;
  width?: number;
}) {
  const color = getBeltColor(belt);
  const isWhite = belt === "BRANCA";
  const isDual = isKidsDualColor(belt);
  const dualColors = KIDS_BELT_COLORS[belt];
  const height = width * 0.12;
  const tipWidth = width * 0.22;
  const stripeWidth = Math.max(2, width * 0.012);
  const stripeGap = Math.max(3, width * 0.018);
  const stripeHeight = height * 0.7;
  const borderRadius = height * 0.15;
  const bodyWidth = width - tipWidth - 4;
  const label = getBeltLabel(belt);

  return (
    <svg
      width={width}
      height={height + 8}
      viewBox={`0 0 ${width} ${height + 8}`}
      className="block"
    >
      <defs>
        <filter id="beltShadow" x="-4%" y="-20%" width="108%" height="160%">
          <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#ffffff" floodOpacity="0.12" />
        </filter>
        {isDual && dualColors && (
          <clipPath id={`beltClip-${belt}`}>
            <rect x={2} y={4} width={bodyWidth} height={height} rx={borderRadius} ry={borderRadius} />
          </clipPath>
        )}
      </defs>

      {/* Belt body */}
      {isDual && dualColors ? (
        <g clipPath={`url(#beltClip-${belt})`}>
          <rect x={2} y={4} width={bodyWidth / 2} height={height} fill={dualColors[0]} />
          <rect x={2 + bodyWidth / 2} y={4} width={bodyWidth / 2} height={height} fill={dualColors[1]} />
        </g>
      ) : (
        <rect
          x={2}
          y={4}
          width={bodyWidth}
          height={height}
          rx={borderRadius}
          ry={borderRadius}
          fill={color}
          stroke={isWhite ? "#D1D5DB" : "rgba(255,255,255,0.15)"}
          strokeWidth={isWhite ? 1.5 : 0.5}
          filter="url(#beltShadow)"
        />
      )}

      {isDual && dualColors && (
        <rect
          x={2}
          y={4}
          width={bodyWidth}
          height={height}
          rx={borderRadius}
          ry={borderRadius}
          fill="none"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth={0.5}
          filter="url(#beltShadow)"
        />
      )}

      {/* Black tip (ponta) */}
      <rect
        x={width - tipWidth - 2}
        y={4}
        width={tipWidth}
        height={height}
        rx={borderRadius}
        ry={borderRadius}
        fill="#1a1a1a"
        stroke="rgba(255,255,255,0.15)"
        strokeWidth={0.5}
        filter="url(#beltShadow)"
      />

      {/* Overlap rectangle to merge belt body and tip seamlessly */}
      <rect
        x={width - tipWidth - 6}
        y={4}
        width={8}
        height={height}
        fill={isDual && dualColors ? dualColors[1] : color}
        stroke="none"
      />
      <rect
        x={width - tipWidth - 1}
        y={4}
        width={8}
        height={height}
        fill="#1a1a1a"
        stroke="none"
      />

      {/* Degree stripes (white lines on the black tip) */}
      {Array.from({ length: degrees }).map((_, i) => {
        const x = width - tipWidth + tipWidth * 0.25 + i * (stripeWidth + stripeGap);
        return (
          <rect
            key={i}
            x={x}
            y={4 + (height - stripeHeight) / 2}
            width={stripeWidth}
            height={stripeHeight}
            rx={1}
            fill="#FFFFFF"
          />
        );
      })}

      {/* Subtle top highlight for 3D effect */}
      <rect
        x={2}
        y={4}
        width={bodyWidth}
        height={height * 0.3}
        rx={borderRadius}
        ry={borderRadius}
        fill="white"
        opacity={isWhite ? 0 : 0.15}
      />

      {/* Belt label inside */}
      <text
        x={(width - tipWidth) / 2}
        y={4 + height / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fill={isWhite || (isDual && dualColors?.[1] === "#FFFFFF") ? "#000000" : "#FFFFFF"}
        fontSize={height * 0.38}
        fontWeight="600"
        fontFamily="system-ui, sans-serif"
      >
        {label}{degrees > 0 ? ` - ${degrees}° grau` : ""}
      </text>
    </svg>
  );
}

export function BeltProgress({
  checkins,
  nextBelt,
  requiredClasses,
  width = 280,
  showCount = true,
}: {
  checkins: number;
  nextBelt: string | null;
  requiredClasses: number;
  width?: number;
  showCount?: boolean;
}) {
  if (!nextBelt || requiredClasses <= 0) return null;

  const progress = Math.min(1, checkins / requiredClasses);
  const nextColor = getBeltColor(nextBelt);

  // The progress fills the belt shape
  const height = width * 0.06;
  const fillWidth = Math.max(0, (width - 4) * progress);
  const nextLabel = getBeltLabel(nextBelt);

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-content-muted">
          Progresso para <span className="font-semibold" style={{ color: nextColor }}>{nextLabel}</span>
        </span>
        {showCount && (
          <span className="text-xs font-medium">
            {checkins} / {requiredClasses} · {Math.round(progress * 100)}%
          </span>
        )}
      </div>
      <div
        className="relative w-full rounded-full overflow-hidden"
        style={{ height, backgroundColor: "#e4e4e7" }}
      >
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: fillWidth,
            backgroundColor: nextColor,
          }}
        />
        {!showCount && (
          <span
            className="absolute inset-0 flex items-center justify-center text-[9px] font-bold leading-none"
            style={{ color: progress > 0.45 ? (nextBelt === "BRANCA" ? "#000" : "#fff") : "#a1a1aa" }}
          >
            {Math.round(progress * 100)}%
          </span>
        )}
      </div>
      {showCount && (
        <p className="text-xs text-content-secondary mt-1.5">
          {checkins >= requiredClasses
            ? "Meta atingida! Aluno apto para promoção de faixa."
            : `Faltam ${requiredClasses - checkins} aulas para atingir a meta.`}
        </p>
      )}
    </div>
  );
}
