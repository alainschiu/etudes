import React, { useState } from 'react';
import Search from 'lucide-react/dist/esm/icons/search';
import { MC, MF } from '../tokens.js';

export default function MobileNotesView({ freeNotes }) {
  const [openId, setOpenId] = useState(null);
  const [query, setQuery] = useState('');

  const notes = (freeNotes || []).slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const q = query.trim().toLowerCase();
  const filtered = q
    ? notes.filter(n =>
        (n.title || '').toLowerCase().includes(q) ||
        (n.body || '').toLowerCase().includes(q)
      )
    : notes;

  return (
    <div style={{ padding: '12px 24px 28px' }}>
      <span style={{ fontFamily: MF.sans, fontSize: 9, fontWeight: 500, letterSpacing: '0.22em', textTransform: 'uppercase', color: MC.ivory400 }}>
        Reference · {filtered.length} {filtered.length === 1 ? 'entry' : 'entries'}
      </span>
      <div style={{ marginTop: 6, marginBottom: 18 }}>
        <span style={{ fontFamily: MF.display, fontStyle: 'italic', fontWeight: 500, fontSize: 40, letterSpacing: '-0.01em', lineHeight: 1.1, color: MC.ivory200 }}>
          Notes
        </span>
      </div>

      {/* Search */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 0',
        borderTop: `1px solid ${MC.hairlineStrong}`,
        borderBottom: `1px solid ${MC.hairline}`,
      }}>
        <Search size={12} strokeWidth={1.4} style={{ color: MC.ivory400 }} />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search notes…"
          style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none',
            fontFamily: MF.text, fontStyle: 'italic', fontSize: 14,
            color: MC.ivory200,
          }}
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            style={{ background: 'transparent', border: 'none', color: MC.ivory400, cursor: 'pointer', padding: 0 }}
          >
            <span style={{ fontFamily: MF.sans, fontSize: 9, fontWeight: 500, letterSpacing: '0.22em', textTransform: 'uppercase' }}>Clear</span>
          </button>
        )}
      </div>

      {/* Notes list */}
      <div style={{ marginTop: 4 }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '32px 0', fontFamily: MF.text, fontStyle: 'italic', fontSize: 15, color: MC.ivory500 }}>
            {q ? 'No notes match your search.' : 'No notes yet.'}
          </div>
        ) : (
          filtered.map(n => {
            const isOpen = openId === n.id;
            return (
              <div key={n.id} style={{ padding: '18px 0', borderBottom: `1px solid ${MC.hairline}` }}>
                <div
                  onClick={() => setOpenId(isOpen ? null : n.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{
                        fontFamily: MF.display, fontStyle: 'italic', fontWeight: 500,
                        fontSize: 20, color: MC.ivory200,
                      }}>
                        {n.title || 'Untitled'}
                      </span>
                    </div>
                    <span style={{
                      fontFamily: MF.sans, fontSize: 9, fontWeight: 500,
                      letterSpacing: '0.22em', textTransform: 'uppercase',
                      color: MC.ivory500, flexShrink: 0,
                    }}>
                      {n.date}
                    </span>
                  </div>
                  {n.body && (
                    <div style={{
                      marginTop: 6, fontFamily: MF.text, fontSize: 14,
                      lineHeight: 1.6, color: MC.ivory300,
                      display: '-webkit-box',
                      WebkitLineClamp: isOpen ? 99 : 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}>
                      {n.body}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
      <div style={{ height: 24 }} />
    </div>
  );
}
