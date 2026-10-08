import React from "react";
import { useCurrentFrame } from "remotion";
import { ArtProps, bob, Label, prog } from "./util";

const Gauge: React.FC<{ cx: number; cy: number; pct: number; color: string; label: string; progress: number }> = ({ cx, cy, pct, color, label, progress }) => {
  const r = 110;
  const c = 2 * Math.PI * r;
  const filled = (pct / 100) * c * progress;
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={42} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={42} strokeDasharray={`${Math.max(filled, 2)} ${c}`} strokeLinecap="butt" transform={`rotate(-90 ${cx} ${cy})`} />
      <Label x={cx} y={cy + 24} text={`${Math.round(pct * progress)}%`} size={76} color={color} />
      <Label x={cx} y={cy + 185} text={label} size={32} />
    </g>
  );
};

export const Brain: React.FC<ArtProps> = ({ accent }) => {
  const frame = useCurrentFrame();
  const appear = prog(frame, 0, 20);
  const g1 = prog(frame, 40, 40);
  const g2 = prog(frame, 110, 70);
  const bulb = prog(frame, 260, 30);
  const glow = 0.7 + 0.3 * Math.sin(frame / 7);
  return (
    <svg viewBox="0 0 800 800" width="100%" height="100%">
      <g opacity={appear} transform={`translate(0 ${bob(frame, 5)})`}>
        {/* brain */}
        <g transform="translate(400 130)">
          <ellipse cx={-52} cy={0} rx={92} ry={72} fill="#F7A8D8" stroke="#0B1026" strokeWidth={8} />
          <ellipse cx={52} cy={0} rx={92} ry={72} fill="#F7A8D8" stroke="#0B1026" strokeWidth={8} />
          {[-110, -70, -30, 30, 70, 110].map((x, i) => (
            <path key={i} d={`M${x} -40 q16 20 0 40 q-16 20 0 36`} stroke="#C0589A" strokeWidth={7} fill="none" strokeLinecap="round" />
          ))}
          <path d="M0 -70 V70" stroke="#C0589A" strokeWidth={7} />
        </g>
        <Gauge cx={200} cy={450} pct={2} color="#8EA2D8" label="OF BODY WEIGHT" progress={g1} />
        <Gauge cx={600} cy={450} pct={20} color={accent} label="OF YOUR ENERGY" progress={g2} />
        {/* bulb */}
        <g opacity={bulb} transform="translate(400 690)">
          <circle r={58 * glow + 20} fill={accent} opacity={0.18} />
          <circle r={40} fill="#FFF3B0" stroke="#0B1026" strokeWidth={7} />
          <rect x={-18} y={36} width={36} height={22} rx={6} fill="#B8C0D8" stroke="#0B1026" strokeWidth={6} />
          <Label x={120} y={20} text="≈ 20 W" size={60} color="#FFF3B0" anchor="start" />
          <Label x={-120} y={20} text="BRAIN" size={52} anchor="end" />
        </g>
      </g>
    </svg>
  );
};
