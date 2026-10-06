import { cn } from "@/lib/utils";

export function BrandLogo({ className }: { className?: string }) {
  return (
    <span className={cn("relative block h-9 w-44 overflow-hidden", className)}>
      <img
        src="/EventYatwonLogo.png"
        alt="EventYatwon"
        className="absolute top-1/2 left-1/2 w-44 max-w-none -translate-x-1/2 -translate-y-1/2"
      />
    </span>
  );
}
