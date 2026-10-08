import React from "react";
import { useCurrentFrame } from "remotion";
import { ArtProps, bob, Label, prog } from "./util";

export const Dna: React.FC<ArtProps> = ({ accent }) => {
  const frame = useCurrentFrame();
  const appear = prog(frame, 0, 20);
  const rungs = 22;
  const top = 90;
  const bottom = 680;
  const step = (bottom - top) / (rungs - 1);
  const phase = frame / 18;
  const amp = 150;
  const cx = 400;
  const pts = Array.from({ length: rungs }, (_, i) => {
    const y = top + i * step;
    const a = i * 0.62 + phase;
    return { y, x1: cx + Math.sin(a) * amp, x2: cx - Math.sin(a) * amp, z: Math.cos(a) };
  });
  const path = (key: "x1" | "x2") => pts.map((p, i) => `${i ? "L" : "M"}${p[key].toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const cell = prog(frame, 140, 30);
  return (
    <svg viewBox="0 0 800 800" width="100%" height="100%">
      <g opacity={appear} transform={`translate(0 ${bob(frame, 4)})`}>
        <path d={path("x1")} fill="none" stroke={accent} strokeWidth={16} strokeLinecap="round" strokeLinejoin="round" />
        <path d={path("x2")} fill="none" stroke="#C77DFF" strokeWidth={16} strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => (
          <g key={i}>
            <line x1={p.x1} y1={p.y} x2={p.x2} y2={p.y} stroke="#fff" strokeWidth={7} opacity={0.35 + 0.35 * Math.abs(p.z)} />
            <circle cx={p.x1} cy={p.y} r={14 + p.z * 4} fill={accent} stroke="#0B1026" strokeWidth={4} />
            <circle cx={p.x2} cy={p.y} r={14 - p.z * 4} fill="#C77DFF" stroke="#0B1026" strokeWidth={4} />
          </g>
        ))}
      </g>
      {/* ruler on the left */}
      <g opacity={prog(frame, 40, 25)}>
        <line x1={95} y1={top} x2={95} y2={bottom} stroke="#fff" strokeWidth={8} strokeLinecap="round" />
        <line x1={75} y1={top} x2={115} y2={top} stroke="#fff" strokeWidth={8} />
        <line x1={75} y1={bottom} x2={115} y2={bottom} stroke="#fff" strokeWidth={8} />
        <Label x={95} y={760} text="2 m" size={64} color={accent} />
      </g>
      {/* tiny nucleus */}
      <g opacity={cell} transform="translate(690 130)">
        <circle r={58} fill="#7AA2F7" stroke="#0B1026" strokeWidth={7} />
        <circle r={22} fill="#C77DFF" stroke="#0B1026" strokeWidth={5} />
        <Label x={0} y={110} text="FITS HERE" size={32} />
      </g>
    </svg>
  );
};
