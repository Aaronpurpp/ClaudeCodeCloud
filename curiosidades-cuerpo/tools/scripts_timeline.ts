import { FACTS, INTRO, LONG_FACT_DURS, OUTRO, SHORTS, LONG_TOTAL } from "../src/data";
const scenes: { name: string; start: number; dur: number }[] = [];
let t = 0;
scenes.push({ name: "intro", start: t, dur: INTRO.duration });
t += INTRO.duration;
FACTS.forEach((f, i) => {
  scenes.push({ name: f.id, start: t, dur: LONG_FACT_DURS[i] });
  t += LONG_FACT_DURS[i];
});
scenes.push({ name: "outro", start: t, dur: OUTRO.duration });
console.log(JSON.stringify({ fps: 30, longTotal: LONG_TOTAL, scenes, shorts: SHORTS.map((s) => ({ id: s.fact.id, dur: s.duration })) }, null, 1));
