const FILLER = new Set(
  "a al con de del e el en la las lo los o para por que se su sus u un una unas unos y".split(" ")
);

/** "Entre aguas: una experiencia de ciencia con niñas del Pacífico" → "entre-aguas-experiencia-ciencia-ninas". */
export const shortSlug = (text: string, maxLength = 40) => {
  const words = text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  const meaningful = words.filter((word) => !FILLER.has(word));
  const source = meaningful.length > 0 ? meaningful : words;

  let slug = "";
  for (const word of source) {
    const next = slug ? `${slug}-${word}` : word;
    if (next.length > maxLength) break;
    slug = next;
  }
  return slug || (source[0] ?? "").slice(0, maxLength);
};
