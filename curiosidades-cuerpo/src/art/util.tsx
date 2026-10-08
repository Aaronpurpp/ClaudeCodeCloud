import React from "react";
import { Easing, interpolate } from "remotion";
import { FONT } from "../theme";

export const prog = (frame: number, start: number, dur: number) =>
  interpolate(frame, [start, start + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.22, 1, 0.36, 1),
  });

export const bob = (frame: number, amp = 8, period = 90, phase = 0) =>
  Math.sin(((frame + phase) / period) * Math.PI * 2) * amp;

/** Deterministic pseudo random in [0,1). */
export const rnd = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

export const Label: React.FC<{
  x: number;
  y: number;
  text: string;
  size?: number;
  color?: string;
  anchor?: "start" | "middle" | "end";
  opacity?: number;
  weight?: number;
}> = ({ x, y, text, size = 44, color = "#fff", anchor = "middle", opacity = 1, weight = 900 }) => (
  <text
    x={x}
    y={y}
    fontFamily={FONT}
    fontWeight={weight}
    fontSize={size}
    fill={color}
    textAnchor={anchor}
    opacity={opacity}
    stroke="#0B1026"
    strokeWidth={size * 0.16}
    paintOrder="stroke fill"
    strokeLinejoin="round"
  >
    {text}
  </text>
);

export type ArtProps = { accent: string };
