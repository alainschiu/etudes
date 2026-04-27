import React,{useState,useEffect,useRef,useCallback,useImperativeHandle,forwardRef} from 'react';
import {Document,Page} from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import {ChevronLeft,ChevronRight,ZoomIn,ZoomOut,Maximize2,BookMarked,AlignJustify,Columns2,FileText} from 'lucide-react';
import {BG,TEXT,MUTED,FAINT,LINE,LINE_MED,IKB,sans,mono} from '../constants/theme.js';

const BTN={background:'transparent',border:`1px solid ${LINE_MED}`,color:TEXT,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',width:'28px',height:'28px',flexShrink:0,position:'relative'};
const BTN_ACT={...BTN,background:IKB,border:`1px solid ${IKB}`};
const SEP=()=><div style={{width:1,background:LINE_MED,height:18,margin:'0 4px',flexShrink:0}}/>;

// Toolbar button with a hover label below it
function TBtn({active,disabled,onClick,children,label,style}){
  const [hov,setHov]=useState(false);
  return(
    <div style={{position:'relative',display:'inline-flex',flexShrink:0}}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}>
      <button
        onClick={onClick}
        disabled={disabled}
        style={{...(active?BTN_ACT:BTN),...(disabled?{opacity:0.35,cursor:'default'}:{}), ...style}}>
        {children}
      </button>
      {hov&&label&&(
        <div style={{position:'absolute',top:'calc(100% + 5px)',left:'50%',transform:'translateX(-50%)',zIndex:9999,
          whiteSpace:'nowrap',padding:'3px 7px',background:'#141412',border:`1px solid ${LINE_MED}`,
          color:MUTED,fontSize:'10px',fontFamily:sans,letterSpacing:'0.1em',pointerEvents:'none'}}>
          {label}
        </div>
      )}
    </div>
  );
}

// PdfViewer — renders a PDF with full P3 controls including two-page spread.
// Exposed via ref: { jumpToPage(n) }
// Props:
//   url          – blob URL
//   startPage    – first page of attachment range (1-based, optional)
//   endPage      – last page of attachment range (1-based, optional)
//   bookmarks    – [{id, name, page}] for the active attachment
//   onPageChange(n) – fired when visible page changes
//   onBookmarkClick – optional callback; fires when user clicks the bookmark toolbar button
const PdfViewer=forwardRef(function PdfViewer({url,startPage=1,endPage=null,bookmarks=[],onPageChange,onBookmarkClick},ref){
  const [numPages,setNumPages]=useState(null);
  const [currentPage,setCurrentPage]=useState(startPage||1);
  const [zoom,setZoom]=useState(1.0);
  // mode: 'single' | 'spread' | 'continuous'
  const [mode,setMode]=useState('single');
  // fitMode: 'width' | 'page'
  const [fitMode,setFitMode]=useState('width');
  const [containerW,setContainerW]=useState(0);
  const [containerH,setContainerH]=useState(0);
  const [pageSize,setPageSize]=useState({width:612,height:792});
  const containerRef=useRef(null);
  const pageRefs=useRef({}); // for continuous scroll

  const effectiveStart=startPage||1;
  const effectiveEnd=endPage&&numPages?Math.min(endPage,numPages):numPages;
  const totalPages=effectiveEnd?effectiveEnd-effectiveStart+1:numPages;

  // Bookmarks on current page
  const curPageBms=(bookmarks||[]).filter(b=>b.page===currentPage);
  const bookmarkedPages=new Set((bookmarks||[]).map(b=>b.page));

  // Measure container (ResizeObserver gives content rect, excluding padding)
  useEffect(()=>{
    if(!containerRef.current)return;
    const ro=new ResizeObserver(entries=>{
      for(const e of entries){setContainerW(e.contentRect.width);setContainerH(e.contentRect.height);}
    });
    ro.observe(containerRef.current);
    return()=>ro.disconnect();
  },[]);

  // Reset on url / range change
  useEffect(()=>{setCurrentPage(effectiveStart);setNumPages(null);},[url,effectiveStart]);// eslint-disable-line react-hooks/exhaustive-deps

  const onDocLoaded=({numPages:n})=>setNumPages(n);
  const onPageLoaded=(pg)=>setPageSize({width:pg.originalWidth,height:pg.originalHeight});

  // Page width for single / continuous
  const singleW=useCallback(()=>{
    if(!containerW)return undefined;
    if(fitMode==='width')return Math.floor(containerW*zoom);
    const sh=containerH/(pageSize.height||792);
    return Math.floor((pageSize.width||612)*sh*zoom);
  },[containerW,containerH,fitMode,zoom,pageSize]);

  // Page width for spread (each page = half container minus gap)
  const spreadW=useCallback(()=>{
    if(!containerW)return undefined;
    const gap=8; // px between the two pages
    if(fitMode==='width')return Math.floor(((containerW-gap)/2)*zoom);
    const sh=containerH/(pageSize.height||792);
    return Math.floor((pageSize.width||612)*sh*zoom);
  },[containerW,containerH,fitMode,zoom,pageSize]);

  // ── Navigation ──────────────────────────────────────────────────────────────
  const clamp=useCallback((pg)=>{
    const end=effectiveEnd||numPages||pg;
    return Math.max(effectiveStart,Math.min(end,pg));
  },[effectiveStart,effectiveEnd,numPages]);

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

  const prevPage=()=>{
    const step=mode==='spread'?2:1;
    jumpToPage(currentPage-step);
  };
  const nextPage=()=>{
    const step=mode==='spread'?2:1;
    jumpToPage(currentPage+step);
  };
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
      setCurrentPage(pg);
      onPageChange&&onPageChange(pg);
    },{threshold:0.3});
    els.forEach(el=>obs.observe(el));
    return()=>obs.disconnect();
  },[mode,numPages,onPageChange]);

  // Pages array for continuous mode
  const allPages=[];
  if(numPages){
    for(let p=effectiveStart;p<=(effectiveEnd||numPages);p++)allPages.push(p);
  }

  // Spread: right-hand page is currentPage+1 (if within range)
  const rightPage=numPages?clamp(currentPage+1):null;
  const showRight=mode==='spread'&&rightPage!==null&&rightPage!==currentPage&&rightPage<=(effectiveEnd||numPages||0);

  const isAtStart=currentPage<=effectiveStart;
  const isAtEnd=mode==='spread'
    ?currentPage>=(effectiveEnd||numPages||1)-(showRight?1:0)
    :currentPage>=(effectiveEnd||numPages||1);

  // Page indicator label
  const pageLabel=mode==='spread'&&showRight
    ?`${currentPage}–${rightPage}`
    :`${currentPage}`;
  const totalLabel=totalPages?` / ${totalPages}`:'';

  const dw=singleW();
  const sw=spreadW();

  // Small bookmark ribbon overlay on a page
  const BookmarkRibbon=({page})=>{
    const bms=(bookmarks||[]).filter(b=>b.page===page);
    if(!bms.length)return null;
    return(
      <div style={{position:'absolute',top:0,right:0,zIndex:3,display:'flex',alignItems:'center',gap:3,
        padding:'3px 7px',background:IKB,pointerEvents:'none'}}
        title={bms.map(b=>b.name).join(', ')}>
        <BookMarked style={{width:10,height:10,color:'#fff',flexShrink:0}}/>
        <span style={{fontSize:'9px',color:'#fff',fontFamily:mono,maxWidth:120,overflow:'hidden',
          textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
          {bms.map(b=>b.name).join(' · ')}
        </span>
      </div>
    );
  };

  return(
    <div style={{display:'flex',flexDirection:'column',height:'100%',background:BG,overflow:'hidden'}}>

      {/* ── Toolbar ── */}
      <div style={{display:'flex',alignItems:'center',gap:'3px',padding:'5px 10px',
        borderBottom:`1px solid ${LINE}`,flexShrink:0,flexWrap:'nowrap',overflowX:'auto'}}>

        {/* Fit */}
        <TBtn active={fitMode==='width'} label="Fit width" onClick={()=>setFitMode('width')}>
          <AlignJustify style={{width:12,height:12}}/>
        </TBtn>
        <TBtn active={fitMode==='page'} label="Fit page" onClick={()=>setFitMode('page')}>
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

        {/* View mode */}
        <TBtn active={mode==='single'} label="Single page" onClick={()=>setMode('single')}>
          <FileText style={{width:12,height:12}}/>
        </TBtn>
        <TBtn active={mode==='spread'} label="Two-page spread" onClick={()=>setMode('spread')}>
          <Columns2 style={{width:12,height:12}}/>
        </TBtn>
        <TBtn active={mode==='continuous'} label="Continuous scroll" onClick={()=>setMode('continuous')}>
          <AlignJustify style={{width:12,height:12}}/>
        </TBtn>

        <SEP/>

        {/* Bookmark indicator */}
        <TBtn
          label={curPageBms.length>0?curPageBms.map(b=>b.name).join(' · '):'No bookmark on this page'}
          onClick={()=>onBookmarkClick&&onBookmarkClick(currentPage)}
          style={curPageBms.length>0?{borderColor:IKB}:{}}>
          <BookMarked style={{width:12,height:12,color:curPageBms.length>0?IKB:undefined}}/>
        </TBtn>

        <SEP/>

        {/* Page nav */}
        <TBtn label="Previous" disabled={isAtStart} onClick={prevPage}><ChevronLeft style={{width:12,height:12}}/></TBtn>
        <span style={{color:TEXT,fontSize:'11px',fontFamily:mono,minWidth:58,textAlign:'center',flexShrink:0}}>
          {pageLabel}{totalLabel}
        </span>
        <TBtn label="Next" disabled={isAtEnd} onClick={nextPage}><ChevronRight style={{width:12,height:12}}/></TBtn>
      </div>

      {/* ── Document area ── */}
      <div ref={containerRef}
        style={{flex:1,overflow:'auto',padding:'12px',display:'flex',flexDirection:'column',
          alignItems:'center',gap:'12px'}}>
        {url?(
          <Document
            file={url}
            onLoadSuccess={onDocLoaded}
            loading={<div style={{color:FAINT,fontSize:'11px',padding:'20px',fontFamily:sans}}>Loading…</div>}
            error={<div style={{color:'#e57373',fontSize:'11px',padding:'20px',fontFamily:sans}}>Failed to load PDF.</div>}
          >
            {/* Single page */}
            {mode==='single'&&(
              <div style={{position:'relative'}}>
                <BookmarkRibbon page={currentPage}/>
                <Page pageNumber={currentPage} width={dw} onLoadSuccess={onPageLoaded}
                  renderTextLayer renderAnnotationLayer/>
              </div>
            )}

            {/* Two-page spread — only renders current page pair */}
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
                    <Page pageNumber={rightPage} width={sw}
                      renderTextLayer renderAnnotationLayer/>
                  </div>
                )}
              </div>
            )}

            {/* Continuous scroll */}
            {mode==='continuous'&&allPages.map(p=>(
              <div key={p} ref={el=>{pageRefs.current[p]=el;}} data-page={p} style={{position:'relative'}}>
                <BookmarkRibbon page={p}/>
                <Page pageNumber={p} width={dw}
                  renderTextLayer={false} renderAnnotationLayer={false}/>
              </div>
            ))}
          </Document>
        ):(
          <div style={{color:FAINT,fontSize:'12px',padding:'40px 20px',fontFamily:sans,textAlign:'center'}}>
            No PDF loaded.
          </div>
        )}
      </div>
    </div>
  );
});

export default PdfViewer;
