import React from "react";
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Background } from "./Background";
import { Captions } from "./Captions";
import { FACTS, INTRO_TEXT, narrationFor, OUTRO_TEXT } from "./data";
import { SceneFrame } from "./FactScene";
import { FONT } from "./theme";

const ACCENT = "#FFD166";

export const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const vertical = height > width;
  const { words } = narrationFor(INTRO_TEXT);
  const pop = spring({ frame: frame - 3, fps, config: { damping: 12, stiffness: 140 } });
  return (
    <SceneFrame>
      <Background accent={ACCENT} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 70, padding: 80 }}>
        <div style={{ textAlign: "center", transform: `scale(${0.7 + 0.3 * pop})`, opacity: Math.min(1, pop * 2) }}>
          <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: vertical ? 150 : 150, lineHeight: 0.95, color: "#fff", letterSpacing: -4, textShadow: "0 10px 0 rgba(0,0,0,0.3)" }}>
            8 BODY FACTS
          </div>
          <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: vertical ? 110 : 120, lineHeight: 1, color: ACCENT, letterSpacing: -2, marginTop: 10 }}>
            THAT SOUND FAKE
          </div>
        </div>
        <div style={{ width: vertical ? 960 : 1500, minHeight: 300, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Captions words={words} accent={ACCENT} fontSize={vertical ? 76 : 70} />
        </div>
      </AbsoluteFill>
    </SceneFrame>
  );
};

export const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const vertical = height > width;
  const { words } = narrationFor(OUTRO_TEXT);
  return (
    <SceneFrame>
      <Background accent={ACCENT} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 60, padding: 80 }}>
        <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 120, color: "#fff", letterSpacing: -3, textAlign: "center", textShadow: "0 8px 0 rgba(0,0,0,0.3)" }}>
          WHICH ONE SURPRISED YOU?
        </div>
        <div style={{ display: "flex", gap: 28, flexWrap: "wrap", justifyContent: "center", width: vertical ? 900 : 1500 }}>
          {FACTS.map((f, i) => {
            const s = spring({ frame: frame - 10 - i * 5, fps, config: { damping: 10, stiffness: 200 } });
            return (
              <div key={f.id} style={{ width: 150, height: 150, borderRadius: 40, background: f.accent, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT, fontWeight: 900, fontSize: 96, color: "#0B1026", transform: `scale(${s})` }}>
                {f.n}
              </div>
            );
          })}
        </div>
        <div style={{ width: vertical ? 960 : 1500, display: "flex", justifyContent: "center", minHeight: 240 }}>
          <Captions words={words} accent={ACCENT} fontSize={vertical ? 64 : 58} />
        </div>
      </AbsoluteFill>
    </SceneFrame>
  );
};
