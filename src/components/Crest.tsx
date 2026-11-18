import Image from "next/image";
import { TeamId } from "@/lib/types";

export function Crest({ team, size = 40, className = "" }: { team: TeamId | null | undefined; size?: number; className?: string }) {
  if (!team) {
    return (
      <Image
        src="/brand/clover.png"
        alt="Arena Quadrifoglio"
        width={size}
        height={size}
        className={`object-contain ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <Image
      src={`/brand/${team}.png`}
      alt={team === "blacks" ? "Blacks" : "Blancos"}
      width={size}
      height={size}
      className={`object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)] ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
