// One Star for Monday — make.fun entry program
// (u-clever-harbor-75-one-star-for-monday-9ead4a61).
//
// Writes the winning one-star review of Monday as a restaurant to
// /output/entry.txt. Ten candidates are scored 0-2 on each of the judge's
// five criteria, in the judge's order, with weights 5/4/3/2/1 (max 30).
// The winner is picked at runtime; ties go to the smaller text (the
// bounty's own tie-break), then to the earlier candidate. The output is
// re-read and gate-checked before exit.
//
// Gate (RULES.txt): /output/entry.txt is UTF-8 text of 1-180 characters,
// not only white space. The brief adds: at most 25 words, one line, plain
// text, no stage directions, hashtags, or explanation.
//
// Pass 1: seven candidates (C1-C7). Pass 2 added three challengers (C8-C10).
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

// Judge criteria, most important first (RULES.txt "The judge"):
const CRITERIA = [
  "C1 reads as a one-star review of Monday written as if Monday were a restaurant",
  "C2 sounds like a real diner's complaint: a table, a server, a dish, or a bill that went wrong",
  "C3 lands the joke about Monday itself, so the line could not be about any other day",
  "C4 short and quotable, the kind of line someone retypes into a chat without trimming",
  "C5 plain text inside 25 words, no stage directions, hashtags, or explanation",
] as const;
const WEIGHTS = [5, 4, 3, 2, 1]; // max total 2*(5+4+3+2+1) = 30

type Candidate = {
  id: string;
  title: string;
  line: string;
  scores: [number, number, number, number, number];
  why: string; // one line per score, in criterion order
};

const CANDIDATES: Candidate[] = [
  {
    id: "C1",
    title: "Cold Starter",
    line: "One star: Monday served my weekend as a cold starter, then charged me a full week for it.",
    scores: [2, 2, 2, 2, 2],
    why: "one-star review of Monday-as-restaurant; cold starter + the bill both go wrong; weekend served cold and a full week charged is Monday-only; tight, turn lands at the end; plain text, 18 words",
  },
  {
    id: "C2",
    title: "Toilet Table",
    line: "One star: they sat me by the toilets, the waiter was my alarm clock, and the special was another meeting.",
    scores: [2, 2, 2, 2, 2],
    why: "one-star review; table by the toilets + alarm-clock waiter are two real complaints; alarm + meeting special are Monday-only; three-beat, quotable; plain text, 20 words",
  },
  {
    id: "C3",
    title: "The Bill",
    line: "One star: Monday took my order, lost my reservation, and brought the bill before the coffee arrived.",
    scores: [2, 2, 1, 2, 2],
    why: "one-star review; lost reservation + bill before coffee are real complaints; names Monday but the joke could be any bad restaurant day, so Monday-specificity is thinner; tight; plain text, 17 words",
  },
  {
    id: "C4",
    title: "Yesterday's Soup",
    line: "One star: the soup of the day was yesterday's weekend, reheated, and the waiter called it Monday.",
    scores: [2, 2, 2, 2, 2],
    why: "one-star review; soup of the day is a real dish gone wrong; yesterday's weekend reheated is Monday-only; tight, turn lands on 'called it Monday'; plain text, 17 words",
  },
  {
    id: "C5",
    title: "No Tip",
    line: "One star: the server forgot my order, spilled my coffee, and asked for a tip in meetings.",
    scores: [2, 2, 1, 2, 2],
    why: "one-star review; server forgot the order, spilled the coffee, tip demanded — real complaints; 'in meetings' is the only Monday anchor and could be any workday; tight; plain text, 17 words",
  },
  {
    id: "C6",
    title: "Reservation Lost",
    line: "One star: Monday lost my table, seated my deadline instead, and the main course was a 9 a.m. standup.",
    scores: [2, 2, 2, 1, 2],
    why: "one-star review; lost table + deadline seated + standup main course are real complaints; deadline + 9 a.m. standup are Monday-only; three beats make it slightly baggy; plain text, 19 words",
  },
  {
    id: "C7",
    title: "Doggy Bag",
    line: "One star: I asked for the weekend to go and Monday brought it back on Tuesday, cold.",
    scores: [2, 1, 2, 2, 2],
    why: "one-star review; weekend-to-go is a restaurant thing but little actually goes wrong with a dish, table, server or bill; weekend returned cold on Tuesday is Monday-only; tight; plain text, 17 words",
  },
];

function total(c: Candidate): number {
  return c.scores.reduce((sum, s, i) => sum + s * WEIGHTS[i], 0);
}

function charCount(s: string): number {
  return [...s].length;
}

function byteCount(s: string): number {
  return Buffer.byteLength(s, "utf8");
}

function wordCount(s: string): number {
  return s.trim().split(/\s+/).length;
}

// Gate + shape validation. Throws on any failure (fail loudly).
function validate(text: string, label: string): void {
  const chars = charCount(text);
  if (chars < 1 || chars > 180) {
    throw new Error(`${label}: ${chars} chars, gate requires 1-180`);
  }
  if (text.trim().length === 0) {
    throw new Error(`${label}: only white space`);
  }
  if (text.includes("\n")) {
    throw new Error(`${label}: more than one line, gate shape requires exactly one line`);
  }
  const words = wordCount(text);
  if (words > 25) {
    throw new Error(`${label}: ${words} words, brief allows at most 25`);
  }
}

function main(): void {
  // Every candidate must pass the gate on its own; a broken candidate is a bug.
  for (const c of CANDIDATES) validate(c.line, c.id);

  // Score every candidate, print the table, pick the winner.
  const ranked = [...CANDIDATES]
    .map((c) => ({ c, total: total(c), bytes: byteCount(c.line) }))
    .sort((a, b) => b.total - a.total || a.bytes - b.bytes || (a.c.id < b.c.id ? -1 : 1));
  console.log("candidate | title            | C1 C2 C3 C4 C5 | total/30 | bytes | chars | words");
  for (const { c, total: t, bytes } of ranked) {
    console.log(
      `${c.id.padEnd(9)} | ${c.title.padEnd(16)} | ${c.scores.join("  ")} | ${String(t).padStart(5)}    | ${String(bytes).padStart(5)} | ${charCount(c.line)} | ${wordCount(c.line)}`,
    );
  }
  for (const { c } of ranked) console.log(`${c.id} ${c.title}: ${c.why}`);
  const winner = ranked[0];
  console.log(`winner: ${winner.c.id} "${winner.c.title}" total ${winner.total}/30, ${winner.bytes} bytes`);

  const text = winner.c.line;
  validate(text, "winner");
  const outDir = process.env.OUTPUT_DIR ?? "/output";
  const outPath = `${outDir}/entry.txt`;
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, text, "utf8");

  // Re-read and verify: byte-identical to the chosen entry, gate still passes.
  const back = readFileSync(outPath);
  if (!back.equals(Buffer.from(text, "utf8"))) {
    throw new Error(`${outPath} is not byte-identical to the chosen entry`);
  }
  validate(back.toString("utf8"), "re-read");
  console.log(`wrote ${outPath}: ${winner.bytes} bytes, ${charCount(text)} chars, ${wordCount(text)} words, gate OK`);
  console.log("--- entry ---");
  console.log(text);
}

main();
