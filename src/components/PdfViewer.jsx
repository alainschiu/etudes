import React,{useState,useEffect,useRef,useCallback,useImperativeHandle,forwardRef} from 'react';
import {createPortal} from 'react-dom';
import {Document,Page} from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import ChevronLeft from 'lucide-react/dist/esm/icons/chevron-left';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';
import ZoomIn from 'lucide-react/dist/esm/icons/zoom-in';
import ZoomOut from 'lucide-react/dist/esm/icons/zoom-out';
import Maximize2 from 'lucide-react/dist/esm/icons/maximize-2';
import BookMarked from 'lucide-react/dist/esm/icons/book-marked';
import AlignJustify from 'lucide-react/dist/esm/icons/align-justify';
import List from 'lucide-react/dist/esm/icons/list';
import Columns2 from 'lucide-react/dist/esm/icons/columns-2';
import ArrowLeftRight from 'lucide-react/dist/esm/icons/arrow-left-right';
import FileText from 'lucide-react/dist/esm/icons/file-text';
import Plus from 'lucide-react/dist/esm/icons/plus';
import X from 'lucide-react/dist/esm/icons/x';
import useViewport from '../hooks/useViewport.js';
import useKeyboardInset from '../hooks/useKeyboardInset.js';
import {BG,TEXT,MUTED,FAINT,LINE,LINE_MED,IKB,IKB_SOFT,serif,sans,mono} from '../constants/theme.js';
import {MarkdownField} from './shared.jsx';

const BTN_BASE={cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',width:'28px',height:'28px',flexShrink:0,background:'transparent',border:`1px solid ${LINE_MED}`,color:TEXT};
const BTN_ACT={...BTN_BASE,background:IKB,border:`1px solid ${IKB}`,color:'#fff'};
const SEP=()=><div style={{width:1,background:LINE_MED,height:18,margin:'0 4px',flexShrink:0}}/>;

// Portal tooltip — renders into document.body so it's never clipped by overflow
function Tip({targetRef,label,visible}){
  const [pos,setPos]=useState({x:0,y:0});
  useEffect(()=>{
    if(!visible||!targetRef.current)return;
    const r=targetRef.current.getBoundingClientRect();
    setPos({x:Math.round(r.left+r.width/2),y:Math.round(r.bottom+4)});
  },[visible,targetRef]);
  if(!visible||!label)return null;
  return createPortal(
    <div style={{position:'fixed',top:pos.y,left:pos.x,transform:'translateX(-50%)',zIndex:99999,
      pointerEvents:'none',padding:'3px 8px',background:'#141412',border:`1px solid ${LINE_MED}`,
      color:MUTED,fontSize:'10px',fontFamily:sans,letterSpacing:'0.1em',whiteSpace:'nowrap'}}>
      {label}
    </div>,
    document.body
  );
}

// Toolbar button with portal tooltip
function TBtn({active,disabled,onClick,children,label,extra,btnRef:extRef}){
  const innerRef=useRef(null);
  const ref=extRef||innerRef;
  const [hov,setHov]=useState(false);
  return(
    <>
      <button
        ref={ref}
        onClick={onClick}
        disabled={disabled}
        onMouseEnter={()=>setHov(true)}
        onMouseLeave={()=>setHov(false)}
        style={{...(active?BTN_ACT:BTN_BASE),...(disabled?{opacity:0.35,cursor:'default'}:{}),...(extra||{})}}>
        {children}
      </button>
      <Tip targetRef={ref} label={label} visible={hov}/>
    </>
  );
}

// F6/C8: dual-mount page swap, the hidden-render utility. The outgoing page stays
// mounted and visible until the incoming one's onRenderSuccess fires (no white
// flash), and the likely-next page is kept pre-rendered hidden the rest of the
// time so a forward turn swaps instantly. One utility, reused for single mode's
// page and each pane of spread mode; v0.98.9's continuous virtualization widens
// the same window logic rather than rebuilding this.
// P6: widened (not rewritten) for continuous-mode virtualization — `active`
// lets a slot outside the render window collapse to a sized placeholder
// (scroll geometry stays stable) instead of mounting react-pdf's <Page>, and
// the text/annotation layer flags let continuous mode keep them off for perf,
// same as before. Defaults preserve single/spread mode's existing behavior.
function FlashFreePage({pageNumber,adjacentPage,minPage=1,maxPage=null,width,height,active=true,onLoadSuccess,renderTextLayer=true,renderAnnotationLayer=true}){
  const inRange=(p)=>p!=null&&p>=minPage&&(maxPage==null||p<=maxPage);
  const [visible,setVisible]=useState(pageNumber);
  const [shadowPage,setShadowPage]=useState(inRange(adjacentPage)?adjacentPage:null);
  const shadowReadyRef=useRef({});

  useEffect(()=>{
    if(pageNumber===visible){
      const nextShadow=inRange(adjacentPage)?adjacentPage:null;
      setShadowPage(prev=>prev===nextShadow?prev:nextShadow);
      return;
    }
    if(shadowPage===pageNumber&&shadowReadyRef.current[pageNumber]){
      setVisible(pageNumber);
      setShadowPage(inRange(adjacentPage)?adjacentPage:null);
    }else{
      setShadowPage(pageNumber);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[pageNumber,adjacentPage]);

  if(!active){
    return <div style={{width,height,flexShrink:0}} aria-hidden="true"/>;
  }

  return (
    <>
      <Page pageNumber={visible} width={width} onLoadSuccess={onLoadSuccess} renderTextLayer={renderTextLayer} renderAnnotationLayer={renderAnnotationLayer}/>
      {shadowPage!=null&&shadowPage!==visible&&(
        <div style={{position:'absolute',inset:0,opacity:0,pointerEvents:'none'}} aria-hidden="true">
          <Page pageNumber={shadowPage} width={width} renderTextLayer={false} renderAnnotationLayer={false}
            onRenderSuccess={()=>{
              shadowReadyRef.current[shadowPage]=true;
              if(shadowPage===pageNumber){
                setVisible(shadowPage);
                setShadowPage(inRange(adjacentPage)?adjacentPage:null);
              }
            }}/>
        </div>
      )}
    </>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// PdfViewer
// Exposed via ref: { jumpToPage(n) }
// Props:
//   url             – blob URL string
//   startPage       – first page of range (1-based, optional)
//   endPage         – last page of range (1-based, optional)
//   bookmarks       – [{id, name, page}] for the active attachment
//   onPageChange(n) – fires when visible page changes
//   onAddBookmark(name, page) – called when user adds a bookmark from the popover
//   onBookmarkClick – optional override; if not provided, a built-in popover is shown
// ──────────────────────────────────────────────────────────────────────────────
// F3: bounded retry window for a pending jump that arrives before the target
// page is mounted (cold load, large PDF, or a fresh attachment still loading).
// ~20 attempts at 150ms — generous without hanging around forever.
const PENDING_JUMP_RETRY_MS=150;
const PENDING_JUMP_MAX_ATTEMPTS=20;

// P6: continuous mode only fully renders pages within this radius of the
// current (topmost-visible) page; the rest collapse to sized placeholders.
const CONTINUOUS_WINDOW=2;

// P8: container-gating — spread mode is offered when the viewer's OWN container
// is wide enough, not based on useViewport's device-class isMobile flag. An
// iPad in portrait qualifies; an iPhone never does; desktop is unaffected.
const CONTAINER_SPREAD_MIN=700;

// P8: pure so both normal navigation (memoized on the current seamOffset) and
// the seam-toggle button (which must resnap using the NEXT offset, before the
// state update re-renders) share one definition. Offset 0 pairs (1,2),(3,4)…;
// offset 1 leaves page 1 alone (a cover) and pairs (2,3),(4,5)….
function computePairLeft(p,offset){
  if(offset===0)return p%2===1?p:p-1;
  if(p<=1)return 1;
  return p%2===0?p:p-1;
}

// P3: reading prefs are global (one player, one reading habit), not per-attachment.
const PDF_PREFS_KEY='etudes-pdfPrefs';
function loadPdfPrefs(){
  try{
    const p=JSON.parse(localStorage.getItem(PDF_PREFS_KEY));
    return p&&typeof p==='object'?p:{};
  }catch{return{};}
}

const PdfViewer=forwardRef(function PdfViewer({
  url,startPage=1,endPage=null,bookmarks=[],
  onPageChange,onAddBookmark,dragging=false,
  pendingPage=null,onPendingPageHandled,
  onWikiLinkClick,completionData,
  fullscreenElement=null,
},ref){
  const {isMobile}=useViewport();
  const kbInset=useKeyboardInset(); // F5 fix: keyboard covered the bookmark popover's add-form/note editor
  const [numPages,setNumPages]=useState(null);
  const [currentPage,setCurrentPage]=useState(startPage||1);
  const [zoom,setZoom]=useState(()=>{
    const v=loadPdfPrefs().zoom;
    return typeof v==='number'&&v>0?v:1.0;
  });
  const [mode,setMode]=useState(()=>{ // 'single' | 'spread' | 'continuous'
    const v=loadPdfPrefs().mode;
    return v==='single'||v==='spread'||v==='continuous'?v:'single';
  });
  const [fitMode,setFitMode]=useState(()=>{ // 'width' | 'page'
    const v=loadPdfPrefs().fitMode;
    return v==='width'||v==='page'?v:'width';
  });
  const [seamOffset,setSeamOffset]=useState(()=>{ // P8: 0 | 1 — shifts spread pairing by one page
    const v=loadPdfPrefs().seamOffset;
    return v===1?1:0;
  });
  const [containerW,setContainerW]=useState(0);
  const [containerH,setContainerH]=useState(0);
  const [pageSize,setPageSize]=useState({width:612,height:792});
  const [bmPopover,setBmPopover]=useState(false);  // bookmark popover open
  const [bmName,setBmName]=useState('');           // new bookmark name draft
  const [bmNote,setBmNote]=useState('');           // new bookmark note draft
  const [pageEditing,setPageEditing]=useState(false);
  const [pageInputVal,setPageInputVal]=useState('');
  const containerRef=useRef(null);
  const pageRefs=useRef({});
  const bmBtnRef=useRef(null);
  const bmPopRef=useRef(null);
  const currentPageRef=useRef(currentPage);
  const wheelAccum=useRef(0);

  const effectiveStart=startPage||1;
  const effectiveEnd=endPage&&numPages?Math.min(endPage,numPages):numPages;
  const totalPages=effectiveEnd?effectiveEnd-effectiveStart+1:numPages;
  // Only restrict backwards nav when BOTH start and end are set (explicit range).
  // startPage alone means "open here" — allow browsing the full document.
  const clampStart=(startPage&&endPage)?effectiveStart:1;

  // Close bookmark popover on outside click
  useEffect(()=>{
    if(!bmPopover)return;
    const h=(e)=>{
      if(bmBtnRef.current?.contains(e.target))return;
      if(bmPopRef.current?.contains(e.target))return;
      setBmPopover(false);
    };
    document.addEventListener('mousedown',h);
    return()=>document.removeEventListener('mousedown',h);
  },[bmPopover]);

  // Bookmarks for the current visible page
  const curPageBms=(bookmarks||[]).filter(b=>b.page===currentPage);
  const hasBookmarkHere=curPageBms.length>0;

  // P8: read inside the ResizeObserver callback below (not a reactive effect) so
  // narrowing past the spread threshold can downgrade the mode from the same
  // callback that already owns containerW — a ref avoids a stale closure without
  // adding another setState-in-effect (already tolerated 4x elsewhere in this file).
  const modeRef=useRef(mode);
  useEffect(()=>{modeRef.current=mode;},[mode]);

  // Measure container. During active drag-resize we debounce (80ms) to avoid
  // re-rendering every animation frame. For discrete changes (sidebar collapse,
  // initial mount) we update immediately so there's no stale-width flash.
  useEffect(()=>{
    if(!containerRef.current)return;
    let timer=null;
    const applyWidth=(w,h)=>{
      setContainerW(w);setContainerH(h);
      // P8: a container that's narrowed below the spread threshold (drawer
      // resize, orientation change) can't show a legible spread — fall back.
      if(modeRef.current==='spread'&&w>0&&w<CONTAINER_SPREAD_MIN)setMode('single');
    };
    const ro=new ResizeObserver(entries=>{
      if(dragging){
        clearTimeout(timer);
        timer=setTimeout(()=>{
          for(const e of entries)applyWidth(e.contentRect.width,e.contentRect.height);
        },80);
      }else{
        clearTimeout(timer);
        for(const e of entries)applyWidth(e.contentRect.width,e.contentRect.height);
      }
    });
    ro.observe(containerRef.current);
    return()=>{ro.disconnect();clearTimeout(timer);};
  },[dragging]);

  useEffect(()=>{setCurrentPage(effectiveStart);setNumPages(null);},[url,effectiveStart]);// eslint-disable-line

  // P3/P8: persist reading prefs on change. expanded/fullscreen (owned by PdfDrawer) stays per-session — R9.
  useEffect(()=>{
    try{localStorage.setItem(PDF_PREFS_KEY,JSON.stringify({zoom,mode,fitMode,seamOffset}));}catch{/* quota/private-mode — non-fatal, NS voice: silent */}
  },[zoom,mode,fitMode,seamOffset]);

  // Keep a ref so the wheel handler always reads the latest page without stale closure
  useEffect(()=>{currentPageRef.current=currentPage;},[currentPage]);

  const onDocLoaded=({numPages:n})=>setNumPages(n);
  const onPageLoaded=(pg)=>setPageSize({width:pg.originalWidth,height:pg.originalHeight});

  const singleW=useCallback(()=>{
    if(!containerW)return undefined;
    if(fitMode==='width')return Math.floor(containerW*zoom);
    const sh=containerH/(pageSize.height||792);
    return Math.floor((pageSize.width||612)*sh*zoom);
  },[containerW,containerH,fitMode,zoom,pageSize]);

  const spreadW=useCallback(()=>{
    if(!containerW)return undefined;
    const gap=8;
    if(fitMode==='width')return Math.floor(((containerW-gap)/2)*zoom);
    const sh=containerH/(pageSize.height||792);
    return Math.floor((pageSize.width||612)*sh*zoom);
  },[containerW,containerH,fitMode,zoom,pageSize]);

  const clamp=useCallback((pg)=>{
    const end=effectiveEnd||numPages||pg;
    return Math.max(clampStart,Math.min(end,pg));
  },[clampStart,effectiveEnd,numPages]);

  // P8: seam-offset pairing. Offset 0 pairs (1,2),(3,4)…; offset 1 leaves page 1
  // alone (a cover) and pairs (2,3),(4,5)… — so the two pages of a musical
  // opening land on the correct seam when the score's front matter is odd.
  const pairLeft=useCallback((p)=>computePairLeft(p,seamOffset),[seamOffset]);

  const jumpToPage=useCallback((pg)=>{
    let c=clamp(pg);
    if(mode==='spread')c=Math.max(clampStart,pairLeft(c));
    setCurrentPage(c);
    if(mode==='continuous'){
      const el=pageRefs.current[c];
      if(el)el.scrollIntoView({behavior:'smooth',block:'start'});
    }
    onPageChange&&onPageChange(c);
  },[clamp,mode,onPageChange,pairLeft,clampStart]);

  // P8: container-gating — spread offered when the viewer's own container is
  // wide enough (iPad-portrait qualifies, iPhone doesn't), not device class.
  const canSpread=containerW>=CONTAINER_SPREAD_MIN;

  useImperativeHandle(ref,()=>({jumpToPage}),[jumpToPage]);

  // F3: onLoad-gated jump with bounded retry. A pending page (from the parent —
  // the score-view bridge or a spot-activation auto-jump) may arrive before the
  // target is mounted: cold load, a large PDF still parsing, or a just-switched
  // attachment whose document hasn't loaded yet. Retry until the target is ready
  // (numPages known; in continuous mode, that page's wrapper actually mounted),
  // then jump once and report success. Give up silently past the retry budget —
  // no error toast for a navigation (NS voice).
  useEffect(()=>{
    if(pendingPage==null)return;
    let cancelled=false;
    let attempts=0;
    const attempt=()=>{
      if(cancelled)return;
      attempts++;
      const ready=mode==='continuous'?!!pageRefs.current[clamp(pendingPage)]:numPages!=null;
      if(ready){
        jumpToPage(pendingPage);
        onPendingPageHandled&&onPendingPageHandled();
        return;
      }
      if(attempts>=PENDING_JUMP_MAX_ATTEMPTS){
        onPendingPageHandled&&onPendingPageHandled();
        return;
      }
      setTimeout(attempt,PENDING_JUMP_RETRY_MS);
    };
    attempt();
    return()=>{cancelled=true;};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[pendingPage,numPages,mode]);

  // Non-passive wheel listener — flips pages in single/spread mode.
  // P5: when the page overflows the container (zoomed in), a wheel tick scrolls
  // within the page first; only at a scroll edge does it fall through to the
  // page-flip accumulator (preserved from before).
  const jumpToPageRef2=useRef(jumpToPage);
  useEffect(()=>{jumpToPageRef2.current=jumpToPage;},[jumpToPage]);
  useEffect(()=>{
    const el=containerRef.current;
    if(!el)return;
    const handler=(e)=>{
      if(mode==='continuous')return; // native scroll handles it
      const scrollable=el.scrollHeight-el.clientHeight>1;
      if(scrollable){
        const atTop=el.scrollTop<=0;
        const atBottom=el.scrollTop+el.clientHeight>=el.scrollHeight-1;
        const scrollingUp=e.deltaY<0;
        const scrollingDown=e.deltaY>0;
        if((scrollingUp&&!atTop)||(scrollingDown&&!atBottom)){
          wheelAccum.current=0; // reset while actively scrolling inside the page
          return; // let the native scroll happen
        }
      }
      e.preventDefault();
      wheelAccum.current+=e.deltaY;
      if(Math.abs(wheelAccum.current)<80)return;
      const dir=wheelAccum.current>0?1:-1;
      wheelAccum.current=0;
      jumpToPageRef2.current(currentPageRef.current+dir*(mode==='spread'?2:1));
    };
    el.addEventListener('wheel',handler,{passive:false});
    return()=>el.removeEventListener('wheel',handler);
  },[mode]);

  // P5: land at the top of the page after a flip (button nav or wheel-edge flip)
  // so a zoomed page never opens mid-scroll. Continuous mode scrolls natively.
  useEffect(()=>{
    if(mode==='continuous')return;
    if(containerRef.current)containerRef.current.scrollTop=0;
  },[currentPage,mode]);

  const prevPage=()=>jumpToPage(currentPage-(mode==='spread'?2:1));
  const nextPage=()=>jumpToPage(currentPage+(mode==='spread'?2:1));
  const zoomIn=()=>setZoom(z=>Math.min(+(z+0.25).toFixed(2),4));
  const zoomOut=()=>setZoom(z=>Math.max(+(z-0.25).toFixed(2),0.25));

  // Continuous scroll: track visible page
  useEffect(()=>{
    if(mode!=='continuous'||!numPages)return;
    const els=Object.values(pageRefs.current).filter(Boolean);
    if(!els.length)return;
    const obs=new IntersectionObserver(entries=>{
      const vis=entries.filter(e=>e.isIntersecting);
      if(!vis.length)return;
      const top=vis.reduce((a,b)=>a.boundingClientRect.top<b.boundingClientRect.top?a:b);
      const pg=parseInt(top.target.dataset.page,10);
      setCurrentPage(pg);onPageChange&&onPageChange(pg);
    },{threshold:0.3});
    els.forEach(el=>obs.observe(el));
    return()=>obs.disconnect();
  },[mode,numPages,onPageChange]);

  const allPages=[];
  if(numPages){for(let p=effectiveStart;p<=(effectiveEnd||numPages);p++)allPages.push(p);}

  // P8: with seamOffset 1, page 1 stands alone (a cover) rather than pairing.
  const alone=mode==='spread'&&seamOffset===1&&currentPage===1;
  const rightPage=numPages?clamp(currentPage+1):null;
  const showRight=mode==='spread'&&!alone&&rightPage!==null&&rightPage!==currentPage&&rightPage<=(effectiveEnd||numPages||0);
  const isAtStart=currentPage<=effectiveStart;
  const isAtEnd=mode==='spread'
    ?currentPage+(showRight?1:0)>=(effectiveEnd||numPages||1)
    :currentPage>=(effectiveEnd||numPages||1);

  const pageLabel=mode==='spread'&&showRight?`${currentPage}–${rightPage}`:`${currentPage}`;
  const totalLabel=totalPages?` / ${totalPages}`:'';

  const dw=singleW();
  const sw=spreadW();

  // Bookmark ribbon on a page
  const BookmarkRibbon=({page})=>{
    const bms=(bookmarks||[]).filter(b=>b.page===page);
    if(!bms.length)return null;
    return(
      <div title={bms.map(b=>b.note?`${b.name} — ${b.note}`:b.name).join(', ')}
        style={{position:'absolute',top:0,right:0,zIndex:3,display:'flex',alignItems:'center',
          gap:3,padding:'3px 7px',background:IKB,pointerEvents:'none'}}>
        <BookMarked style={{width:10,height:10,color:'#fff',flexShrink:0}}/>
        <span style={{fontSize:'9px',color:'#fff',fontFamily:mono,maxWidth:130,overflow:'hidden',
          textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
          {bms.map(b=>b.name).join(' · ')}
        </span>
      </div>
    );
  };

  // Bookmark popover position (anchored to the bookmark button)
  const [popPos,setPopPos]=useState({x:0,y:0});
  const openBmPopover=()=>{
    if(bmBtnRef.current){
      const r=bmBtnRef.current.getBoundingClientRect();
      setPopPos({x:r.left,y:r.bottom+4});
    }
    setBmPopover(v=>!v);
    setBmName('');
    setBmNote('');
  };

  const handleAddBm=()=>{
    if(!bmName.trim())return;
    onAddBookmark&&onAddBookmark(bmName.trim(),currentPage,bmNote.trim());
    setBmName('');
    setBmNote('');
  };

  return(
    <div style={{display:'flex',flexDirection:'column',height:'100%',background:BG,overflow:'hidden'}}>

      {/* ── Toolbar ── */}
      <div style={{display:'flex',alignItems:'center',gap:'3px',padding:'5px 8px',
        borderBottom:`1px solid ${LINE}`,flexShrink:0,overflowX:'auto',scrollbarWidth:'none'}}>

        {/* F6: fit-to-page available everywhere — first slice of container-gating (P8, 98.9). */}
        <TBtn active={fitMode==='width'} label="Fit to width" onClick={()=>setFitMode('width')}>
          <AlignJustify style={{width:12,height:12}}/>
        </TBtn>
        <TBtn active={fitMode==='page'} label="Fit to page" onClick={()=>setFitMode('page')}>
          <Maximize2 style={{width:12,height:12}}/>
        </TBtn>
        <SEP/>

        {/* Zoom */}
        <TBtn label="Zoom out" onClick={zoomOut}><ZoomOut style={{width:12,height:12}}/></TBtn>
        <span style={{color:MUTED,fontSize:'10px',fontFamily:mono,minWidth:36,textAlign:'center',flexShrink:0}}>
          {Math.round(zoom*100)}%
        </span>
        <TBtn label="Zoom in" onClick={zoomIn}><ZoomIn style={{width:12,height:12}}/></TBtn>

        <SEP/>

        {/* View mode — spread offered when the container is wide enough (P8:
            container-gating, not isMobile — iPad-portrait qualifies, iPhone doesn't) */}
        <TBtn active={mode==='single'} label="Single page" onClick={()=>setMode('single')}>
          <FileText style={{width:12,height:12}}/>
        </TBtn>
        {canSpread&&(
          <TBtn active={mode==='spread'} label="Two-page spread" onClick={()=>setMode('spread')}>
            <Columns2 style={{width:12,height:12}}/>
          </TBtn>
        )}
        <TBtn active={mode==='continuous'} label="Continuous scroll" onClick={()=>setMode('continuous')}>
          <List style={{width:12,height:12}}/>
        </TBtn>
        {mode==='spread'&&canSpread&&(
          <TBtn label="Shift spread seam" onClick={()=>{
            const nextOffset=seamOffset===0?1:0;
            setSeamOffset(nextOffset);
            // Resnap the displayed pair to the new seam immediately, rather
            // than leaving a stale pairing on screen until the next flip.
            const c=Math.max(clampStart,computePairLeft(currentPage,nextOffset));
            setCurrentPage(c);
            onPageChange&&onPageChange(c);
          }}>
            <ArrowLeftRight style={{width:12,height:12}}/>
          </TBtn>
        )}

        <SEP/>

        {/* Bookmark button — opens popover */}
        <TBtn
          btnRef={bmBtnRef}
          label={hasBookmarkHere?`${curPageBms.length} bookmark${curPageBms.length>1?'s':''} here`:'Bookmarks / add'}
          onClick={openBmPopover}
          extra={hasBookmarkHere?{borderColor:IKB}:{}}>
          <BookMarked style={{width:12,height:12,color:hasBookmarkHere?IKB:undefined}}/>
        </TBtn>

        <SEP/>

        {/* Page nav */}
        <TBtn label="Previous page" disabled={isAtStart} onClick={prevPage}>
          <ChevronLeft style={{width:12,height:12}}/>
        </TBtn>
        {pageEditing?(
          (()=>{
            const lo=clampStart, hi=effectiveEnd||numPages||1;
            const commit=()=>{const n=parseInt(pageInputVal,10);if(Number.isFinite(n))jumpToPage(Math.max(lo,Math.min(hi,n)));setPageEditing(false);};
            return (<input
              autoFocus
              type="number"
              inputMode="numeric"
              min={lo}
              max={hi}
              value={pageInputVal}
              onChange={e=>setPageInputVal(e.target.value)}
              onKeyDown={e=>{
                if(e.key==='Enter')commit();
                else if(e.key==='Escape')setPageEditing(false);
              }}
              onBlur={commit}
              style={{color:TEXT,fontSize:'11px',fontFamily:mono,width:'44px',textAlign:'center',flexShrink:0,
                background:'transparent',border:`1px solid ${LINE_MED}`,outline:'none',padding:'1px 3px'}}
            />);
          })()
        ):(
          <span
            onClick={()=>{setPageEditing(true);setPageInputVal(String(currentPage));}}
            title="Click to jump to page"
            style={{color:TEXT,fontSize:'11px',fontFamily:mono,minWidth:isMobile?48:60,textAlign:'center',flexShrink:0,
              cursor:'text',borderBottom:`1px dotted ${LINE_MED}`}}>
            {pageLabel}{totalLabel}
          </span>
        )}
        <TBtn label="Next page" disabled={isAtEnd} onClick={nextPage}>
          <ChevronRight style={{width:12,height:12}}/>
        </TBtn>
      </div>

      {/* ── Document area ── */}
      <div ref={containerRef}
        style={{flex:1,overflow:'auto',padding:'12px',display:'flex',
          flexDirection:'column',alignItems:'center',gap:'12px'}}>
        {url?(
          <Document
            file={url} onLoadSuccess={onDocLoaded}
            loading={<div style={{color:FAINT,fontSize:'11px',padding:'20px',fontFamily:sans}}>Loading…</div>}
            error={<div style={{color:'#e57373',fontSize:'11px',padding:'20px',fontFamily:sans}}>Failed to load PDF.</div>}
          >
            {mode==='single'&&(
              <div style={{position:'relative'}}>
                <BookmarkRibbon page={currentPage}/>
                <FlashFreePage key={url} pageNumber={currentPage} adjacentPage={currentPage+1}
                  minPage={clampStart} maxPage={effectiveEnd||numPages}
                  width={dw} onLoadSuccess={onPageLoaded}/>
              </div>
            )}
            {mode==='spread'&&(
              <div style={{display:'flex',gap:'8px',alignItems:'flex-start',justifyContent:'center'}}>
                <div style={{position:'relative'}}>
                  <BookmarkRibbon page={currentPage}/>
                  {/* P8: a lone cover (seamOffset 1, page 1) renders at full width — no partner to share the row with. */}
                  <FlashFreePage key={url} pageNumber={currentPage} adjacentPage={alone?null:currentPage+2}
                    minPage={clampStart} maxPage={effectiveEnd||numPages}
                    width={alone?dw:sw} onLoadSuccess={onPageLoaded}/>
                </div>
                {showRight&&(
                  <div style={{position:'relative'}}>
                    <BookmarkRibbon page={rightPage}/>
                    <FlashFreePage key={`${url}-r`} pageNumber={rightPage} adjacentPage={rightPage+2}
                      minPage={clampStart} maxPage={effectiveEnd||numPages}
                      width={sw}/>
                  </div>
                )}
              </div>
            )}
            {mode==='continuous'&&allPages.map(p=>{
              // P6: windowed rendering around the current (topmost-visible) page.
              // The C7 wrapper (position:relative + data-page) is unchanged and
              // always mounts — only the content inside it is a real <Page> or
              // a sized placeholder — so scroll-position lookups, jumpToPage's
              // scrollIntoView, and the IntersectionObserver above keep working.
              const active=Math.abs(p-currentPage)<=CONTINUOUS_WINDOW;
              const placeholderH=dw?Math.round(dw*((pageSize.height||792)/(pageSize.width||612))):(pageSize.height||792);
              return (
                <div key={p} ref={el=>{pageRefs.current[p]=el;}} data-page={p} style={{position:'relative'}}>
                  <BookmarkRibbon page={p}/>
                  <FlashFreePage pageNumber={p} adjacentPage={null}
                    minPage={clampStart} maxPage={effectiveEnd||numPages}
                    width={dw} height={placeholderH} active={active}
                    renderTextLayer={false} renderAnnotationLayer={false}
                    onLoadSuccess={p===currentPage?onPageLoaded:undefined}/>
                </div>
              );
            })}
          </Document>
        ):(
          <div style={{color:FAINT,fontSize:'12px',padding:'40px 20px',fontFamily:sans,textAlign:'center'}}>
            No PDF loaded.
          </div>
        )}
      </div>

      {/* ── Bookmark popover (portal) ── */}
      {bmPopover&&createPortal(
        <div ref={bmPopRef}
          style={{position:'fixed',top:popPos.y,left:popPos.x,zIndex:99999,
            width:240,background:'#141412',border:`1px solid ${LINE_MED}`,
            boxShadow:'0 8px 32px rgba(0,0,0,0.6)',
            maxHeight:Math.max(160,window.innerHeight-kbInset-popPos.y-16),overflowY:'auto'}}>

          {/* Header */}
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',
            padding:'8px 10px',borderBottom:`1px solid ${LINE_MED}`}}>
            <span style={{color:FAINT,fontSize:'9px',letterSpacing:'0.22em',fontFamily:sans}}>
              BOOKMARKS — p.{currentPage}
            </span>
            <button onClick={()=>setBmPopover(false)} style={{color:FAINT}}>
              <X style={{width:12,height:12}}/>
            </button>
          </div>

          {/* Bookmarks on current page */}
          {curPageBms.length>0&&(
            <div style={{borderBottom:`1px solid ${LINE_MED}`}}>
              {curPageBms.map(bm=>(
                <div key={bm.id} style={{display:'flex',alignItems:'flex-start',gap:6,padding:'7px 10px',
                  borderBottom:`1px solid ${LINE}`}}>
                  <BookMarked style={{width:11,height:11,color:IKB,flexShrink:0,marginTop:2}}/>
                  <div style={{flex:1,minWidth:0}}>
                    <span style={{color:TEXT,fontSize:'12px',fontFamily:serif,fontStyle:'italic'}}>
                      {bm.name}
                    </span>
                    {bm.note&&<div style={{color:FAINT,fontSize:'10px',fontFamily:serif,fontStyle:'italic',marginTop:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{bm.note}</div>}
                  </div>
                  <span style={{color:FAINT,fontSize:'10px',fontFamily:mono,flexShrink:0}}>p.{bm.page}</span>
                </div>
              ))}
            </div>
          )}

          {/* All other bookmarks — jump list */}
          {(bookmarks||[]).filter(b=>b.page!==currentPage).length>0&&(
            <div style={{maxHeight:180,overflowY:'auto',borderBottom:`1px solid ${LINE_MED}`}}>
              <div style={{padding:'5px 10px 2px',color:FAINT,fontSize:'9px',letterSpacing:'0.2em',fontFamily:sans}}>
                ALL BOOKMARKS
              </div>
              {(bookmarks||[]).filter(b=>b.page!==currentPage).map(bm=>(
                <button key={bm.id}
                  onClick={()=>{jumpToPage(bm.page);setBmPopover(false);}}
                  style={{display:'flex',alignItems:'flex-start',gap:6,padding:'6px 10px',width:'100%',
                    background:'transparent',border:'none',cursor:'pointer',textAlign:'left',
                    borderBottom:`1px solid ${LINE}`}}>
                  <BookMarked style={{width:11,height:11,color:MUTED,flexShrink:0,marginTop:2}}/>
                  <div style={{flex:1,minWidth:0}}>
                    <span style={{color:MUTED,fontSize:'12px',fontFamily:serif,fontStyle:'italic'}}>
                      {bm.name}
                    </span>
                    {bm.note&&<div style={{color:FAINT,fontSize:'10px',fontFamily:serif,fontStyle:'italic',marginTop:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{bm.note}</div>}
                  </div>
                  <span style={{color:FAINT,fontSize:'10px',fontFamily:mono,flexShrink:0}}>p.{bm.page}</span>
                </button>
              ))}
            </div>
          )}

          {/* Add bookmark form */}
          {onAddBookmark&&(
            <div style={{padding:'8px 10px'}}>
              <div style={{color:FAINT,fontSize:'9px',letterSpacing:'0.2em',fontFamily:sans,marginBottom:6}}>
                ADD TO p.{currentPage}
              </div>
              <div className="flex" style={{gap:6,marginBottom:6}}>
                <input
                  autoFocus
                  type="text"
                  placeholder="Bookmark name"
                  value={bmName}
                  onChange={e=>setBmName(e.target.value)}
                  onKeyDown={e=>{if(e.key==='Enter')handleAddBm();else if(e.key==='Escape')setBmPopover(false);}}
                  style={{flex:1,background:'transparent',color:TEXT,border:`1px solid ${LINE_MED}`,
                    fontSize:'12px',padding:'4px 6px',outline:'none',fontFamily:serif}}/>
                <button onClick={handleAddBm}
                  style={{background:IKB,border:'none',color:'#fff',padding:'4px 8px',cursor:'pointer',flexShrink:0}}>
                  <Plus style={{width:11,height:11}}/>
                </button>
              </div>
              <MarkdownField value={bmNote} onChange={setBmNote} placeholder="Note…" minHeight={32}
                style={{background:'transparent',border:`1px solid ${LINE_MED}`}}
                onWikiLinkClick={onWikiLinkClick} completionData={completionData}/>
            </div>
          )}
        </div>,
        // C6: fullscreen hides everything outside the fullscreened element — the
        // popover must portal inside it there, or it's invisible.
        fullscreenElement||document.body
      )}
    </div>
  );
});

export default PdfViewer;
