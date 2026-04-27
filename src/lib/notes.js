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
  if(querySlug===candidateSlug)return 3;
  const words=querySlug.split(' ').filter(Boolean);
  if(words.length>0&&words.every(w=>candidateSlug.includes(w)))return 2;
  if(words.some(w=>w.length>2&&candidateSlug.includes(w)))return 1;
  return 0;
}

// ── Wiki-link resolution ───────────────────────────────────────────────────

// Returns {type, target} or null.
// type: 'day' | 'item' | 'spot'
// target for 'day': date string
// target for 'item': item id
// target for 'spot': {itemId, spotId}
export function resolveWikiLink(rawText, items, history){
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
