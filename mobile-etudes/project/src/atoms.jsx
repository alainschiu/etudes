// Atoms — small primitives reused across screens

const C = {
  ink: '#111010',
  ink100: '#1A1918',
  ink200: '#24221F',
  ivory100: '#F4EEE3',
  ivory200: '#E7E0D2',
  ivory300: '#C8C1B3',
  ivory400: '#8C8578',
  ivory500: '#5E594F',
  ivory600: '#403C36',
  accent: '#6B7FB3',  // Vespers (muted violet-blue from system)
  accentSoft: 'rgba(107,127,179,0.15)',
  accentLine: 'rgba(107,127,179,0.55)',
  rest: '#7A8F6A',
  warn: '#B89668',
  record: '#A35B5B',
  hairline: 'rgba(244,238,227,0.08)',
  hairlineStrong: 'rgba(244,238,227,0.16)',
};

const F = {
  display: "'Cormorant Garamond', 'EB Garamond', Georgia, serif",
  text: "'EB Garamond', 'Tiempos Text', Georgia, serif",
  sans: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, monospace",
};

// Small caps label
const Caps = ({ children, color = C.ivory400, size = 10, style = {}, ...rest }) => (
  <span style={{
    fontFamily: F.sans,
    fontSize: size,
    fontWeight: 500,
    letterSpacing: '0.22em',
    textTransform: 'uppercase',
    color,
    ...style,
  }} {...rest}>{children}</span>
);

// Italic display title
const Display = ({ children, size = 32, color = C.ivory200, style = {} }) => (
  <span style={{
    fontFamily: F.display,
    fontStyle: 'italic',
    fontWeight: 500,
    fontSize: size,
    letterSpacing: '-0.01em',
    lineHeight: 1.1,
    color,
    ...style,
  }}>{children}</span>
);

const Mono = ({ children, size = 12, color = C.ivory200, style = {} }) => (
  <span style={{
    fontFamily: F.mono,
    fontSize: size,
    fontVariantNumeric: 'tabular-nums',
    color,
    ...style,
  }}>{children}</span>
);

// Hairline divider
const Rule = ({ strong = false, style = {} }) => (
  <div style={{
    height: 1, width: '100%',
    background: strong ? C.hairlineStrong : C.hairline,
    ...style,
  }}/>
);

// Pill button
const Pill = ({ children, onClick, primary = false, accent = false, small = false, active = false, style = {}, ...rest }) => {
  const base = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    height: small ? 26 : 32,
    padding: small ? '0 10px' : '0 14px',
    fontFamily: F.sans,
    fontSize: small ? 9 : 10,
    fontWeight: 500,
    letterSpacing: '0.22em',
    textTransform: 'uppercase',
    borderRadius: 999,
    border: '1px solid ' + (active ? C.accentLine : C.hairlineStrong),
    background: primary ? C.ivory100 : (active ? C.accentSoft : 'transparent'),
    color: primary ? C.ink : (active ? C.ivory100 : C.ivory200),
    cursor: 'pointer',
    transition: 'all 150ms cubic-bezier(0.2,0.7,0.2,1)',
    whiteSpace: 'nowrap',
  };
  return <button onClick={onClick} style={{...base, ...style}} {...rest}>{children}</button>;
};

// Section header (small caps row)
const SectionHeader = ({ label, right }) => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 0',
    borderBottom: `1px solid ${C.hairline}`,
  }}>
    <Caps>{label}</Caps>
    {right}
  </div>
);

// Progress bar (thin)
const Progress = ({ value, max, color = C.accent, height = 1 }) => {
  const pct = Math.min(100, (value / Math.max(1, max)) * 100);
  return (
    <div style={{ position: 'relative', height, background: 'rgba(244,238,227,0.10)', borderRadius: 0.5 }}>
      <div style={{
        position: 'absolute', inset: 0, right: 'auto',
        width: `${pct}%`, background: color,
        boxShadow: pct > 0 ? `0 0 6px ${color}` : 'none',
        transition: 'width 360ms cubic-bezier(0.2,0.7,0.2,1)',
      }}/>
    </div>
  );
};

Object.assign(window, { C, F, Caps, Display, Mono, Rule, Pill, SectionHeader, Progress });
