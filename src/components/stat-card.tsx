interface StatCardProps {
  label: string;
  value: string | number;
  badge?: React.ReactNode;
  dark?: boolean;
  children?: React.ReactNode;
}

export function StatCard({ label, value, badge, dark, children }: StatCardProps) {
  return (
    <div
      className={`flex-1 min-w-[150px] rounded-[13px] p-4 ${
        dark
          ? "bg-[#17181c]"
          : "bg-white border border-[#e9e9ec]"
      }`}
    >
      <div className="font-spline text-[9.5px] tracking-[.12em] uppercase text-[#9b9ca2]">
        {label}
      </div>
      <div className="flex items-baseline gap-2 mt-[7px]">
        <span
          className={`font-archivo font-bold text-[32px] tracking-[-0.02em] leading-none ${
            dark ? "text-[#fbfbf8]" : "text-[#17181c]"
          }`}
        >
          {value}
        </span>
        {badge}
      </div>
      {children}
    </div>
  );
}
