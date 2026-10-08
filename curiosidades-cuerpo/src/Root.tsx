import React from "react";
import { Composition } from "remotion";
import { LONG_TOTAL, SHORTS } from "./data";
import { FPS } from "./theme";
import { LongVideo, ShortVideo } from "./Video";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Long" component={LongVideo} width={1920} height={1080} fps={FPS} durationInFrames={LONG_TOTAL} />
    {SHORTS.map((s) => (
      <Composition
        key={s.fact.id}
        id={`Short-${s.fact.id}`}
        component={ShortVideo}
        width={1080}
        height={1920}
        fps={FPS}
        durationInFrames={s.duration}
        defaultProps={{ factId: s.fact.id }}
      />
    ))}
  </>
);
