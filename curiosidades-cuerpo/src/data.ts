import { FPS } from "./theme";

export type ArtKey =
  | "bones"
  | "stomach"
  | "eye"
  | "blood"
  | "brain"
  | "nerve"
  | "skin"
  | "dna";

export type Fact = {
  id: string;
  n: number;
  title: string;
  accent: string;
  art: ArtKey;
  lead: string;
  body: string;
  /** Spoken opening when the fact is cut as a standalone Short. */
  shortHook?: string;
};

export const INTRO_TEXT =
  "You lost about 64 bones since the day you were born. Where did they go? Your body hides eight facts like this one, and every single one is true. Let's start with the missing bones.";

export const OUTRO_TEXT =
  "Which fact surprised you the most? Tell me the number in the comments. This video is for curiosity and education only, and it is not medical advice. See you in the next one.";

export const SHORT_OUTRO = "Watch the full video for seven more body facts.";

export const FACTS: Fact[] = [
  {
    id: "bones",
    n: 1,
    title: "BORN WITH 270 BONES",
    accent: "#FFD166",
    art: "bones",
    lead: "A newborn baby has around 270 bones. An adult has just 206. So where did the rest go?",
    shortHook:
      "You lost about 64 bones since the day you were born. Where did they go?",
    body: "They didn't disappear. As you grow, many small bones fuse together. The soft gaps between a baby's skull plates slowly close, and the base of your spine is five bones that merged into one. Bone is also living tissue that keeps renewing itself your whole life.",
  },
  {
    id: "stomach",
    n: 2,
    title: "ACID THAT DOESN'T BURN YOU",
    accent: "#7BE495",
    art: "stomach",
    lead: "Your stomach is filled with acid so strong that, outside your body, it could damage your skin. So why doesn't it burn through you?",
    shortHook:
      "Your stomach makes acid that can damage skin. So why doesn't it eat you from the inside?",
    body: "A thick layer of mucus coats the stomach wall and shields it. And that's not all. The cells of your stomach lining are replaced every few days, so damage never has time to build up.",
  },
  {
    id: "eye",
    n: 3,
    title: "THE EYE PART WITH NO BLOOD",
    accent: "#4CC9F0",
    art: "eye",
    lead: "The clear front of your eye, called the cornea, has no blood vessels at all.",
    shortHook:
      "The front of your eye has no blood supply at all. And that is on purpose.",
    body: "Blood would scatter light and blur what you see. So the cornea gets oxygen straight from the air, and nutrients from your tears and the fluid behind it. That's also one reason corneal transplants work so well.",
  },
  {
    id: "blood",
    n: 4,
    title: "2 MILLION NEW CELLS PER SECOND",
    accent: "#FF5C7A",
    art: "blood",
    lead: "Right now, your bone marrow is building about 2 million new red blood cells every single second.",
    body: "Each one carries oxygen around your body for roughly 120 days before it's recycled. That's more than 170 billion new cells every day, and you never feel a thing.",
  },
  {
    id: "brain",
    n: 5,
    title: "2% OF YOU, 20% OF YOUR ENERGY",
    accent: "#C77DFF",
    art: "brain",
    lead: "Your brain makes up only about 2 percent of your body weight. But it uses around 20 percent of your energy.",
    shortHook:
      "Your brain is 2 percent of your weight, but it burns 20 percent of your energy. Why?",
    body: "All that thinking runs on roughly 20 watts of power, less than a typical light bulb. And it keeps running even while you sleep.",
  },
  {
    id: "nerve",
    n: 6,
    title: "NERVES AT 250 MPH",
    accent: "#FF9F1C",
    art: "nerve",
    lead: "When you stub your toe, the pain signal races to your brain along your nerves. The fastest ones carry messages at up to 120 meters per second. That's over 250 miles an hour.",
    body: "But not every nerve is that quick. Slow ones, which carry dull, aching pain, crawl at around one meter per second. That's why a stubbed toe feels sharp first, and then throbs.",
  },
  {
    id: "skin",
    n: 7,
    title: "A NEW SKIN EVERY MONTH",
    accent: "#FFB4A2",
    art: "skin",
    lead: "Your skin is your biggest organ, and it's constantly rebuilding itself.",
    body: "New cells are born at the bottom and slowly rise to the surface, where they flake away. The outer layer is replaced roughly every month, and you shed tens of thousands of dead skin cells every single minute.",
  },
  {
    id: "dna",
    n: 8,
    title: "2 METERS OF DNA IN EVERY CELL",
    accent: "#5EEAD4",
    art: "dna",
    lead: "Nearly every cell in your body holds about 2 meters of DNA.",
    shortHook:
      "A single cell in your body holds 2 meters of DNA. So how does it even fit?",
    body: "All of it is packed inside a nucleus only a few thousandths of a millimeter wide. If you stretched out the DNA from all your cells, it would reach the Sun and back more than a hundred times.",
  },
];

/** Which facts are cut as Shorts. */
export const SHORT_IDS = ["bones", "stomach", "eye", "brain", "dna"];

export type TimedWord = { text: string; start: number; end: number };

const WORD_BASE = 0.16;
const WORD_PER_CHAR = 0.058;
const PAUSE_SENTENCE = 0.6;
const PAUSE_COMMA = 0.25;

/** Word timings (in frames) for a narration, as if read at a natural pace. */
export function timeNarration(text: string, startFrame = 0) {
  const raw = text.split(/\s+/).filter(Boolean);
  const words: TimedWord[] = [];
  let t = startFrame;
  for (const w of raw) {
    const letters = w.replace(/[^A-Za-z0-9]/g, "").length;
    const dur = Math.round((WORD_BASE + WORD_PER_CHAR * letters) * FPS);
    words.push({ text: w, start: t, end: t + dur });
    t += dur;
    if (/[.?!]$/.test(w)) t += Math.round(PAUSE_SENTENCE * FPS);
    else if (/[,;:]$/.test(w)) t += Math.round(PAUSE_COMMA * FPS);
  }
  return { words, end: t };
}

/** Group words into short caption pages (max 5 words, break on punctuation). */
export function chunkWords(words: TimedWord[]): TimedWord[][] {
  const chunks: TimedWord[][] = [];
  let cur: TimedWord[] = [];
  for (const w of words) {
    cur.push(w);
    const endsSentence = /[.?!]$/.test(w.text);
    const endsClause = /[,;:]$/.test(w.text) && cur.length >= 3;
    if (endsSentence || endsClause || cur.length >= 5) {
      chunks.push(cur);
      cur = [];
    }
  }
  if (cur.length) chunks.push(cur);
  return chunks;
}

export const LEAD_IN = Math.round(0.5 * FPS);
export const TAIL = Math.round(1.0 * FPS);

export function narrationFor(text: string) {
  const timed = timeNarration(text, LEAD_IN);
  return { ...timed, duration: timed.end + TAIL };
}

export function factLongText(f: Fact) {
  return `${f.lead} ${f.body}`;
}

export function factShortText(f: Fact) {
  return `${f.shortHook ?? f.lead} ${f.body} ${SHORT_OUTRO}`;
}

export const INTRO = narrationFor(INTRO_TEXT);
export const OUTRO = narrationFor(OUTRO_TEXT);
export const LONG_FACT_DURS = FACTS.map((f) => narrationFor(factLongText(f)).duration);
export const LONG_TOTAL =
  INTRO.duration + LONG_FACT_DURS.reduce((a, b) => a + b, 0) + OUTRO.duration;

export const SHORTS = SHORT_IDS.map((id) => {
  const fact = FACTS.find((f) => f.id === id)!;
  return { fact, duration: narrationFor(factShortText(fact)).duration };
});
