import Image from "next/image";

export function Logo({ size = 72, logoUrl }: { size?: number; logoUrl?: string | null }) {
  if (logoUrl) {
    return (
      <Image
        src={logoUrl}
        alt="Logo"
        width={size}
        height={size}
        className="rounded-xl object-cover"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <Image
      src="/faixappreta-logo.png"
      alt="faixappreta"
      width={size}
      height={size}
      className="rounded-xl"
      style={{ width: size, height: size }}
    />
  );
}
