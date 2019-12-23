// @flow

export function toTitleCase(str: string) {
  return str.replace(/\w\S*/g, txt => {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}

export function trimHtml(str: string) {
  return str.replace(/<[^>]*>/g, '');
}
