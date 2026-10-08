import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { ArtProps, bob, Label, prog, rnd } from "./util";

export const Eye: React.FC<ArtProps> = ({ accent }) => {
  const frame = useCurrentFrame();
  const appear = prog(frame, 0, 20);
  const look = Math.sin(frame / 45) * 18;
  const blinkAt = (f: number) => interpolate(frame, [f, f + 5, f + 10], [1, 0.08, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const blink = Math.min(blinkAt(120), blinkAt(330), blinkAt(540));
  const o2 = prog(frame, 160, 30);
  const tag = prog(frame, 60, 25);
  return (
    <svg viewBox="0 0 800 800" width="100%" height="100%">
      <defs>
        <radialGradient id="iris" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#bdf0ff" />
          <stop offset="55%" stopColor={accent} />
          <stop offset="100%" stopColor="#0a5c80" />
        </radialGradient>
        <clipPath id="eyeClip">
          <path d="M60 400 Q400 130 740 400 Q400 670 60 400 Z" />
        </clipPath>
      </defs>
      <g opacity={appear} transform={`translate(0 ${bob(frame, 6)}) translate(400 400) scale(1 ${blink}) translate(-400 -400)`}>
        <path d="M60 400 Q400 130 740 400 Q400 670 60 400 Z" fill="#fff" />
        <g clipPath="url(#eyeClip)">
          {/* blood vessels stop before the cornea */}
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const side = i < 3 ? -1 : 1;
            const k = i % 3;
            const x0 = 400 + side * 340;
            const x1 = 400 + side * (225 - k * 6);
            const y = 330 + k * 70;
            return (
              <path key={i} d={`M${x0} ${y} Q${(x0 + x1) / 2} ${y + 25} ${x1} ${y - 5 + k * 8}`} stroke="#E5535F" strokeWidth={5} fill="none" strokeLinecap="round" opacity={0.85} />
            );
          })}
          <g transform={`translate(${look} 0)`}>
            <circle cx={400} cy={400} r={150} fill="url(#iris)" />
            {Array.from({ length: 24 }, (_, i) => {
              const a = (i / 24) * Math.PI * 2;
              return <line key={i} x1={400 + Math.cos(a) * 60} y1={400 + Math.sin(a) * 60} x2={400 + Math.cos(a) * 140} y2={400 + Math.sin(a) * 140} stroke="#fff" strokeOpacity={0.22} strokeWidth={3} />;
            })}
            <circle cx={400} cy={400} r={62} fill="#0B1026" />
            <circle cx={360} cy={355} r={24} fill="#fff" opacity={0.9} />
            <circle cx={436} cy={440} r={11} fill="#fff" opacity={0.7} />
            {/* cornea dome */}
            <circle cx={400} cy={400} r={178} fill="none" stroke={accent} strokeWidth={7} strokeDasharray="14 12" opacity={tag} />
          </g>
        </g>
        <path d="M60 400 Q400 130 740 400 Q400 670 60 400 Z" fill="none" stroke="#0B1026" strokeWidth={14} strokeLinejoin="round" />
      </g>
      {/* oxygen drifting onto the cornea */}
      {Array.from({ length: 8 }, (_, i) => {
        const t = ((frame * (1.1 + rnd(i) * 0.8) + rnd(i + 2) * 200) % 220) / 220;
        const x = 250 + rnd(i + 7) * 300;
        const y = 80 + t * 230;
        return (
          <g key={i} opacity={o2 * (1 - Math.abs(t - 0.5) * 1.2)}>
            <circle cx={x} cy={y} r={26} fill="#C6F3FF" stroke="#0B1026" strokeWidth={4} />
            <text x={x} y={y + 9} textAnchor="middle" fontSize={24} fontWeight={900} fill="#0B1026" fontFamily="Inter, sans-serif">O₂</text>
          </g>
        );
      })}
      <Label x={400} y={735} text="CORNEA: 0 BLOOD VESSELS" size={44} color={accent} opacity={tag} />
    </svg>
  );
};
