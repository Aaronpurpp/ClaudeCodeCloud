import React from "react";
import { useCurrentFrame } from "remotion";
import { ArtProps, bob, Label, prog } from "./util";

const Lane: React.FC<{ y: number; speed: number; color: string; label: string; speedText: string; frame: number; segs: number; show: number }> = ({ y, speed, color, label, speedText, frame, segs, show }) => {
  const x0 = 120;
  const x1 = 700;
  const pos = x0 + ((frame * speed) % (x1 - x0));
  return (
    <g opacity={show}>
      <circle cx={80} cy={y} r={44} fill={color} stroke="#0B1026" strokeWidth={7} />
      <circle cx={80} cy={y} r={16} fill="#0B1026" />
      <line x1={x0} y1={y} x2={x1} y2={y} stroke="#9FB0E8" strokeWidth={10} strokeLinecap="round" />
      {Array.from({ length: segs }, (_, i) => {
        const w = (x1 - x0) / segs;
        return segs > 1 ? <rect key={i} x={x0 + i * w + 8} y={y - 18} width={w - 16} height={36} rx={16} fill="#E8EEFF" opacity={0.95} /> : null;
      })}
      <circle cx={pos} cy={y} r={26} fill={color} stroke="#fff" strokeWidth={6} />
      <circle cx={pos} cy={y} r={46} fill={color} opacity={0.25} />
      <circle cx={x1 + 28} cy={y} r={22} fill="#F7A8D8" stroke="#0B1026" strokeWidth={6} />
      <Label x={x0} y={y - 70} text={label} size={36} anchor="start" />
      <Label x={x1} y={y - 70} text={speedText} size={52} color={color} anchor="end" />
    </g>
  );
};

export const Nerve: React.FC<ArtProps> = ({ accent }) => {
  const frame = useCurrentFrame();
  const appear = prog(frame, 0, 20);
  const slow = prog(frame, 250, 25);
  return (
    <svg viewBox="0 0 800 800" width="100%" height="100%">
      <g opacity={appear} transform={`translate(0 ${bob(frame, 4)})`}>
        <Lane y={250} speed={22} color={accent} label="FAST · SHARP PAIN" speedText="120 m/s" frame={frame} segs={7} show={1} />
        <Lane y={520} speed={2} color="#7DD3FC" label="SLOW · DULL ACHE" speedText="1 m/s" frame={frame} segs={1} show={slow} />
        <Label x={400} y={740} text="≈ 250 MPH  vs  WALKING PACE" size={40} color={accent} opacity={slow} />
      </g>
    </svg>
  );
};
