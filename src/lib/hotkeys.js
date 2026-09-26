// Decides when single-key shortcuts (Space, N, D, M, …) must stay quiet.
//
// The bug this guards (Beta-Bug-UI-Log, 15 Jul, reproduced 16 Aug): a click that lands *near* a
// field rather than in it leaves focus on the page, so the next sentence typed is read as shortcuts.
// Space silently starts a practice timer, which corrupts practice time.
//
// Two checks, both pure so they test without a DOM:
// - isTypingTarget: the keystroke's own target is something that takes keys.
// - isNearEditable: the last pointerdown landed in or right beside a text field.

const NON_TEXT_INPUTS=new Set(['checkbox','radio','range','button','submit','reset','file','color','hidden','image']);

function contentEditableAttr(el){
  if(el.isContentEditable===true)return true;
  const v=typeof el.getAttribute==='function'?el.getAttribute('contenteditable'):null;
  return v==='true'||v===''||v==='plaintext-only';
}

// Anything that consumes keystrokes when focused. Broad on purpose: a focused checkbox takes Space.
export function isTypingTarget(el){
  if(!el||!el.tagName)return false;
  const tag=el.tagName;
  if(tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT')return true;
  return contentEditableAttr(el);
}

// A field a person would type into. Narrower: checkboxes and buttons are not "near a field".
export function isTextEditable(el){
  if(!el||!el.tagName||el.disabled)return false;
  const tag=el.tagName;
  if(tag==='TEXTAREA'||tag==='SELECT')return true;
  if(tag==='INPUT')return !NON_TEXT_INPUTS.has(String(el.type||'text').toLowerCase());
  return contentEditableAttr(el);
}

function hasEditableWithin(node,depth){
  if(depth<=0||!node||!node.children)return false;
  for(const c of node.children){
    if(isTextEditable(c))return true;
    if(hasEditableWithin(c,depth-1))return true;
  }
  return false;
}

// True when `el` is inside a text field, or when it or its parent holds a text field within
// `depth` levels. Both limits are deliberate: a large page container always holds *some*
// field far down, and counting that would switch shortcuts off everywhere.
export function isNearEditable(el,{levels=2,depth=3}={}){
  if(!el)return false;
  for(let n=el;n;n=n.parentElement)if(isTextEditable(n))return true;
  let node=el;
  for(let i=0;i<levels&&node;i++,node=node.parentElement){
    if(hasEditableWithin(node,depth))return true;
  }
  return false;
}

// Decides at key-time whether the last press still holds shortcuts off. A press counts only if it
// was beside a field *when it happened* AND still is now:
// - a click that expands something and reveals fields beside it (a collapsed piece opening) was not
//   near a field when made, so Space still starts the piece (the everyday path);
// - clicking into the time editor then pressing Enter closes the field; the press no longer has a
//   field beside it, so shortcuts return without another click.
// `press` is {el, near} recorded at pointerdown, with near = isNearEditable(el) at that moment.
export function pressHoldsShortcuts(press){
  if(!press||!press.near||!press.el)return false;
  if(press.el.isConnected===false)return false;
  return isNearEditable(press.el);
}
