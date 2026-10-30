// Keep diagram rows as non-verse equipment, including multiline legacy markup.
// Retain page markers so the next verse still belongs to the correct page.
export const metricalDiagramsAsNonVerse = body => body.replace(
  /<metrik\b[^>]*>([\s\S]*?)<\/metrik>/gu,
  (_match, diagram) => diagram.split(/\r\n?|\n/u)
    .map(line => `<nonum>${line}</nonum>`)
    .join('\n'),
);
