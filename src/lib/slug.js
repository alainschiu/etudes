export function toSlug(str){
  return (str||'')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g,'')
    .trim()
    .replace(/\s+/g,'-')
    .slice(0,48);
}

// Returns a slug that doesn't collide with any key in the usedSlugs Set.
// Mutates usedSlugs by adding the returned slug.
export function uniqueSlug(str,usedSlugs){
  const base=toSlug(str)||'untitled';
  let candidate=base;
  let n=2;
  while(usedSlugs.has(candidate)){
    candidate=`${base}_${n}`;
    n++;
  }
  usedSlugs.add(candidate);
  return candidate;
}
