import Image from "next/image";
import Link from "next/link";

type BrandLogoProps = {
  href?: string;
  variant?: "color" | "light";
  className?: string;
  priority?: boolean;
  size?: "sm" | "md" | "lg" | "hero";
};

const sizes = {
  sm: { width: 140, height: 48, className: "h-9 w-auto" },
  md: { width: 180, height: 62, className: "h-11 w-auto sm:h-12" },
  lg: { width: 240, height: 82, className: "h-14 w-auto sm:h-16" },
  hero: { width: 420, height: 144, className: "h-20 w-auto sm:h-28 md:h-32" },
};

export function BrandLogo({
  href = "/",
  variant = "color",
  className = "",
  priority = false,
  size = "md",
}: BrandLogoProps) {
  const dims = sizes[size];
  const src =
    variant === "light" ? "/brand/logo-light.png" : "/brand/logo-color.png";

  const image = (
    <Image
      src={src}
      alt="Umuhuza Online"
      width={dims.width}
      height={dims.height}
      priority={priority}
      className={`${dims.className} object-contain object-left`}
    />
  );

  if (!href) return <div className={className}>{image}</div>;

  return (
    <Link
      href={href}
      className={`inline-flex items-center ${className}`}
      aria-label="Umuhuza Online home"
    >
      {image}
    </Link>
  );
}
