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
import FileText from 'lucide-react/dist/esm/icons/file-text';
import Plus from 'lucide-react/dist/esm/icons/plus';
import X from 'lucide-react/dist/esm/icons/x';
import useViewport from '../hooks/useViewport.js';
import {BG,TEXT,MUTED,FAINT,LINE,LINE_MED,IKB,IKB_SOFT,serif,sans,mono} from '../constants/theme.js';

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
const PdfViewer=forwardRef(function PdfViewer({
  url,startPage=1,endPage=null,bookmarks=[],
  onPageChange,onAddBookmark,dragging=false,
},ref){
  const {isMobile}=useViewport();
  const [numPages,setNumPages]=useState(null);
  const [currentPage,setCurrentPage]=useState(startPage||1);
  const [zoom,setZoom]=useState(1.0);
  const [mode,setMode]=useState('single');   // 'single' | 'spread' | 'continuous'
  const [fitMode,setFitMode]=useState('width'); // 'width' | 'page'
  const [containerW,setContainerW]=useState(0);
  const [containerH,setContainerH]=useState(0);
  const [pageSize,setPageSize]=useState({width:612,height:792});
  const [bmPopover,setBmPopover]=useState(false);  // bookmark popover open
  const [bmName,setBmName]=useState('');           // new bookmark name draft
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

  // Measure container. During active drag-resize we debounce (80ms) to avoid
  // re-rendering every animation frame. For discrete changes (sidebar collapse,
  // initial mount) we update immediately so there's no stale-width flash.
  useEffect(()=>{
    if(!containerRef.current)return;
    let timer=null;
    const ro=new ResizeObserver(entries=>{
      if(dragging){
        clearTimeout(timer);
        timer=setTimeout(()=>{
          for(const e of entries){setContainerW(e.contentRect.width);setContainerH(e.contentRect.height);}
        },80);
      }else{
        clearTimeout(timer);
        for(const e of entries){setContainerW(e.contentRect.width);setContainerH(e.contentRect.height);}
      }
    });
    ro.observe(containerRef.current);
    return()=>{ro.disconnect();clearTimeout(timer);};
  },[dragging]);

  useEffect(()=>{setCurrentPage(effectiveStart);setNumPages(null);},[url,effectiveStart]);// eslint-disable-line

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

  const jumpToPage=useCallback((pg)=>{
    const c=clamp(pg);
    setCurrentPage(c);
    if(mode==='continuous'){
      const el=pageRefs.current[c];
      if(el)el.scrollIntoView({behavior:'smooth',block:'start'});
    }
    onPageChange&&onPageChange(c);
  },[clamp,mode,onPageChange]);

  useImperativeHandle(ref,()=>({jumpToPage}),[jumpToPage]);

  // Non-passive wheel listener — flips pages in single/spread mode
  const jumpToPageRef2=useRef(jumpToPage);
  useEffect(()=>{jumpToPageRef2.current=jumpToPage;},[jumpToPage]);
  useEffect(()=>{
    const el=containerRef.current;
    if(!el)return;
    const handler=(e)=>{
      if(mode==='continuous')return; // native scroll handles it
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

  const rightPage=numPages?clamp(currentPage+1):null;
  const showRight=mode==='spread'&&rightPage!==null&&rightPage!==currentPage&&rightPage<=(effectiveEnd||numPages||0);
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
      <div title={bms.map(b=>b.name).join(', ')}
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
  };

  const handleAddBm=()=>{
    if(!bmName.trim())return;
    onAddBookmark&&onAddBookmark(bmName.trim(),currentPage);
    setBmName('');
  };

  return(
    <div style={{display:'flex',flexDirection:'column',height:'100%',background:BG,overflow:'hidden'}}>

      {/* ── Toolbar ── */}
      <div style={{display:'flex',alignItems:'center',gap:'3px',padding:'5px 8px',
        borderBottom:`1px solid ${LINE}`,flexShrink:0,overflowX:'auto',scrollbarWidth:'none'}}>

        {/* Fit — hidden on mobile (always width-fit on small screens) */}
        {!isMobile&&(<>
          <TBtn active={fitMode==='width'} label="Fit to width" onClick={()=>setFitMode('width')}>
            <AlignJustify style={{width:12,height:12}}/>
          </TBtn>
          <TBtn active={fitMode==='page'} label="Fit to page" onClick={()=>setFitMode('page')}>
            <Maximize2 style={{width:12,height:12}}/>
          </TBtn>
          <SEP/>
        </>)}

        {/* Zoom */}
        <TBtn label="Zoom out" onClick={zoomOut}><ZoomOut style={{width:12,height:12}}/></TBtn>
        <span style={{color:MUTED,fontSize:'10px',fontFamily:mono,minWidth:36,textAlign:'center',flexShrink:0}}>
          {Math.round(zoom*100)}%
        </span>
        <TBtn label="Zoom in" onClick={zoomIn}><ZoomIn style={{width:12,height:12}}/></TBtn>

        <SEP/>

        {/* View mode — spread hidden on mobile (too narrow) */}
        <TBtn active={mode==='single'} label="Single page" onClick={()=>setMode('single')}>
          <FileText style={{width:12,height:12}}/>
        </TBtn>
        {!isMobile&&(
          <TBtn active={mode==='spread'} label="Two-page spread" onClick={()=>setMode('spread')}>
            <Columns2 style={{width:12,height:12}}/>
          </TBtn>
        )}
        <TBtn active={mode==='continuous'} label="Continuous scroll" onClick={()=>setMode('continuous')}>
          <List style={{width:12,height:12}}/>
        </TBtn>

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
          <input
            autoFocus
            type="text"
            inputMode="numeric"
            value={pageInputVal}
            onChange={e=>setPageInputVal(e.target.value)}
            onKeyDown={e=>{
              if(e.key==='Enter'){const n=parseInt(pageInputVal,10);if(!isNaN(n))jumpToPage(n);setPageEditing(false);}
              else if(e.key==='Escape')setPageEditing(false);
            }}
            onBlur={()=>{const n=parseInt(pageInputVal,10);if(!isNaN(n))jumpToPage(n);setPageEditing(false);}}
            style={{color:TEXT,fontSize:'11px',fontFamily:mono,width:'44px',textAlign:'center',flexShrink:0,
              background:'transparent',border:`1px solid ${LINE_MED}`,outline:'none',padding:'1px 3px'}}
          />
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
                <Page pageNumber={currentPage} width={dw} onLoadSuccess={onPageLoaded}
                  renderTextLayer renderAnnotationLayer/>
              </div>
            )}
            {mode==='spread'&&(
              <div style={{display:'flex',gap:'8px',alignItems:'flex-start',justifyContent:'center'}}>
                <div style={{position:'relative'}}>
                  <BookmarkRibbon page={currentPage}/>
                  <Page pageNumber={currentPage} width={sw} onLoadSuccess={onPageLoaded}
                    renderTextLayer renderAnnotationLayer/>
                </div>
                {showRight&&(
                  <div style={{position:'relative'}}>
                    <BookmarkRibbon page={rightPage}/>
                    <Page pageNumber={rightPage} width={sw} renderTextLayer renderAnnotationLayer/>
                  </div>
                )}
              </div>
            )}
            {mode==='continuous'&&allPages.map(p=>(
              <div key={p} ref={el=>{pageRefs.current[p]=el;}} data-page={p} style={{position:'relative'}}>
                <BookmarkRibbon page={p}/>
                <Page pageNumber={p} width={dw} renderTextLayer={false} renderAnnotationLayer={false}/>
              </div>
            ))}
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
            boxShadow:'0 8px 32px rgba(0,0,0,0.6)'}}>

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
                <div key={bm.id} style={{display:'flex',alignItems:'center',gap:6,padding:'7px 10px',
                  borderBottom:`1px solid ${LINE}`}}>
                  <BookMarked style={{width:11,height:11,color:IKB,flexShrink:0}}/>
                  <span style={{flex:1,color:TEXT,fontSize:'12px',fontFamily:serif,fontStyle:'italic'}}>
                    {bm.name}
                  </span>
                  <span style={{color:FAINT,fontSize:'10px',fontFamily:mono}}>p.{bm.page}</span>
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
                  style={{display:'flex',alignItems:'center',gap:6,padding:'6px 10px',width:'100%',
                    background:'transparent',border:'none',cursor:'pointer',textAlign:'left',
                    borderBottom:`1px solid ${LINE}`}}>
                  <BookMarked style={{width:11,height:11,color:MUTED,flexShrink:0}}/>
                  <span style={{flex:1,color:MUTED,fontSize:'12px',fontFamily:serif,fontStyle:'italic'}}>
                    {bm.name}
                  </span>
                  <span style={{color:FAINT,fontSize:'10px',fontFamily:mono}}>p.{bm.page}</span>
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
              <div style={{display:'flex',gap:6}}>
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
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
});

export default PdfViewer;
