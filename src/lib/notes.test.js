import {describe, it, expect} from 'vitest';
import {resolveWikiLink} from './notes.js';

const items=[
  {id:'i1',title:'Practice Pieces',composer:'',collection:'',movement:''},
  {id:'i2',title:'Bach Partita No. 2',composer:'J.S. Bach',collection:'',movement:''},
  {id:'i3',title:'Suite',composer:'Debussy',collection:'Suite Bergamasque',movement:'I. Prélude'},
];
const programs=[
  {id:'p1',name:'Winter Recital'},
];
const notes=[
  {id:'n1',title:'Practice Plan'},
  {id:'n2',title:'Bach interpretation'},
  {id:'n3',title:'Memorization technique'},
];
const history=[{kind:'day',date:'2026-04-15'},{kind:'day',date:'2026-05-01'}];

describe('resolveWikiLink', () => {
  it('exact note title beats weak item word-overlap', () => {
    // "Practice Plan" shares "practice" with item "Practice Pieces" (score 1).
    // Exact note match scores 10. Note must win.
    const r=resolveWikiLink('Practice Plan',items,history,programs,notes);
    expect(r).toEqual({type:'note',target:'n1'});
  });

  it('exact item title still resolves to item', () => {
    const r=resolveWikiLink('Practice Pieces',items,history,programs,notes);
    expect(r).toEqual({type:'item',target:'i1'});
  });

  it('exact note title beats partial item match', () => {
    // "Bach interpretation" shares "bach" with item "Bach Partita..."
    // Note exact match scores 10, item word-overlap scores lower. Note wins.
    const r=resolveWikiLink('Bach interpretation',items,history,programs,notes);
    expect(r).toEqual({type:'note',target:'n2'});
  });

  it('date pattern resolves to day when history matches', () => {
    expect(resolveWikiLink('2026-04-15',items,history,programs,notes))
      .toEqual({type:'day',target:'2026-04-15'});
    expect(resolveWikiLink('2026-04-16',items,history,programs,notes)).toBeNull();
  });

  it('item-only match still works when no note matches', () => {
    const r=resolveWikiLink('Bach Partita',items,history,programs,notes);
    expect(r).toEqual({type:'item',target:'i2'});
  });

  it('program name resolves when no items or notes match', () => {
    const r=resolveWikiLink('Winter Recital',items,history,programs,notes);
    expect(r).toEqual({type:'program',target:'p1'});
  });

  it('returns null when nothing matches', () => {
    expect(resolveWikiLink('nonexistent',items,history,programs,notes)).toBeNull();
  });
});
