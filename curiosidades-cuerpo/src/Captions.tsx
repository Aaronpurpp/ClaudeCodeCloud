import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { chunkWords, TimedWord } from "./data";
import { FONT } from "./theme";

export const Captions: React.FC<{
  words: TimedWord[];
  accent: string;
  fontSize: number;
}> = ({ words, accent, fontSize }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const chunks = chunkWords(words);

  let idx = -1;
  for (let i = 0; i < chunks.length; i++) {
    if (frame >= chunks[i][0].start) idx = i;
  }
  if (idx < 0) return null;
  const chunk = chunks[idx];
  const next = chunks[idx + 1];
  const lastEnd = chunk[chunk.length - 1].end;
  // Hide a finished chunk shortly after its last word if nothing follows.
  if (!next && frame > lastEnd + 15) return null;

  const enter = spring({ frame: frame - chunk[0].start, fps, config: { damping: 16, stiffness: 220 } });
  const y = interpolate(enter, [0, 1], [24, 0]);

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        alignItems: "center",
        gap: `${fontSize * 0.12}px ${fontSize * 0.4}px`,
        fontFamily: FONT,
        fontWeight: 900,
        fontSize,
        lineHeight: 1.1,
        textTransform: "uppercase",
        letterSpacing: -1,
        transform: `translateY(${y}px)`,
        opacity: enter,
        textAlign: "center",
      }}
    >
      {chunk.map((w, i) => {
        const spoken = frame >= w.start;
        const current = spoken && frame < w.end + 4;
        const pop = spoken
          ? spring({ frame: frame - w.start, fps, config: { damping: 10, stiffness: 300 } })
          : 0;
        const scale = current ? 1 + 0.08 * pop : 1;
        return (
          <span
            key={i}
            style={{
              color: current ? accent : "#FFFFFF",
              opacity: spoken ? 1 : 0.38,
              transform: `scale(${scale})`,
              display: "inline-block",
              WebkitTextStroke: `${Math.max(6, fontSize * 0.1)}px #0B1026`,
              paintOrder: "stroke fill",
              textShadow: "0 6px 0 rgba(0,0,0,0.35)",
            }}
          >
            {w.text.replace(/[.,;:]+$/, "")}
          </span>
        );
      })}
    </div>
  );
};
