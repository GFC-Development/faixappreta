interface PageHeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export function PageHeader({ title, subtitle, children }: PageHeaderProps) {
  return (
    <div className="flex items-end justify-between flex-wrap gap-3.5 mb-4">
      <div>
        <h1 className="font-archivo font-bold text-2xl tracking-[-0.01em] text-[#17181c]">
          {title}
        </h1>
        {subtitle && (
          <p className="text-[13px] text-[#8b8c92] mt-0.5">{subtitle}</p>
        )}
      </div>
      {children}
    </div>
  );
}
