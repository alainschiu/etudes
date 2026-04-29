// Logs + Notes screens

function LogsScreen({ density }) {
  const padX = density === 'compact' ? 20 : 24;
  return (
    <div style={{ padding: `12px ${padX}px 28px` }}>
      <Caps size={9}>April · Week 17</Caps>
      <div style={{ marginTop: 6, marginBottom: 14 }}>
        <Display size={40}>Logs</Display>
      </div>

      {/* Streak summary */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        padding: '14px 0',
        borderTop: `1px solid ${C.hairlineStrong}`,
        borderBottom: `1px solid ${C.hairline}`,
      }}>
        <div>
          <Caps size={9}>Streak</Caps>
          <div style={{ marginTop: 4 }}><Mono size={18} color={C.ivory100}>9 days</Mono></div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <Caps size={9}>This week</Caps>
          <div style={{ marginTop: 4 }}><Mono size={18} color={C.ivory100}>535′</Mono></div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <Caps size={9}>Avg / day</Caps>
          <div style={{ marginTop: 4 }}><Mono size={18} color={C.ivory100}>89′</Mono></div>
        </div>
      </div>

      {/* Day list */}
      <div style={{ marginTop: 8 }}>
        {LOGS.map((d,i) => (
          <div key={i} style={{ padding: '18px 0', borderBottom: `1px solid ${C.hairline}` }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <Caps size={10} color={d.rest ? C.rest : C.ivory300}>{d.date}</Caps>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                {d.rest ? (
                  <Mono size={11} color={C.rest}>Rest</Mono>
                ) : (
                  <>
                    <Mono size={13} color={d.total >= d.target ? C.ivory100 : C.ivory300}>
                      {d.total}′
                    </Mono>
                    <Mono size={9} color={C.ivory500}>/ {d.target}′</Mono>
                  </>
                )}
              </div>
            </div>
            {/* mini section bar */}
            {d.sections.length > 0 && (
              <div style={{ display: 'flex', gap: 1, marginTop: 8, height: 2 }}>
                {d.sections.map(([name, mins], j) => (
                  <div
                    key={j}
                    title={`${name} ${mins}′`}
                    style={{
                      flex: mins,
                      background: j === 0 ? C.ivory400 : j === 1 ? C.accent : C.warn,
                      opacity: 0.85,
                    }}
                  />
                ))}
                <div style={{ flex: Math.max(0, d.target - d.total), background: C.hairline }}/>
              </div>
            )}
            {d.reflection && (
              <div style={{
                marginTop: 10,
                fontFamily: F.text, fontStyle: 'italic', fontSize: 13,
                lineHeight: 1.6, color: C.ivory300,
                textWrap: 'pretty',
              }}>
                {d.reflection}
              </div>
            )}
          </div>
        ))}
      </div>
      <div style={{ height: 24 }}/>
    </div>
  );
}

function NotesScreen({ density }) {
  const [openId, setOpenId] = React.useState(null);
  const padX = density === 'compact' ? 20 : 24;
  return (
    <div style={{ padding: `12px ${padX}px 28px` }}>
      <Caps size={9}>Reference · {NOTES.length} entries</Caps>
      <div style={{ marginTop: 6, marginBottom: 18 }}>
        <Display size={40}>Notes</Display>
      </div>

      {/* Search */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 0',
        borderTop: `1px solid ${C.hairlineStrong}`,
        borderBottom: `1px solid ${C.hairline}`,
      }}>
        <Search size={12} strokeWidth={1.4} style={{ color: C.ivory400 }}/>
        <span style={{ fontFamily: F.text, fontStyle: 'italic', fontSize: 14, color: C.ivory500 }}>
          Search notes…
        </span>
      </div>

      {/* Notes */}
      <div style={{ marginTop: 4 }}>
        {NOTES.map(n => {
          const isOpen = openId === n.id;
          return (
            <div key={n.id} style={{ padding: '18px 0', borderBottom: `1px solid ${C.hairline}` }}>
              <div onClick={() => setOpenId(isOpen ? null : n.id)} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Display size={20}>{n.title}</Display>
                  </div>
                  <Caps size={9} color={C.ivory500}>{n.date}</Caps>
                </div>
                <div style={{
                  marginTop: 6,
                  fontFamily: F.text,
                  fontSize: 14,
                  lineHeight: 1.6,
                  color: C.ivory300,
                  textWrap: 'pretty',
                  display: '-webkit-box',
                  WebkitLineClamp: isOpen ? 99 : 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}>
                  {n.body}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ height: 24 }}/>
    </div>
  );
}

Object.assign(window, { LogsScreen, NotesScreen });
