import React from "react";
import { useCurrentFrame } from "remotion";
import { ArtProps, bob, Label, prog, rnd } from "./util";

export const Skin: React.FC<ArtProps> = ({ accent }) => {
  const frame = useCurrentFrame();
  const appear = prog(frame, 0, 20);
  const flakes = Array.from({ length: 14 }, (_, i) => i);
  const cells = Array.from({ length: 18 }, (_, i) => i);
  return (
    <svg viewBox="0 0 800 800" width="100%" height="100%">
      <defs>
        <clipPath id="epi">
          <rect x={60} y={330} width={680} height={110} />
        </clipPath>
      </defs>
      <g opacity={appear} transform={`translate(0 ${bob(frame, 4)})`}>
        <rect x={60} y={330} width={680} height={110} rx={10} fill="#F3B391" />
        <rect x={60} y={440} width={680} height={170} fill="#E77E7E" />
        <rect x={60} y={610} width={680} height={110} rx={10} fill="#FFD98E" />
        <rect x={60} y={322} width={680} height={14} rx={7} fill="#D99A78" />
        {/* cells rising */}
        <g clipPath="url(#epi)">
          {cells.map((i) => {
            const speed = 0.35 + rnd(i) * 0.25;
            const t = ((frame * speed + rnd(i + 4) * 120) % 120) / 120;
            const y = 430 - t * 110;
            const x = 110 + (i % 9) * 72 + (Math.floor(i / 9) % 2) * 30;
            const s = 1 - t * 0.35;
            return <rect key={i} x={x - 24 * s} y={y - 16 * s} width={48 * s} height={32 * s} rx={10} fill={t > 0.8 ? "#D9A585" : "#F9CDB1"} stroke="#B97755" strokeWidth={3} />;
          })}
        </g>
        {/* flakes falling */}
        {flakes.map((i) => {
          const t = ((frame * (0.9 + rnd(i) * 0.7) + rnd(i + 3) * 160) % 160) / 160;
          const x = 120 + rnd(i + 6) * 560 + Math.sin(frame / 14 + i) * 18;
          const y = 322 - t * 240;
          return <rect key={i} x={x - 12} y={y - 6} width={24} height={12} rx={4} fill="#F9CDB1" opacity={1 - t} transform={`rotate(${frame * 3 + i * 40} ${x} ${y})`} />;
        })}
      </g>
      <Label x={400} y={155} text="≈ 1 MONTH" size={96} color={accent} opacity={prog(frame, 40, 20)} />
      <Label x={400} y={215} text="TO REPLACE YOUR OUTER SKIN" size={40} opacity={prog(frame, 60, 20)} />
      <Label x={400} y={500} text="NEW CELLS RISE" size={38} opacity={prog(frame, 120, 20)} />
      <Label x={400} y={770} text="TENS OF THOUSANDS SHED / MINUTE" size={36} color={accent} opacity={prog(frame, 260, 20)} />
    </svg>
  );
};
