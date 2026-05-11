import {defaultUrlTransform} from 'react-markdown';

// Let our custom wikilink:// scheme survive react-markdown's default
// urlTransform (which would otherwise blank it, causing <a href=""> on
// click to reload the page).
export const wikiUrlTransform=(url,key,node)=>(
  url&&url.startsWith('wikilink://')?url:defaultUrlTransform(url,key,node)
);

export function preprocessWikiLinks(text){
  return (text||'').replace(/\[\[([^\]\n]+)\]\]/g,(_,inner)=>`[${inner}](wikilink://${encodeURIComponent(inner)})`);
}
