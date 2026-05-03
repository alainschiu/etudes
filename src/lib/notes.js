import {displayTitle} from './items.js';

// ── Slug / fuzzy matching ──────────────────────────────────────────────────

export function slugify(s){
  return (s||'').toLowerCase()
    .replace(/[^a-z0-9\s]/g,'')
    .replace(/\s+/g,' ')
    .trim();
}

export function scoreMatch(querySlug,candidateSlug){
  if(!querySlug||!candidateSlug)return 0;
  if(querySlug===candidateSlug)return 10;
  // Prefix match on full string
  if(candidateSlug.startsWith(querySlug))return 8;
  const words=querySlug.split(' ').filter(Boolean);
  const candWords=candidateSlug.split(' ').filter(Boolean);
  // Every query word matches the start of some candidate word (word-prefix)
  if(words.every(qw=>candWords.some(cw=>cw.startsWith(qw))))return 6;
  // Every query word appears somewhere in candidate
  if(words.every(w=>candidateSlug.includes(w)))return 4;
  // At least one query word (even 1-char) starts a candidate word
  if(words.some(w=>candWords.some(cw=>cw.startsWith(w))))return 2;
  // At least one query word (>1 char) appears anywhere
  if(words.some(w=>w.length>1&&candidateSlug.includes(w)))return 1;
  return 0;
}

// ── Wiki-link resolution ───────────────────────────────────────────────────

// Returns {type, target} or null.
// type: 'day' | 'item' | 'spot' | 'program' | 'note'
// target for 'day': date string
// target for 'item': item id
// target for 'spot': {itemId, spotId}
// target for 'program': program id
// target for 'note': note id
export function resolveWikiLink(rawText, items, history, programs, notes){
  const text=(rawText||'').trim();

  // Date pattern: YYYY-MM-DD
  if(/^\d{4}-\d{2}-\d{2}$/.test(text)){
    const exists=Array.isArray(history)&&history.some(h=>(h.kind==='day'||!h.kind)&&h.date===text);
    return exists?{type:'day',target:text}:null;
  }

  // Spot pattern: text #SpotName
  const spotMatch=text.match(/^(.+?)\s+#(.+)$/);
  if(spotMatch){
    const pieceQuery=slugify(spotMatch[1]);
    const spotQuery=slugify(spotMatch[2]);
    let bestItem=null;let bestScore=0;
    for(const item of(items||[])){
      const candidates=[
        item.title,
        item.collection&&item.movement?`${item.collection} ${item.movement}`:null,
        item.composer?`${item.composer} ${item.title}`:null,
      ].filter(Boolean);
      const score=Math.max(...candidates.map(c=>scoreMatch(pieceQuery,slugify(c))));
      if(score>bestScore){bestScore=score;bestItem=item;}
    }
    if(bestScore>=1&&bestItem){
      const spotSlug=spotQuery;
      let bestSpot=null;let bestSpotScore=0;
      for(const spot of(bestItem.spots||[])){
        const sc=scoreMatch(spotSlug,slugify(spot.label));
        if(sc>bestSpotScore){bestSpotScore=sc;bestSpot=spot;}
      }
      if(bestSpotScore>=1&&bestSpot)return {type:'spot',target:{itemId:bestItem.id,spotId:bestSpot.id}};
      if(bestSpot)return {type:'spot',target:{itemId:bestItem.id,spotId:bestSpot.id}};
    }
    return null;
  }

  // Item / piece lookup
  const query=slugify(text);
  let bestItem=null;let bestScore=0;
  for(const item of(items||[])){
    const candidates=[
      item.title,
      item.collection&&item.movement?`${item.collection} ${item.movement}`:null,
      item.composer?`${item.composer} ${item.title}`:null,
      item.composer&&item.collection?`${item.composer} ${item.collection}`:null,
    ].filter(Boolean);
    const score=Math.max(...candidates.map(c=>scoreMatch(query,slugify(c))));
    if(score>bestScore){bestScore=score;bestItem=item;}
  }
  if(bestScore>=1&&bestItem)return {type:'item',target:bestItem.id};

  // Program name lookup
  if(Array.isArray(programs)&&programs.length>0){
    let bestProg=null;let bestProgScore=0;
    for(const prog of programs){
      const sc=scoreMatch(query,slugify(prog.name||''));
      if(sc>bestProgScore){bestProgScore=sc;bestProg=prog;}
    }
    if(bestProgScore>=2&&bestProg)return {type:'program',target:bestProg.id};
  }

  // Note title lookup
  if(Array.isArray(notes)&&notes.length>0){
    let bestNote=null;let bestNoteScore=0;
    for(const note of notes){
      const sc=scoreMatch(query,slugify(note.title||''));
      if(sc>bestNoteScore){bestNoteScore=sc;bestNote=note;}
    }
    if(bestNoteScore>=2&&bestNote)return {type:'note',target:bestNote.id};
  }

  return null;
}

// ── Tag parsing ────────────────────────────────────────────────────────────

export function parseTagsFromBody(body){
  const matches=(body||'').match(/(?<!\w)#(\w+)/g)||[];
  return [...new Set(matches.map(t=>t.slice(1)))];
}

// ── Composite daily reflection builder ────────────────────────────────────

export function buildCompositeDailyReflection(dailyReflection, items){
  const parts=[];
  if((dailyReflection||'').trim())parts.push(dailyReflection.trim());

  const itemParts=[];
  for(const item of(items||[])){
    if(item.todayNote&&item.todayNote.trim()){
      const title=displayTitle(item);
      itemParts.push(`### ${title}\n${item.todayNote.trim()}`);
    }
  }

  if(itemParts.length>0){
    if(parts.length>0)parts.push('---');
    parts.push(...itemParts);
  }

  return parts.join('\n\n');
}
