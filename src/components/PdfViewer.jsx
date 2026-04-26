import React,{useState,useEffect,useRef,useCallback,useImperativeHandle,forwardRef} from 'react';
import {Document,Page} from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import {ChevronLeft,ChevronRight,ZoomIn,ZoomOut,AlignCenter,AlignJustify,Maximize2} from 'lucide-react';
import {BG,SURFACE2,TEXT,MUTED,FAINT,LINE,LINE_MED,LINE_STR,IKB,sans,mono} from '../constants/theme.js';

const BTN={background:'transparent',border:`1px solid ${LINE_MED}`,color:TEXT,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',width:'28px',height:'28px',flexShrink:0};
const BTN_ACT={...BTN,background:IKB,border:`1px solid ${IKB}`};

// PdfViewer — renders a PDF with P3 controls.
// Exposed via ref: { jumpToPage(n) }
// Props:
//   url: blob URL string
//   startPage: first page of range (1-based, optional)
//   endPage: last page of range (1-based, optional)
//   onPageChange(n): called when visible page changes
const PdfViewer=forwardRef(function PdfViewer({url,startPage=1,endPage=null,onPageChange},ref){
  const [numPages,setNumPages]=useState(null);
  const [currentPage,setCurrentPage]=useState(startPage||1);
  const [zoom,setZoom]=useState(1.0);
  const [mode,setMode]=useState('single'); // 'single' | 'continuous'
  const [fitMode,setFitMode]=useState('width'); // 'width' | 'page'
  const [containerW,setContainerW]=useState(0);
  const [containerH,setContainerH]=useState(0);
  const [pageSize,setPageSize]=useState({width:612,height:792});
  const containerRef=useRef(null);
  const scrollRefs=useRef({});

  const effectiveStart=startPage||1;
  const effectiveEnd=endPage&&numPages?Math.min(endPage,numPages):numPages;

  // Measure container
  useEffect(()=>{
    if(!containerRef.current)return;
    const ro=new ResizeObserver(entries=>{
      for(const e of entries){
        setContainerW(e.contentRect.width);
        setContainerH(e.contentRect.height);
      }
    });
    ro.observe(containerRef.current);
    return()=>ro.disconnect();
  },[]);

  // Reset on url/range change
  useEffect(()=>{setCurrentPage(startPage||1);setNumPages(null);},[url,startPage]);

  const onDocLoaded=({numPages:n})=>{setNumPages(n);};

  const onPageLoaded=(pg)=>{
    setPageSize(prev=>({...prev,width:pg.originalWidth,height:pg.originalHeight}));
  };

  // Compute display width for current zoom/fit
  const displayWidth=useCallback(()=>{
    if(!containerW)return undefined;
    if(fitMode==='width')return containerW*zoom;
    // fit-to-page: scale so height fits container height
    const scaleH=containerH/(pageSize.height||792);
    const w=(pageSize.width||612)*scaleH*zoom;
    return w;
  },[containerW,containerH,fitMode,zoom,pageSize]);

  const jumpToPage=useCallback((pg)=>{
    const clamped=Math.max(effectiveStart,Math.min(effectiveEnd||pg,pg));
    setCurrentPage(clamped);
    if(mode==='continuous'){
      const el=scrollRefs.current[clamped];
      if(el)el.scrollIntoView({behavior:'smooth',block:'start'});
    }
    onPageChange&&onPageChange(clamped);
  },[effectiveStart,effectiveEnd,mode,onPageChange]);

  useImperativeHandle(ref,()=>({jumpToPage}),[jumpToPage]);

  const prevPage=()=>jumpToPage(currentPage-1);
  const nextPage=()=>jumpToPage(currentPage+1);
  const zoomIn=()=>setZoom(z=>Math.min(z+0.25,4));
  const zoomOut=()=>setZoom(z=>Math.max(z-0.25,0.25));

  // In continuous mode, track visible page via IntersectionObserver
  useEffect(()=>{
    if(mode!=='continuous'||!numPages)return;
    const els=Object.entries(scrollRefs.current);
    if(!els.length)return;
    const obs=new IntersectionObserver(entries=>{
      const visible=entries.filter(e=>e.isIntersecting);
      if(visible.length){
        const topmost=visible.reduce((a,b)=>a.boundingClientRect.top<b.boundingClientRect.top?a:b);
        const pg=parseInt(topmost.target.dataset.page,10);
        setCurrentPage(pg);
        onPageChange&&onPageChange(pg);
      }
    },{threshold:0.3});
    els.forEach(([,el])=>{if(el)obs.observe(el);});
    return()=>obs.disconnect();
  },[mode,numPages,onPageChange]);

  const pages=[];
  if(numPages){
    const s=effectiveStart;
    const e2=effectiveEnd||numPages;
    for(let p=s;p<=e2;p++)pages.push(p);
  }

  const dw=displayWidth();

  return(
    <div style={{display:'flex',flexDirection:'column',height:'100%',background:BG,overflow:'hidden'}}>
      {/* Toolbar */}
      <div style={{display:'flex',alignItems:'center',gap:'6px',padding:'6px 10px',borderBottom:`1px solid ${LINE}`,flexShrink:0,flexWrap:'wrap'}}>
        {/* Fit mode */}
        <button style={fitMode==='width'?BTN_ACT:BTN} onClick={()=>setFitMode('width')} title="Fit to width"><AlignJustify style={{width:12,height:12}}/></button>
        <button style={fitMode==='page'?BTN_ACT:BTN} onClick={()=>setFitMode('page')} title="Fit to page"><Maximize2 style={{width:12,height:12}}/></button>
        <div style={{width:1,background:LINE_MED,height:18,margin:'0 2px'}}/>
        {/* Zoom */}
        <button style={BTN} onClick={zoomOut} title="Zoom out"><ZoomOut style={{width:12,height:12}}/></button>
        <span style={{color:MUTED,fontSize:'10px',fontFamily:mono,minWidth:36,textAlign:'center'}}>{Math.round(zoom*100)}%</span>
        <button style={BTN} onClick={zoomIn} title="Zoom in"><ZoomIn style={{width:12,height:12}}/></button>
        <div style={{width:1,background:LINE_MED,height:18,margin:'0 2px'}}/>
        {/* Scroll mode */}
        <button style={mode==='single'?BTN_ACT:BTN} onClick={()=>setMode('single')} title="Single page"><AlignCenter style={{width:12,height:12}}/></button>
        <button style={mode==='continuous'?BTN_ACT:BTN} onClick={()=>setMode('continuous')} title="Continuous scroll"><AlignJustify style={{width:12,height:12}}/></button>
        <div style={{width:1,background:LINE_MED,height:18,margin:'0 2px'}}/>
        {/* Page nav */}
        <button style={BTN} onClick={prevPage} disabled={currentPage<=effectiveStart}><ChevronLeft style={{width:12,height:12}}/></button>
        <span style={{color:TEXT,fontSize:'11px',fontFamily:mono,minWidth:52,textAlign:'center'}}>
          {currentPage}{effectiveEnd&&numPages?` / ${effectiveEnd-effectiveStart+1}`:(numPages?` / ${numPages}`:'')}
        </span>
        <button style={BTN} onClick={nextPage} disabled={currentPage>=(effectiveEnd||numPages||1)}><ChevronRight style={{width:12,height:12}}/></button>
      </div>

      {/* Document area */}
      <div ref={containerRef} style={{flex:1,overflow:'auto',padding:'12px',display:'flex',flexDirection:'column',alignItems:'center',gap:mode==='continuous'?'12px':0}}>
        {url&&(
          <Document file={url} onLoadSuccess={onDocLoaded} loading={<div style={{color:FAINT,fontSize:'11px',padding:'20px',fontFamily:sans}}>Loading…</div>} error={<div style={{color:'#e57373',fontSize:'11px',padding:'20px',fontFamily:sans}}>Failed to load PDF.</div>}>
            {mode==='single'?(
              <div ref={el=>{scrollRefs.current[currentPage]=el;}} data-page={currentPage}>
                <Page
                  pageNumber={currentPage}
                  width={dw}
                  onLoadSuccess={onPageLoaded}
                  renderTextLayer
                  renderAnnotationLayer
                />
              </div>
            ):(
              pages.map(p=>(
                <div key={p} ref={el=>{scrollRefs.current[p]=el;}} data-page={p}>
                  <Page
                    pageNumber={p}
                    width={dw}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                  />
                </div>
              ))
            )}
          </Document>
        )}
        {!url&&<div style={{color:FAINT,fontSize:'12px',padding:'40px 20px',fontFamily:sans,textAlign:'center'}}>No PDF loaded.</div>}
      </div>
    </div>
  );
});

export default PdfViewer;
