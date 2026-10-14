export const appendSourcePages = (reference, pages) => {
  if (pages == null || pages.trim().length === 0) {
    return reference;
  }
  const pageRange = pages.trim().replace(/\s*[-–]\s*/g, '–');
  const prefix = reference.trim().replace(/\.$/, '');
  return `${prefix.length === 0 ? '' : `${prefix}, `}s. ${pageRange}.`;
};
