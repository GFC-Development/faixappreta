interface BeltProps {
  color: string;
  degrees?: number;
  className?: string;
}

export function Belt({ color, degrees = 0, className }: BeltProps) {
  const n = Math.max(0, Math.min(4, degrees));
  const stripes: string[] = [];
  for (let i = 0; i < n; i++) {
    stripes.push(`${(((i + 1) / (n + 1)) * 100).toFixed(1)}%`);
  }

  const isLight = color.toUpperCase() === "#FFFFFF" || color.toUpperCase() === "#FFF";

  return (
    <div
      className={className}
      style={{
        position: "relative",
        width: "100%",
        height: 13,
        borderRadius: 2,
        overflow: "hidden",
        background: "#e9e7e1",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: color,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          right: "12%",
          width: "26%",
          background: "#161616",
          boxShadow:
            "-1px 0 0 rgba(0,0,0,.25), 1px 0 0 rgba(0,0,0,.25)",
        }}
      >
        {stripes.map((pct, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              top: 1.5,
              bottom: 1.5,
              width: 2,
              marginLeft: -1,
              borderRadius: 1,
              background: "#fbfbf8",
              boxShadow: "0 0 0 .5px rgba(0,0,0,.2)",
              left: pct,
            }}
          />
        ))}
      </div>
      {/* Border overlay — renders on top of everything */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 2,
          boxShadow: isLight
            ? "inset 0 0 0 1px rgba(0,0,0,.3), inset 0 -2px 3px rgba(0,0,0,.16)"
            : "inset 0 0 0 1px rgba(0,0,0,.1), inset 0 -2px 3px rgba(0,0,0,.16)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
