import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Background } from "./Background";
import { Captions } from "./Captions";
import { ArtKey, Fact, narrationFor } from "./data";
import { FONT } from "./theme";
import { Bones } from "./art/Bones";
import { Stomach } from "./art/Stomach";
import { Eye } from "./art/Eye";
import { Blood } from "./art/Blood";
import { Brain } from "./art/Brain";
import { Nerve } from "./art/Nerve";
import { Skin } from "./art/Skin";
import { Dna } from "./art/Dna";

const ART: Record<ArtKey, React.FC<{ accent: string }>> = {
  bones: Bones, stomach: Stomach, eye: Eye, blood: Blood, brain: Brain, nerve: Nerve, skin: Skin, dna: Dna,
};

export const SceneFrame: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const fadeIn = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [durationInFrames - 8, durationInFrames], [1, 0], { extrapolateLeft: "clamp" });
  return <AbsoluteFill style={{ opacity: Math.min(fadeIn, fadeOut) }}>{children}</AbsoluteFill>;
};

export const FactScene: React.FC<{ fact: Fact; text: string; badge?: string }> = ({ fact, text, badge }) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const vertical = height > width;
  const { words } = narrationFor(text);
  const Art = ART[fact.art];
  const pop = spring({ frame, fps, config: { damping: 14, stiffness: 160 } });
  const titleIn = spring({ frame: frame - 4, fps, config: { damping: 14, stiffness: 180 } });

  const titleSize = vertical ? 112 : 84;
  const capSize = vertical ? 76 : 64;

  const header = (
    <div style={{ display: "flex", flexDirection: "column", alignItems: vertical ? "center" : "flex-start", gap: 22, transform: `translateY(${(1 - titleIn) * -40}px)`, opacity: titleIn }}>
      <div style={{ background: fact.accent, color: "#0B1026", fontFamily: FONT, fontWeight: 900, fontSize: vertical ? 56 : 46, padding: "6px 30px", borderRadius: 999, letterSpacing: 2 }}>
        {badge ?? `FACT #${fact.n}`}
      </div>
      <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: titleSize, lineHeight: 1.02, color: "#fff", textAlign: vertical ? "center" : "left", letterSpacing: -2, textShadow: "0 8px 0 rgba(0,0,0,0.3)" }}>
        {fact.title}
      </div>
    </div>
  );

  const art = (
    <div style={{ width: vertical ? 1000 : 900, height: vertical ? 1000 : 900, transform: `scale(${0.85 + 0.15 * pop})`, opacity: Math.min(1, pop * 2) }}>
      <Art accent={fact.accent} />
    </div>
  );

  const captions = (
    <div style={{ width: vertical ? 960 : 760, minHeight: vertical ? 360 : 340, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Captions words={words} accent={fact.accent} fontSize={capSize} />
    </div>
  );

  return (
    <SceneFrame>
      <Background accent={fact.accent} />
      {vertical ? (
        <AbsoluteFill style={{ alignItems: "center", paddingTop: 110, paddingBottom: 120, justifyContent: "space-between" }}>
          <div style={{ width: 920 }}>{header}</div>
          {art}
          {captions}
        </AbsoluteFill>
      ) : (
        <AbsoluteFill style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 40, paddingLeft: 40 }}>
          {art}
          <div style={{ width: 800, display: "flex", flexDirection: "column", gap: 60 }}>
            {header}
            {captions}
          </div>
        </AbsoluteFill>
      )}
    </SceneFrame>
  );
};
