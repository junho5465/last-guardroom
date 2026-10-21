const paths: Record<string, string> = {
  shield: '<path d="M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6l-8-3Z"/><path d="m8.5 12 2.2 2.2 4.8-5"/>',
  settings:
    '<path d="m9 4 1-2h4l1 2 2 1 2-.2 2 3.4-1 1.8v3l1 1.8-2 3.4-2-.2-2 1-1 2h-4l-1-2-2-1-2 .2-2-3.4 1-1.8v-3L3 8.2l2-3.4L7 5l2-1Z"/><circle cx="12" cy="11" r="3"/>',
  arrow: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
  chevron: '<path d="m9 5 7 7-7 7"/>',
  play: '<path d="m9 5 10 7-10 7V5Z"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/><path d="M12 14v3"/>',
  flask:
    '<path d="M9 3h6m-5 0v6L4 19a1.5 1.5 0 0 0 1.5 2h13a1.5 1.5 0 0 0 1.5-2L14 9V3M7 14h10"/><path d="M10 17h.01M14 18h.01"/>',
  people:
    '<circle cx="9" cy="7" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 4a3 3 0 0 1 0 6m3 11v-3a6 6 0 0 0-2-4"/>',
  coin: '<circle cx="12" cy="12" r="9"/><path d="M14 8h-3a2 2 0 0 0 0 4h2a2 2 0 0 1 0 4h-3m2-9v10"/>',
  bolt: '<path d="m13 2-9 12h7l-1 8 10-13h-7l1-7Z"/>',
  heart: '<path d="M20 5c-3-3-7-1-8 1-1-2-5-4-8-1-5 5 2 11 8 15 6-4 13-10 8-15Z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  upgrade: '<path d="m5 12 7-7 7 7M5 19l7-7 7 7"/>',
  target:
    '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  home: '<path d="m3 11 9-8 9 8m-16-2v12h14V9M10 21v-7h4v7"/>',
  radio:
    '<path d="m8 7 9-5M7 7h11a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z"/><circle cx="9" cy="14" r="2"/><path d="M15 12h2m-2 4h2"/>',
  trophy:
    '<path d="M8 3h8v5a4 4 0 0 1-8 0V3ZM8 5H4v2a4 4 0 0 0 4 4m8-6h4v2a4 4 0 0 1-4 4m-4 1v6m-4 3h8m-7-3h6"/>',
  merge:
    '<path d="M5 3v4c0 4 14 4 14 10v4M19 3v4c0 4-14 4-14 10v4m0-1-3-3m3 3 3-3m11 3-3-3m3 3 3-3"/>',
  spark: '<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3ZM20 3v4m-2-2h4"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  sound: '<path d="m11 4-6 5H2v6h3l6 5V4Zm5 4a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
  book: '<path d="M12 5C9 2 4 3 2 4v16c3-2 7-2 10 0 3-2 7-2 10 0V4c-2-1-7-2-10 1Zm0 0v15"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  flag: '<path d="M5 22V3c5-3 9 3 14 0v11c-5 3-9-3-14 0"/>',
  repair: '<path d="m14 6 4-4a6 6 0 0 1-7 8L3 18a2 2 0 0 0 3 3l8-8a6 6 0 0 0 8-7l-4 4-4-4Z"/>',
};
export function icon(name: string, cls = '') {
  return (
    '<svg class="icon ' +
    cls +
    '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    (paths[name] || paths.shield) +
    '</svg>'
  );
}
export const asset = (name: string) => import.meta.env.BASE_URL + 'assets/' + name;
