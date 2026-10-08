import React from "react";
import { useCurrentFrame } from "remotion";
import { ArtProps, bob, Label, prog, rnd } from "./util";

export const Blood: React.FC<ArtProps> = ({ accent }) => {
  const frame = useCurrentFrame();
  const appear = prog(frame, 0, 20);
  // counter runs 0 -> 2,000,000 once per second (30 frames), like a live tally
  const n = Math.round(((frame % 30) / 29) * 2000000);
  const text = n.toLocaleString("en-US");
  const cells = Array.from({ length: 22 }, (_, i) => i);
  return (
    <svg viewBox="0 0 800 800" width="100%" height="100%">
      <g opacity={appear} transform={`translate(0 ${bob(frame, 5)})`}>
        <rect x={0} y={330} width={800} height={260} rx={0} fill="#7A1E3A" />
        <rect x={0} y={330} width={800} height={14} fill="#A8324F" />
        <rect x={0} y={576} width={800} height={14} fill="#A8324F" />
        {cells.map((i) => {
          const speed = 3 + rnd(i) * 3;
          const x = ((frame * speed + rnd(i + 4) * 900) % 900) - 50;
          const y = 365 + rnd(i + 8) * 190;
          const rot = rnd(i + 1) * 40 - 20 + Math.sin(frame / 10 + i) * 8;
          return (
            <g key={i} transform={`translate(${x} ${y}) rotate(${rot})`}>
              <ellipse rx={44} ry={26} fill={accent} stroke="#fff" strokeWidth={4} />
              <ellipse rx={20} ry={11} fill="#B3233F" />
            </g>
          );
        })}
      </g>
      <rect x={90} y={50} width={620} height={200} rx={36} fill="rgba(255,255,255,0.08)" />
      <Label x={400} y={160} text={text} size={110} color={accent} />
      <Label x={400} y={225} text="NEW RED BLOOD CELLS / SECOND" size={34} />
      <Label x={400} y={690} text="MADE IN YOUR BONE MARROW" size={44} opacity={prog(frame, 120, 20)} />
      <Label x={400} y={750} text="EACH LASTS ≈ 120 DAYS" size={40} color={accent} opacity={prog(frame, 220, 20)} />
    </svg>
  );
};
