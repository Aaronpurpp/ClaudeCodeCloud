import React from "react";
import { Series } from "remotion";
import { FACTS, factLongText, factShortText, INTRO, LONG_FACT_DURS, OUTRO, SHORTS } from "./data";
import { FactScene } from "./FactScene";
import { IntroScene, OutroScene } from "./TitleScenes";

export const LongVideo: React.FC = () => (
  <Series>
    <Series.Sequence durationInFrames={INTRO.duration}>
      <IntroScene />
    </Series.Sequence>
    {FACTS.map((f, i) => (
      <Series.Sequence key={f.id} durationInFrames={LONG_FACT_DURS[i]}>
        <FactScene fact={f} text={factLongText(f)} />
      </Series.Sequence>
    ))}
    <Series.Sequence durationInFrames={OUTRO.duration}>
      <OutroScene />
    </Series.Sequence>
  </Series>
);

export const ShortVideo: React.FC<{ factId: string }> = ({ factId }) => {
  const fact = FACTS.find((f) => f.id === factId)!;
  return <FactScene fact={fact} text={factShortText(fact)} badge={`BODY FACT`} />;
};

export { SHORTS };
