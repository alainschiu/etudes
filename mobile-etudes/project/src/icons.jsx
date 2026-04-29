// Hairline icons — Lucide-style at stroke 1.4
// All accept { size, color, strokeWidth } and inherit color via currentColor.

const Icon = ({ children, size = 18, strokeWidth = 1.4, style = {} }) => (
  <svg
    width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={strokeWidth}
    strokeLinecap="round" strokeLinejoin="round"
    style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}
  >
    {children}
  </svg>
);

const Menu = (p) => (
  <Icon {...p}>
    <line x1="4" y1="7" x2="20" y2="7"/>
    <line x1="4" y1="13" x2="20" y2="13"/>
    <line x1="4" y1="19" x2="14" y2="19"/>
  </Icon>
);

const Play = (p) => (
  <Icon {...p}>
    <path d="M7 5 L19 12 L7 19 Z" fill="currentColor"/>
  </Icon>
);

const Pause = (p) => (
  <Icon {...p}>
    <rect x="6" y="5" width="4" height="14" fill="currentColor" stroke="none"/>
    <rect x="14" y="5" width="4" height="14" fill="currentColor" stroke="none"/>
  </Icon>
);

const Square = (p) => (
  <Icon {...p}>
    <rect x="6" y="6" width="12" height="12" fill="currentColor" stroke="none"/>
  </Icon>
);

const Circle = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="6" fill="currentColor" stroke="none"/>
  </Icon>
);

const Plus = (p) => (
  <Icon {...p}>
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </Icon>
);

const X = (p) => (
  <Icon {...p}>
    <line x1="6" y1="6" x2="18" y2="18"/>
    <line x1="18" y1="6" x2="6" y2="18"/>
  </Icon>
);

const ChevronDown = (p) => (
  <Icon {...p}>
    <polyline points="6 9 12 15 18 9"/>
  </Icon>
);

const ChevronRight = (p) => (
  <Icon {...p}>
    <polyline points="9 6 15 12 9 18"/>
  </Icon>
);

const ChevronLeft = (p) => (
  <Icon {...p}>
    <polyline points="15 6 9 12 15 18"/>
  </Icon>
);

const Mic = (p) => (
  <Icon {...p}>
    <rect x="9" y="3" width="6" height="12" rx="3"/>
    <path d="M5 11a7 7 0 0 0 14 0"/>
    <line x1="12" y1="18" x2="12" y2="22"/>
  </Icon>
);

const Metronome = (p) => (
  <Icon {...p}>
    <path d="M8 21 L16 21 L13 4 L11 4 Z"/>
    <line x1="12" y1="14" x2="17" y2="9"/>
  </Icon>
);

const BookOpen = (p) => (
  <Icon {...p}>
    <path d="M3 5h7a3 3 0 0 1 3 3v12a2 2 0 0 0-2-2H3z"/>
    <path d="M21 5h-7a3 3 0 0 0-3 3v12a2 2 0 0 1 2-2h8z"/>
  </Icon>
);

const FileText = (p) => (
  <Icon {...p}>
    <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
    <polyline points="14 3 14 9 20 9"/>
    <line x1="8" y1="13" x2="16" y2="13"/>
    <line x1="8" y1="17" x2="14" y2="17"/>
  </Icon>
);

const Calendar = (p) => (
  <Icon {...p}>
    <rect x="3" y="5" width="18" height="16" rx="1"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
    <line x1="8" y1="3" x2="8" y2="7"/>
    <line x1="16" y1="3" x2="16" y2="7"/>
  </Icon>
);

const Clock = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="9"/>
    <polyline points="12 7 12 12 15 14"/>
  </Icon>
);

const Settings = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>
  </Icon>
);

const Coffee = (p) => (
  <Icon {...p}>
    <path d="M3 8h14v6a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4z"/>
    <path d="M17 9h2a2 2 0 0 1 0 4h-2"/>
    <line x1="6" y1="2" x2="6" y2="5"/>
    <line x1="10" y1="2" x2="10" y2="5"/>
    <line x1="14" y1="2" x2="14" y2="5"/>
  </Icon>
);

const Waves = (p) => (
  <Icon {...p}>
    <path d="M2 12c2 -2 4 -2 6 0s4 2 6 0 4 -2 6 0"/>
    <path d="M2 6c2 -2 4 -2 6 0s4 2 6 0 4 -2 6 0"/>
    <path d="M2 18c2 -2 4 -2 6 0s4 2 6 0 4 -2 6 0"/>
  </Icon>
);

const Target = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="9"/>
    <circle cx="12" cy="12" r="5"/>
    <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
  </Icon>
);

const Bookmark = (p) => (
  <Icon {...p}>
    <path d="M6 4h12v17l-6-4-6 4z"/>
  </Icon>
);

const MoreHorizontal = (p) => (
  <Icon {...p}>
    <circle cx="6" cy="12" r="1.2" fill="currentColor"/>
    <circle cx="12" cy="12" r="1.2" fill="currentColor"/>
    <circle cx="18" cy="12" r="1.2" fill="currentColor"/>
  </Icon>
);

const PenLine = (p) => (
  <Icon {...p}>
    <path d="M4 20h16"/>
    <path d="M14 4l4 4-9 9H5v-4z"/>
  </Icon>
);

const Search = (p) => (
  <Icon {...p}>
    <circle cx="11" cy="11" r="6"/>
    <line x1="20" y1="20" x2="16" y2="16"/>
  </Icon>
);

const Lock = (p) => (
  <Icon {...p}>
    <rect x="5" y="11" width="14" height="10" rx="1"/>
    <path d="M8 11V8a4 4 0 0 1 8 0v3"/>
  </Icon>
);

const Music = (p) => (
  <Icon {...p}>
    <path d="M9 18V5l11-2v13"/>
    <circle cx="6" cy="18" r="3"/>
    <circle cx="17" cy="16" r="3"/>
  </Icon>
);

const ChevronUp = (p) => (
  <Icon {...p}>
    <polyline points="6 15 12 9 18 15"/>
  </Icon>
);

Object.assign(window, {
  Icon, Menu, Play, Pause, Square, Circle, Plus, X, ChevronDown, ChevronRight, ChevronLeft,
  ChevronUp, Mic, Metronome, BookOpen, FileText, Calendar, Clock, Settings, Coffee, Waves,
  Target, Bookmark, MoreHorizontal, PenLine, Search, Lock, Music
});
