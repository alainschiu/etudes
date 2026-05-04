export const BG='#111010',SURFACE='#1A1918',SURFACE2='#24221F',TEXT='#F4EEE3';
export const MUTED='#C8C1B3',FAINT='rgba(140, 133, 120, 1)',DIM='#5E594F';
export const LINE='rgba(244,238,227,0.08)',LINE_MED='rgba(244,238,227,0.16)',LINE_STR='#3A3732';
export const IKB='#002FA7',IKB_SOFT='rgba(0,47,167,0.12)';
// REC: muted destructive — active recording state only. No other use.
export const REC='#A93226';
// WARN: muted destructive tone (the only red-family colour the North Star
// permits). Hover state on destructive buttons; sync/auth error indicators.
// Not a general accent.
export const WARN='#E07A7A',WARN_SOFT='rgba(224,122,122,0.10)';
// LINK: brighter IKB for hyperlink text on near-black backgrounds.
// Permitted use: docs HTML files only (--link CSS variable).
// App components use IKB directly for interactive elements.
export const LINK='#6BA3FF';
// WARM: practice's edges — rest timer, warm-up sessions,
// locked recording rows (border + tinted background),
// A/B comparison B-track waveform.
// Not a general accent. Do not use outside these four surfaces.
export const WARM='#B89668',WARM_SOFT='rgba(184,150,104,0.12)';
// ── Z-index stack ─────────────────────────────────────────────────────────
// z-50: Drawer panel
// z-49: Drawer scrim
// z-40: Metronome sheet (and future bottom sheets)
// z-30: (reserved for future sheet layer)
// z-20: Footer (fixed)
// z-10: TopBar (fixed)
// All other content: z-auto
export const Z_DRAWER       = 50;
export const Z_DRAWER_SCRIM = 49;
export const Z_SHEET        = 40;
export const Z_FOOTER       = 20;
export const Z_TOPBAR       = 10;

export const serif="'Cormorant Garamond', 'GT Sectra', 'Tiempos Headline', 'EB Garamond', Georgia, serif";
export const serifText="'EB Garamond', 'Tiempos Text', 'Source Serif Pro', Georgia, serif";
export const sans="'Inter', 'Söhne', 'Graphik', -apple-system, BlinkMacSystemFont, sans-serif";
export const mono="'JetBrains Mono', 'Berkeley Mono', 'IBM Plex Mono', ui-monospace, monospace";
