/* ============================================================
   COMET — icon set (clean geometric line glyphs)
   All icons inherit color via currentColor + stroke.
   ============================================================ */
const Svg = ({ children, fill }) => (
  <svg viewBox="0 0 24 24" fill={fill ? "currentColor" : "none"} stroke={fill ? "none" : "currentColor"}
       strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{children}</svg>
);

const Icon = {
  play: () => <Svg fill><path d="M7 4.5v15l13-7.5z" /></Svg>,
  gamepad: () => <Svg>
    <path d="M7 8h10a5 5 0 0 1 5 5 4 4 0 0 1-7 2.8L13.5 14h-3l-1.5 1.8A4 4 0 0 1 2 13a5 5 0 0 1 5-5Z" />
    <line x1="6.5" y1="11" x2="6.5" y2="14" /><line x1="5" y1="12.5" x2="8" y2="12.5" />
    <circle cx="16.5" cy="11.5" r="1" fill="currentColor" stroke="none" /><circle cx="18.5" cy="13.5" r="1" fill="currentColor" stroke="none" />
  </Svg>,
  pencil: () => <Svg><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" /><line x1="14.5" y1="5.5" x2="18.5" y2="9.5" /></Svg>,
  book: () => <Svg><path d="M3 5.5A2 2 0 0 1 5 4h5v15H5a2 2 0 0 0-2 1.5Z" /><path d="M21 5.5A2 2 0 0 0 19 4h-5v15h5a2 2 0 0 1 2 1.5Z" /></Svg>,
  film: () => <Svg><rect x="3" y="4" width="18" height="16" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="3" y1="15" x2="21" y2="15" /><line x1="9" y1="4" x2="9" y2="20" /><line x1="15" y1="4" x2="15" y2="20" /></Svg>,
  music: () => <Svg><path d="M9 18V6l10-2v12" /><circle cx="6" cy="18" r="3" /><circle cx="16" cy="16" r="3" /></Svg>,
  globe: () => <Svg><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18" /></Svg>,
  image: () => <Svg><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8.5" cy="9" r="1.6" /><path d="m4 18 5-5 4 4 3-3 4 4" /></Svg>,
  compass: () => <Svg><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2 5.5-5 2 2-5.5z" fill="currentColor" stroke="none" /></Svg>,
  gear: () => <Svg><circle cx="12" cy="12" r="3.2" /><path d="M12 2.5v3M12 18.5v3M21.5 12h-3M5.5 12h-3M18.5 5.5l-2 2M7.5 16.5l-2 2M18.5 18.5l-2-2M7.5 7.5l-2-2" /></Svg>,
  shield: () => <Svg><path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></Svg>,
  clock: () => <Svg><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></Svg>,
  wifi: () => <Svg><path d="M2 8.5a15 15 0 0 1 20 0M5 12a10 10 0 0 1 14 0M8 15.5a5 5 0 0 1 8 0" /><circle cx="12" cy="19" r="1" fill="currentColor" stroke="none" /></Svg>,
  volume: () => <Svg><path d="M4 9v6h4l5 4V5L8 9H4Z" /><path d="M16 9a4 4 0 0 1 0 6" /></Svg>,
  battery: () => <Svg><rect x="2" y="7" width="17" height="10" rx="2" /><rect x="4" y="9" width="11" height="6" rx="1" fill="currentColor" stroke="none" /><line x1="21" y1="10.5" x2="21" y2="13.5" /></Svg>,
  star: () => <Svg fill><path d="m12 3 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.1l1-5.8-4.3-4.1 5.9-.9z" /></Svg>,
  trophy: () => <Svg><path d="M7 4h10v4a5 5 0 0 1-10 0V4Z" /><path d="M7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3M9 14.5h6M12 12.5v2M9 20h6M10 17h4v3h-4z" /></Svg>,
  bell: () => <Svg><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" /><path d="M10 20a2 2 0 0 0 4 0" /></Svg>,
  home: () => <Svg><path d="m3 11 9-7 9 7" /><path d="M5 10v9h14v-9" /><path d="M10 19v-5h4v5" /></Svg>,
  grid: () => <Svg><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></Svg>,
  search: () => <Svg><circle cx="11" cy="11" r="7" /><line x1="16" y1="16" x2="21" y2="21" /></Svg>,
  close: () => <Svg><line x1="5" y1="5" x2="19" y2="19" /><line x1="19" y1="5" x2="5" y2="19" /></Svg>,
  help: () => <Svg><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.4 2.3c-.8.3-1.4 1-1.4 1.9v.3" /><circle cx="12" cy="17" r="1" fill="currentColor" stroke="none" /></Svg>,
  power: () => <Svg><path d="M12 3v9" /><path d="M6.5 7a8 8 0 1 0 11 0" /></Svg>,
  lock: () => <Svg><rect x="4.5" y="10" width="15" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></Svg>,
  users: () => <Svg><circle cx="9" cy="8" r="3.2" /><path d="M3.5 19a5.5 5.5 0 0 1 11 0" /><path d="M16 5.5a3 3 0 0 1 0 5.8M20.5 19a5 5 0 0 0-3.5-4.6" /></Svg>,
  heart: () => <Svg fill><path d="M12 20s-7-4.3-9.2-8.3C1.3 8.5 3 5 6.3 5 8.2 5 9.5 6 12 8.5 14.5 6 15.8 5 17.7 5 21 5 22.7 8.5 21.2 11.7 19 15.7 12 20 12 20Z" /></Svg>,
  chat: () => <Svg><path d="M4 5h16v11H9l-4 3v-3H4z" /><line x1="8" y1="9" x2="16" y2="9" /><line x1="8" y1="12.5" x2="13" y2="12.5" /></Svg>,
  chevR: () => <Svg><path d="m9 5 7 7-7 7" /></Svg>,
  chevL: () => <Svg><path d="m15 5-7 7 7 7" /></Svg>,
  rocket: () => <Svg><path d="M12 3c3 1 5 4 5 8l-2.5 2.5h-5L7 11c0-4 2-7 5-8Z" /><circle cx="12" cy="9" r="1.6" /><path d="M9.5 13.5 7 16m7.5-2.5L17 16M10 18c-1 1.5-1 3-1 3s1.5 0 3-1" /></Svg>,
  skipB: () => <Svg fill><path d="M7 5v14M19 5 9 12l10 7z" /></Svg>,
  skipF: () => <Svg fill><path d="M17 5v14M5 5l10 7L5 19z" /></Svg>,
  pause: () => <Svg fill><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></Svg>,
  calc: () => <Svg><rect x="5" y="3" width="14" height="18" rx="2" /><line x1="8" y1="7" x2="16" y2="7" /><line x1="8.5" y1="11" x2="8.5" y2="11" /><line x1="12" y1="11" x2="12" y2="11" /><line x1="15.5" y1="11" x2="15.5" y2="11" /><line x1="8.5" y1="14.5" x2="8.5" y2="14.5" /><line x1="12" y1="14.5" x2="12" y2="14.5" /><line x1="15.5" y1="14.5" x2="15.5" y2="17.5" /></Svg>,
  flask: () => <Svg><path d="M9 3h6M10 3v6l-4.5 8a2 2 0 0 0 1.8 3h9.4a2 2 0 0 0 1.8-3L14 9V3" /><line x1="8" y1="15" x2="16" y2="15" /></Svg>,
  palette: () => <Svg><path d="M12 3a9 9 0 1 0 0 18c1.5 0 2-1 2-2s-.7-1.5-.7-2.3c0-.7.6-1.2 1.4-1.2H17a4 4 0 0 0 4-4c0-4.4-4-8.5-9-8.5Z" /><circle cx="7.5" cy="11" r="1" fill="currentColor" stroke="none" /><circle cx="10" cy="7" r="1" fill="currentColor" stroke="none" /><circle cx="15" cy="7.5" r="1" fill="currentColor" stroke="none" /></Svg>,
  leaf: () => <Svg><path d="M4 20c0-9 6-15 16-15 0 10-6 16-15 16-.5 0-1 0-1-1Z" /><path d="M9 15c2-3 5-5 8-6" /></Svg>,
  map: () => <Svg><path d="m3 6 6-2 6 2 6-2v14l-6 2-6-2-6 2z" /><line x1="9" y1="4" x2="9" y2="18" /><line x1="15" y1="6" x2="15" y2="20" /></Svg>,
  bolt: () => <Svg fill><path d="M13 2 4 14h6l-1 8 9-12h-6z" /></Svg>,
  plus: () => <Svg><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></Svg>,
};

window.Icon = Icon;
