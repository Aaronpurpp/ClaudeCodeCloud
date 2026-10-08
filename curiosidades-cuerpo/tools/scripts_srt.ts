import { chunkWords, FACTS, factLongText, factShortText, INTRO, INTRO_TEXT, LONG_FACT_DURS, narrationFor, OUTRO, OUTRO_TEXT, SHORTS } from "../src/data";
const fmt = (f: number) => {
  const ms = Math.round((f / 30) * 1000);
  const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000), s = Math.floor((ms % 60000) / 1000), r = ms % 1000;
  const p = (n: number, l = 2) => String(n).padStart(l, "0");
  return `${p(h)}:${p(m)}:${p(s)},${p(r, 3)}`;
};
const srt = (parts: { text: string; offset: number }[]) => {
  let i = 1;
  const out: string[] = [];
  for (const { text, offset } of parts) {
    const { words } = narrationFor(text);
    for (const c of chunkWords(words)) {
      const start = offset + c[0].start;
      const end = offset + c[c.length - 1].end;
      out.push(`${i++}\n${fmt(start)} --> ${fmt(end)}\n${c.map((w) => w.text).join(" ")}\n`);
    }
  }
  return out.join("\n");
};
const which = process.argv[2];
if (which === "long") {
  const parts = [{ text: INTRO_TEXT, offset: 0 }];
  let t = INTRO.duration;
  FACTS.forEach((f, i) => { parts.push({ text: factLongText(f), offset: t }); t += LONG_FACT_DURS[i]; });
  parts.push({ text: OUTRO_TEXT, offset: t });
  console.log(srt(parts));
} else {
  const s = SHORTS.find((x) => x.fact.id === which)!;
  console.log(srt([{ text: factShortText(s.fact), offset: 0 }]));
}
