// Today screen — primary view
// Shows: date eyebrow, "Today" display, target progress, accordion sections

function TargetRow({ done, total }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '14px 0',
      borderTop: `1px solid ${C.hairlineStrong}`,
      borderBottom: `1px solid ${C.hairline}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <Target size={12} strokeWidth={1.4} style={{ color: C.accent }}/>
        <Caps size={9}>Target</Caps>
      </div>
      <div style={{ flex: 1 }}>
        <Progress value={done} max={total}/>
      </div>
      <Mono size={11} color={C.ivory200} style={{ flexShrink: 0 }}>
        {done} / {total}′
      </Mono>
    </div>
  );
}

function ItemRow({ item, active, onClick }) {
  return (
    <div
      data-screen-label="item-row"
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 12,
        padding: '14px 0',
        borderBottom: `1px solid ${C.hairline}`,
        cursor: 'pointer',
        position: 'relative',
      }}
    >
      {/* Play indicator */}
      <div style={{
        marginTop: 3,
        width: 18, height: 18,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
        color: active ? C.accent : C.ivory400,
      }}>
        {active ? (
          <span className="pulse" style={{
            width: 8, height: 8, borderRadius: 999, background: C.accent,
            boxShadow: `0 0 8px ${C.accent}`,
          }}/>
        ) : (
          <Play size={11} strokeWidth={1.4}/>
        )}
      </div>

      {/* Title + meta */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: F.display,
          fontStyle: 'italic',
          fontSize: 17,
          color: active ? C.ivory100 : C.ivory200,
          lineHeight: 1.25,
        }}>
          {item.title}
        </div>
        {item.subtitle && (
          <div style={{
            fontFamily: F.text,
            fontSize: 12,
            color: C.ivory400,
            marginTop: 2,
            fontStyle: 'italic',
          }}>
            {item.subtitle}
          </div>
        )}
        {(item.spots > 0 || item.perfDays != null) && (
          <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
            {item.spots > 0 && (
              <Caps size={9} color={C.ivory500}>
                {item.spots} spot{item.spots > 1 ? 's' : ''}
              </Caps>
            )}
            {item.perfDays != null && (
              <Caps size={9} color={C.warn}>
                · {item.perfDays}d to perf.
              </Caps>
            )}
          </div>
        )}
      </div>

      {/* Time */}
      <div style={{ textAlign: 'right', flexShrink: 0, paddingTop: 2 }}>
        <Mono size={12} color={item.time > 0 ? C.ivory100 : C.ivory500}>
          {fmt(item.time)}
        </Mono>
        {item.target && (
          <div style={{ marginTop: 2 }}>
            <Mono size={9} color={C.ivory500}>/ {item.target}′</Mono>
          </div>
        )}
      </div>
    </div>
  );
}

function SectionAccordion({ section, openId, setOpenId, activeItemId, onItemClick }) {
  const isOpen = openId === section.id;
  const sectionTime = section.items.reduce((a, i) => a + i.time, 0);
  const hasItems = section.items.length > 0;

  return (
    <div>
      <div
        onClick={() => setOpenId(isOpen ? null : section.id)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 0',
          borderBottom: `1px solid ${isOpen ? C.hairlineStrong : C.hairline}`,
          cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ChevronRight
            size={11} strokeWidth={1.4}
            style={{
              color: C.ivory500,
              transform: isOpen ? 'rotate(90deg)' : 'rotate(0)',
              transition: 'transform 200ms cubic-bezier(0.2,0.7,0.2,1)',
            }}
          />
          <Caps size={10}>{section.label}</Caps>
          {!isOpen && hasItems && (
            <Caps size={9} color={C.ivory500}>· {section.items.length}</Caps>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <Mono size={11} color={sectionTime > 0 ? C.ivory200 : C.ivory500}>
            {fmtMin(sectionTime)}
          </Mono>
          {section.target && (
            <Mono size={9} color={C.ivory500}>/ {section.target}′</Mono>
          )}
        </div>
      </div>
      {isOpen && (
        <div style={{ animation: 'etudes-rise-fade 240ms cubic-bezier(0.2,0.7,0.2,1)' }}>
          {hasItems ? (
            section.items.map(item => (
              <ItemRow
                key={item.id}
                item={item}
                active={activeItemId === item.id}
                onClick={() => onItemClick(item)}
              />
            ))
          ) : (
            <div style={{
              padding: '20px 0',
              borderBottom: `1px solid ${C.hairline}`,
              fontFamily: F.text,
              fontStyle: 'italic',
              fontSize: 13,
              color: C.ivory500,
            }}>
              Add an item to Repertoire to begin.
            </div>
          )}
          {/* Quick add */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 0',
              borderBottom: `1px solid ${C.hairline}`,
              color: C.ivory500,
              cursor: 'pointer',
            }}
          >
            <Plus size={11} strokeWidth={1.4}/>
            <Caps size={9} color={C.ivory500}>Add to {section.label}</Caps>
          </div>
        </div>
      )}
    </div>
  );
}

function ReflectionBlock() {
  const [open, setOpen] = React.useState(false);
  const [text, setText] = React.useState('');
  const hasText = text.trim().length > 0;
  return (
    <div style={{ marginTop: 16, borderTop: `1px solid ${C.hairline}` }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 0',
          cursor: 'pointer',
          borderBottom: `1px solid ${open ? C.hairlineStrong : C.hairline}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ChevronRight
            size={11} strokeWidth={1.4}
            style={{
              color: C.ivory500,
              transform: open ? 'rotate(90deg)' : 'rotate(0)',
              transition: 'transform 200ms cubic-bezier(0.2,0.7,0.2,1)',
            }}
          />
          <Caps size={10}>Reflection</Caps>
          <span style={{ fontFamily: F.display, fontStyle: 'italic', fontSize: 14, color: C.ivory300 }}>
            Journal du jour
          </span>
        </div>
        <Caps size={9} color={hasText ? C.accent : C.ivory500}>
          {hasText ? 'Saved' : 'Empty'}
        </Caps>
      </div>
      {open && (
        <div style={{ padding: '14px 0 4px', animation: 'etudes-rise-fade 220ms cubic-bezier(0.2,0.7,0.2,1)' }}>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="How did today feel? What surprised you?"
            style={{
              width: '100%',
              background: C.ink100,
              border: `1px solid ${C.hairline}`,
              padding: '14px 16px',
              minHeight: 100,
              fontFamily: F.text,
              fontStyle: 'italic',
              fontSize: 14,
              lineHeight: 1.7,
              color: C.ivory200,
              outline: 'none',
              resize: 'vertical',
              boxSizing: 'border-box',
            }}
          />
        </div>
      )}
    </div>
  );
}

function TodayScreen({ activeItemId, onItemClick, onNavigate, density }) {
  const [openId, setOpenId] = React.useState('pieces');
  const today = new Date(2026, 3, 24); // Friday Apr 24 — matches reference
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long' }) + ' · '
    + today.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

  const totalDone = SECTIONS.reduce((a, s) => a + s.items.reduce((b, i) => b + i.time, 0), 0);
  const totalTarget = 90;
  const totalDoneMin = Math.floor(totalDone / 60);

  const padX = density === 'compact' ? 20 : 24;

  return (
    <div style={{ padding: `12px ${padX}px 28px` }}>
      {/* Eyebrow */}
      <Caps size={9} color={C.ivory400}>{dateStr.toUpperCase()}</Caps>

      {/* Title */}
      <div style={{ marginTop: 6, marginBottom: 10, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <Display size={44}>Today</Display>
        <span
          onClick={() => {/* load routine */}}
          style={{
            fontFamily: F.display, fontStyle: 'italic', fontSize: 13,
            color: C.ivory400,
            borderBottom: `1px solid ${C.hairlineStrong}`,
            paddingBottom: 2, display: 'inline-flex', alignItems: 'center', gap: 4,
          }}
        >
          <Bookmark size={11} strokeWidth={1.4}/>
          Load routine
          <ChevronDown size={10} strokeWidth={1.4}/>
        </span>
      </div>

      {/* Target */}
      <TargetRow done={totalDoneMin} total={totalTarget}/>

      {/* Sections */}
      <div style={{ marginTop: 8 }}>
        {SECTIONS.map(s => (
          <SectionAccordion
            key={s.id}
            section={s}
            openId={openId}
            setOpenId={setOpenId}
            activeItemId={activeItemId}
            onItemClick={onItemClick}
          />
        ))}
      </div>

      {/* Close the day */}
      <div style={{ display: 'flex', justifyContent: 'center', margin: '32px 0 24px' }}>
        <Pill>
          <Lock size={10} strokeWidth={1.4}/> Close the day
        </Pill>
      </div>

      {/* Reflection — collapsible */}
      <ReflectionBlock/>

      {/* Bottom padding so footer doesn't crash content */}
      <div style={{ height: 24 }}/>
    </div>
  );
}

Object.assign(window, { TodayScreen });
