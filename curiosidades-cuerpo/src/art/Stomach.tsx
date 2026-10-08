import React from "react";
import { useCurrentFrame } from "remotion";
import { ArtProps, bob, Label, prog, rnd } from "./util";

const STOMACH =
  "M330 130 C330 90 410 80 430 140 C455 215 575 235 610 345 C655 490 545 640 410 625 C300 612 255 535 280 455 C298 395 285 330 295 255 C300 200 330 190 330 130 Z";

export const Stomach: React.FC<ArtProps> = ({ accent }) => {
  const frame = useCurrentFrame();
  const appear = prog(frame, 0, 20);
  const pulse = 1 + 0.015 * Math.sin(frame / 8);
  const shield = prog(frame, 200, 40);
  const swap = prog(frame, 330, 60);
  const bubbles = Array.from({ length: 16 }, (_, i) => i);
  return (
    <svg viewBox="0 0 800 800" width="100%" height="100%">
      <defs>
        <clipPath id="stomachClip">
          <path d={STOMACH} />
        </clipPath>
      </defs>
      <g opacity={appear} transform={`translate(0 ${bob(frame, 6)}) translate(400 380) scale(${pulse}) translate(-440 -380)`}>
        <path d={STOMACH} fill="#F28482" />
        <g clipPath="url(#stomachClip)">
          <rect x={200} y={300} width={500} height={400} fill={accent} opacity={0.9} />
          {bubbles.map((i) => {
            const speed = 1.2 + rnd(i) * 1.8;
            const y = 640 - ((frame * speed + rnd(i + 9) * 300) % 340);
            const x = 320 + rnd(i + 3) * 260 + Math.sin(frame / 12 + i) * 10;
            const r = 8 + rnd(i + 5) * 16;
            return <circle key={i} cx={x} cy={y} r={r} fill="#fff" opacity={0.55} />;
          })}
        </g>
        {/* mucus shield */}
        <path d={STOMACH} fill="none" stroke="#FFE1A8" strokeWidth={26 * shield} strokeLinejoin="round" opacity={0.95} />
        <path d={STOMACH} fill="none" stroke="#fff" strokeWidth={5 * shield} strokeDasharray="4 22" strokeLinecap="round" opacity={0.9} transform={`translate(0 ${Math.sin(frame / 6) * 2})`} />
      </g>
      <Label x={400} y={745} text="pH ≈ 2" size={64} color={accent} opacity={prog(frame, 20, 20)} />
      <Label x={640} y={170} text="MUCUS SHIELD" size={38} color="#FFE1A8" opacity={shield} anchor="middle" />
      <Label x={130} y={250} text="NEW LINING" size={34} color="#fff" opacity={swap} />
      <Label x={130} y={296} text="EVERY FEW DAYS" size={34} color="#fff" opacity={swap} />
    </svg>
  );
};
