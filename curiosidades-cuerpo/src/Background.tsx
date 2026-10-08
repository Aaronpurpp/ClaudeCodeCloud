import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { BG_BOTTOM, BG_TOP } from "./theme";
import { rnd } from "./art/util";

export const Background: React.FC<{ accent: string }> = ({ accent }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${BG_TOP} 0%, ${BG_BOTTOM} 100%)` }}>
      {Array.from({ length: 14 }, (_, i) => {
        const size = 80 + rnd(i) * 220;
        const x = rnd(i + 3) * width + Math.sin(frame / 90 + i) * 40;
        const y = ((rnd(i + 8) * height * 1.4 - frame * (0.25 + rnd(i + 2) * 0.35)) % (height * 1.3)) + height * 0.1;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x - size / 2,
              top: y < -size ? y + height * 1.3 : y,
              width: size,
              height: size,
              borderRadius: "50%",
              background: accent,
              opacity: 0.06 + rnd(i + 5) * 0.06,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
