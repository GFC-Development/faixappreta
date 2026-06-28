export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex justify-center items-stretch min-h-screen bg-[#dedbd4]">
      <div className="w-full max-w-[440px] min-h-screen bg-[#f7f7f8] flex flex-col shadow-[0_0_60px_rgba(0,0,0,.1)]">
        {children}
      </div>
    </div>
  );
}
