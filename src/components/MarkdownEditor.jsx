import React, { useMemo, useRef } from 'react';
import ReactCodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';
import { EditorView, ViewPlugin, Decoration } from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/state';
import { autocompletion } from '@codemirror/autocomplete';
import {
  TEXT, MUTED, FAINT, DIM, LINE, LINE_STR, IKB, SURFACE2, serif, LINK,
} from '../constants/theme.js';
import { displayTitle, formatByline } from '../lib/items.js';
import { slugify, scoreMatch } from '../lib/notes.js';

// ── Highlight style ──────────────────────────────────────────────────────────
// Maps lezer token tags → CSS properties; gives the "syntax-styled source"
// feel (bold text looks bold, headings appear larger, etc.)

const mdHighlight = HighlightStyle.define([
  { tag: tags.heading1, fontSize: '1.28em', fontWeight: '400', color: TEXT },
  { tag: tags.heading2, fontSize: '1.14em', fontWeight: '400', color: TEXT },
  { tag: tags.heading3, fontSize: '1.04em', fontWeight: '400', color: TEXT },
  { tag: tags.heading4, fontWeight: '400', color: TEXT },
  { tag: tags.heading5, fontWeight: '400', color: MUTED },
  { tag: tags.heading6, color: MUTED },
  // heading markers (#, ##, …) — dimmed so they recede
  { tag: tags.processingInstruction, color: FAINT, opacity: 0.55 },
  // emphasis — italic text, dimmed markers
  { tag: tags.emphasis, fontStyle: 'italic' },
  // strong — bold text, dimmed markers
  { tag: tags.strong, fontWeight: '600' },
  // links & URLs — bright blue readable on dark bg
  { tag: tags.url, color: LINK, textDecoration: 'underline' },
  { tag: tags.link, color: LINK },
  { tag: tags.string, color: LINK },  // link text [...]
  // inline code
  { tag: tags.monospace, fontFamily: 'monospace', fontSize: '0.88em' },
  // blockquote
  { tag: tags.quote, color: MUTED, fontStyle: 'italic' },
  // punctuation / formatting chars — dimmed
  { tag: tags.punctuation, color: FAINT, opacity: 0.7 },
  { tag: tags.contentSeparator, color: DIM },
]);

// ── Base editor theme ────────────────────────────────────────────────────────

function buildBaseTheme(fontSize, minHeight) {
  return EditorView.theme({
    // Reset defaults — prevents any injected theme from leaking through
    '&': { background: 'transparent', color: TEXT },
    '&.cm-editor': { background: 'transparent' },
    '.cm-scroller': { background: 'transparent' },
    '.cm-content': {
      fontFamily: serif,
      fontSize: fontSize,
      lineHeight: '1.75',
      fontWeight: '300',
      color: TEXT,
      padding: '12px 16px',
      minHeight: `${minHeight}px`,
      caretColor: TEXT,
    },
    '.cm-line': { color: TEXT },
    '&.cm-editor.cm-focused': { outline: 'none' },
    '&.cm-focused .cm-cursor': { borderLeftColor: TEXT, borderLeftWidth: '1.5px' },
    '.cm-cursor': { borderLeftColor: TEXT, borderLeftWidth: '1.5px' },
    '.cm-selectionBackground': { background: `${IKB}22 !important` },
    '&.cm-focused .cm-selectionBackground': { background: `${IKB}30 !important` },
    '.cm-activeLine': { background: 'transparent' },
    '.cm-gutters': { display: 'none' },
    '.cm-placeholder': {
      color: FAINT,
      fontStyle: 'italic',
      fontFamily: serif,
      fontSize: fontSize,
    },
    // ── [[wiki-link]] decoration ──
    '.cm-wikilink': {
      color: LINK,
      borderBottom: `1px solid ${LINK}55`,
      cursor: 'pointer',
    },
    '.cm-wikilink:hover': {
      borderBottomColor: LINK,
    },
    // ── Autocomplete dropdown ──
    '.cm-tooltip': {
      background: SURFACE2,
      border: `1px solid ${LINE_STR}`,
      fontFamily: serif,
    },
    '.cm-tooltip.cm-tooltip-autocomplete > ul > li': {
      color: TEXT,
      padding: '4px 12px',
      fontSize: '13px',
    },
    '.cm-tooltip.cm-tooltip-autocomplete > ul > li[aria-selected]': {
      background: `${IKB}28`,
      color: TEXT,
    },
    '.cm-completionLabel': { fontFamily: serif, fontWeight: 300 },
    '.cm-completionDetail': {
      color: MUTED,
      fontStyle: 'italic',
      marginLeft: '8px',
      fontSize: '11px',
    },
  });
}

// ── [[wiki-link]] decoration plugin ─────────────────────────────────────────

function createWikiLinkPlugin(clickRef) {
  return ViewPlugin.fromClass(
    class {
      constructor(view) { this.decorations = this._build(view); }
      update(u) {
        if (u.docChanged || u.viewportChanged) this.decorations = this._build(u.view);
      }
      _build(view) {
        const builder = new RangeSetBuilder();
        const text = view.state.doc.toString();
        const re = /\[\[([^\]\n]+)\]\]/g;
        let m;
        while ((m = re.exec(text)) !== null) {
          builder.add(m.index, m.index + m[0].length, Decoration.mark({ class: 'cm-wikilink' }));
        }
        return builder.finish();
      }
    },
    {
      decorations: (v) => v.decorations,
      eventHandlers: {
        mousedown: (e, view) => {
          // Ctrl/Cmd+click → open external markdown link or bare URL in new tab
          if (e.ctrlKey || e.metaKey) {
            const pos = view.posAtCoords({ x: e.clientX, y: e.clientY });
            if (pos != null) {
              const doc = view.state.doc.toString();
              let m;
              // [text](https://...) links
              const mdLinkRe = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g;
              while ((m = mdLinkRe.exec(doc)) !== null) {
                if (pos >= m.index && pos < m.index + m[0].length) {
                  window.open(m[2], '_blank', 'noopener,noreferrer');
                  e.preventDefault();
                  return true;
                }
              }
              // bare https?:// URLs
              const bareUrlRe = /https?:\/\/[^\s)\]>"',]+/g;
              while ((m = bareUrlRe.exec(doc)) !== null) {
                if (pos >= m.index && pos < m.index + m[0].length) {
                  // strip trailing punctuation that may be captured
                  const url = m[0].replace(/[.,;:!?]+$/, '');
                  window.open(url, '_blank', 'noopener,noreferrer');
                  e.preventDefault();
                  return true;
                }
              }
            }
          }
          // Wiki link click (no modifier needed)
          const wl = e.target?.closest?.('.cm-wikilink');
          if (wl && clickRef?.current) {
            const raw = (wl.textContent || '').replace(/^\[\[|\]\]$/g, '');
            clickRef.current(raw);
            e.preventDefault();
            return true;
          }
        },
        // pointerdown fires immediately on touch (no 300ms iOS delay) — handles wiki-link taps on mobile
        pointerdown: (e, view) => {
          if (e.pointerType === 'mouse') return; // already handled by mousedown
          const wl = e.target?.closest?.('.cm-wikilink');
          if (wl && clickRef?.current) {
            const raw = (wl.textContent || '').replace(/^\[\[|\]\]$/g, '');
            clickRef.current(raw);
            e.preventDefault();
            return true;
          }
        },
      },
    }
  );
}

// ── Wiki-link autocomplete source ────────────────────────────────────────────

function createWikiCompletion(itemsRef, historyRef) {
  return (ctx) => {
    const before = ctx.matchBefore(/\[\[[^\]]*$/);
    if (!before) return null;
    // Require at least 2 chars after [[ before auto-showing (explicit = Ctrl+Space)
    const query = before.text.slice(2);
    if (!ctx.explicit && query.length < 1) return null;

    const items = itemsRef.current || [];
    const history = historyRef.current || [];
    const options = [];

    items.forEach((i) => {
      const label = displayTitle(i);
      const sub = formatByline(i) || '';
      options.push({ label, detail: sub, apply: `[[${label}]]`, boost: 1 });
      (i.spots || []).forEach((s) => {
        options.push({ label: `${label} #${s.label}`, detail: 'spot', apply: `[[${label} #${s.label}]]` });
      });
    });

    [...history]
      .filter((h) => !h.kind || h.kind === 'day')
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 20)
      .forEach((h) => {
        options.push({ label: h.date, detail: 'day', apply: `[[${h.date}]]` });
      });

    let filtered = options;
    if (query) {
      const qSlug = slugify(query);
      filtered = options
        .map((o) => ({ ...o, _score: scoreMatch(qSlug, slugify(o.label)) }))
        .filter((o) => o._score > 0)
        .sort((a, b) => b._score - a._score);
    }

    if (!filtered.length) return null;
    return { from: before.from, options: filtered.slice(0, 25) };
  };
}

// ── Public component ─────────────────────────────────────────────────────────

/**
 * WYSIWYG-style Markdown editor (CodeMirror 6).
 * - Markdown syntax highlighted inline (headings larger, bold heavier, etc.)
 * - [[wiki-links]] rendered in IKB blue with underline; click triggers onWikiLinkClick
 * - [[ autocomplete driven by items + history props
 * - For read-only display use ReactMarkdown directly (in MarkdownField)
 */
export function MarkdownEditor({
  value = '',
  onChange,
  placeholder,
  minHeight = 80,
  fontSize = '15px',
  readOnly = false,
  // Wiki-link props (optional — omit to disable autocomplete/click)
  items,
  history,
  onWikiLinkClick,
}) {
  const clickRef = useRef(onWikiLinkClick);
  const itemsRef = useRef(items);
  const historyRef = useRef(history);
  // Keep refs fresh on every render without recreating extensions
  clickRef.current = onWikiLinkClick;
  itemsRef.current = items;
  historyRef.current = history;

  const extensions = useMemo(() => {
    const exts = [
      markdown(),
      syntaxHighlighting(mdHighlight),
      EditorView.lineWrapping,
      buildBaseTheme(fontSize, minHeight),
      createWikiLinkPlugin(clickRef),
      autocompletion({ override: [createWikiCompletion(itemsRef, historyRef)] }),
    ];
    return exts;
  // Recreate only when layout hints change; all callbacks via refs
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fontSize, minHeight]);

  return (
    <ReactCodeMirror
      value={value}
      onChange={onChange}
      extensions={extensions}
      readOnly={readOnly}
      placeholder={placeholder}
      theme="none"
      basicSetup={{
        lineNumbers: false,
        foldGutter: false,
        dropCursor: false,
        allowMultipleSelections: false,
        indentOnInput: false,
        bracketMatching: false,
        closeBrackets: false,
        rectangularSelection: false,
        crosshairCursor: false,
        highlightActiveLine: false,
        highlightActiveLineGutter: false,
        highlightSpecialChars: true,
        history: true,
        drawSelection: true,
        syntaxHighlighting: false,
      }}
    />
  );
}
