import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { ArtProps, bob, Label, prog } from "./util";

const Bone: React.FC<{ x: number; y: number; len: number; rot?: number; color?: string; scale?: number }> = ({
  x, y, len, rot = 0, color = "#F4EBD9", scale = 1,
}) => {
  const h = 22;
  const r = 24;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${scale})`}>
      <rect x={-len / 2} y={-h / 2} width={len} height={h} rx={10} fill={color} />
      {[-1, 1].map((s) => (
        <g key={s}>
          <circle cx={s * (len / 2)} cy={-h / 2 - 4} r={r * 0.62} fill={color} />
          <circle cx={s * (len / 2)} cy={h / 2 + 4} r={r * 0.62} fill={color} />
        </g>
      ))}
    </g>
  );
};

export const Bones: React.FC<ArtProps> = ({ accent }) => {
  const frame = useCurrentFrame();
  const count = Math.round(interpolate(frame, [60, 190], [270, 206], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const fuse = prog(frame, 330, 40);
  const flash = interpolate(frame, [360, 372, 395], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const appear = prog(frame, 0, 20);
  const rowY = 560;
  const pairs = [-1, 0, 1];
  return (
    <svg viewBox="0 0 800 800" width="100%" height="100%">
      <g opacity={appear} transform={`translate(0 ${bob(frame, 6)})`}>
        <circle cx={400} cy={250} r={230} fill="rgba(255,255,255,0.06)" />
        <Label x={400} y={290} text={String(count)} size={210} color={accent} />
        <Label x={400} y={370} text="BONES" size={64} />
        {/* tiny skeleton arm-bones row that fuse pairwise */}
        {pairs.map((p, i) => {
          const cx = 400 + p * 230;
          const off = 78 * (1 - fuse);
          return (
            <g key={i}>
              <g opacity={1 - fuse}>
                <Bone x={cx - off} y={rowY} len={64} />
                <Bone x={cx + off} y={rowY} len={64} />
              </g>
              <g opacity={fuse}>
                <Bone x={cx} y={rowY} len={150} color={accent} scale={0.7 + 0.3 * fuse} />
              </g>
            </g>
          );
        })}
        <circle cx={400} cy={rowY} r={20 + 260 * flash} fill="none" stroke={accent} strokeWidth={10} opacity={flash} />
        <Label x={400} y={690} text="MANY BONES FUSE INTO ONE" size={40} color={accent} opacity={prog(frame, 300, 20)} />
        <Label x={400} y={750} text="BABY 270  →  ADULT 206" size={40} opacity={prog(frame, 100, 20)} />
      </g>
    </svg>
  );
};
