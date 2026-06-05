import { cn } from "@/lib/utils";
import Image from "next/image";

export function Logo({
  className,
  small,
  collapsable = false,
}: {
  className?: string;
  small?: boolean;
  collapsable?: boolean;
}) {
  return (
    <div className={cn("flex gap-2 items-center", className)}>
      <Image
        src="/logo.png"
        alt="E-Service System"
        width={small ? 24 : 32}
        height={small ? 24 : 32}
        className="object-contain"
        style={{ height: "auto" }}
      />
      <span
        className={cn(
          " font-extrabold bg-gradient-to-r from-primary via-foreground to-primary bg-clip-text text-transparent  ",
          small ? "text-xl" : "text-3xl",
          collapsable && "max-md:hidden ",
        )}
      >
        East Shoa E-Service
      </span>
    </div>
  );
}
