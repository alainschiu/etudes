import React,{useState,useEffect,useRef,useCallback} from 'react';
import useViewport from '../hooks/useViewport.js';
import FileText from 'lucide-react/dist/esm/icons/file-text';
import Upload from 'lucide-react/dist/esm/icons/upload';
import Plus from 'lucide-react/dist/esm/icons/plus';
import X from 'lucide-react/dist/esm/icons/x';
import Pause from 'lucide-react/dist/esm/icons/pause';
import Play from 'lucide-react/dist/esm/icons/play';
import Bookmark from 'lucide-react/dist/esm/icons/bookmark';
import Music from 'lucide-react/dist/esm/icons/music';
import Crosshair from 'lucide-react/dist/esm/icons/crosshair';
import Library from 'lucide-react/dist/esm/icons/library';
import Pencil from 'lucide-react/dist/esm/icons/pencil';
import Maximize2 from 'lucide-react/dist/esm/icons/maximize-2';
import Minimize2 from 'lucide-react/dist/esm/icons/minimize-2';
import ChevronLeft from 'lucide-react/dist/esm/icons/chevron-left';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';
import ChevronUp from 'lucide-react/dist/esm/icons/chevron-up';
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down';
import {BG,SURFACE,SURFACE2,TEXT,MUTED,FAINT,DIM,LINE,LINE_MED,LINE_STR,IKB,IKB_SOFT,serif,sans,mono} from '../constants/theme.js';
import {displayTitle,formatByline,getItemTime} from '../lib/items.js';
import {SpotRow} from './shared.jsx';
import PdfViewer from './PdfViewer.jsx';

const SIDEBAR_W=300;
const MIN_DRAWER_H=320;

// ── Spot → PDF page link row ──────────────────────────────────────────────────
// Compact sub-row rendered beneath each SpotRow in the PDF drawer spots tab.
// Stores a direct page number on the spot (spot.pdfPage) so activating it
// auto-jumps the viewer to that page.
function SpotPdfPageRow({page,onSet,onJump}){
  const [editing,setEditing]=useState(false);
  const [val,setVal]=useState('');

  const commit=(raw)=>{
    const n=parseInt(raw,10);
    if(!isNaN(n)&&n>0)onSet(n); else if(page)onSet(page);
    setEditing(false);
  };

  if(editing){
    return(
      <div style={{paddingLeft:'40px',paddingBottom:'5px',display:'flex',alignItems:'center',gap:'6px'}}>
        <input
          autoFocus
          type="text"
          inputMode="numeric"
          placeholder="page #"
          value={val}
          onChange={e=>setVal(e.target.value)}
          onKeyDown={e=>{if(e.key==='Enter')commit(val);else if(e.key==='Escape')setEditing(false);}}
          onBlur={()=>commit(val)}
          style={{width:'52px',background:'transparent',color:TEXT,border:`1px solid ${LINE_MED}`,
            fontSize:'11px',padding:'2px 5px',outline:'none',fontFamily:mono,textAlign:'center'}}
        />
        <span style={{color:FAINT,fontSize:'9px',fontFamily:sans,letterSpacing:'0.18em'}}>PDF page</span>
      </div>
    );
  }

  if(page){
    return(
      <div style={{paddingLeft:'40px',paddingBottom:'5px',display:'flex',alignItems:'center',gap:'8px'}}>
        <button
          onClick={()=>onJump(page)}
          style={{display:'flex',alignItems:'center',gap:'4px',color:IKB,fontSize:'9px',
            letterSpacing:'0.18em',fontFamily:sans,background:'transparent',border:'none',cursor:'pointer'}}>
          <Crosshair style={{width:9,height:9}} strokeWidth={1.5}/>
          p.{page}
        </button>
        <button
          onClick={()=>{setVal(String(page));setEditing(true);}}
          style={{color:FAINT,fontSize:'9px',fontFamily:sans,letterSpacing:'0.18em',
            background:'transparent',border:'none',cursor:'pointer'}}>
          edit
        </button>
        <button
          onClick={()=>onSet(null)}
          style={{color:FAINT,background:'transparent',border:'none',cursor:'pointer',lineHeight:1}}>
          <X style={{width:9,height:9}} strokeWidth={1.5}/>
        </button>
      </div>
    );
  }

  return(
    <div style={{paddingLeft:'40px',paddingBottom:'5px'}}>
      <button
        onClick={()=>{setVal('');setEditing(true);}}
        style={{color:FAINT,fontSize:'9px',letterSpacing:'0.18em',fontFamily:sans,
          background:'transparent',border:'none',cursor:'pointer'}}>
        + link page
      </button>
    </div>
  );
}

export default function PdfDrawer({
  pdfItem,items,pdfUrlMap,pdfLibrary=[],itemTimes,
  activeItemId,activeSpotId,
  startItem,stopItem,updateItem,
  addPdfToItem,attachLibraryPdf,removePdfFromItem,renamePdf,setDefaultPdf,setPdfPageRange,
  addBookmark,removeBookmark,renameBookmark,
  fmt,setPromptModal,setConfirmModal,onClose,dayClosed,
  addSpot,updateSpot,deleteSpot,editSpotTime,
  jumpToPageRef,
}){
  const {isMobile}=useViewport();
  const [activePdfId,setActivePdfId]=useState(pdfItem.defaultPdfId||pdfItem.pdfs?.[0]?.id||null);
  const [dragOver,setDragOver]=useState(false);
  const [renamingId,setRenamingId]=useState(null);
  const [renameVal,setRenameVal]=useState('');
  const [sidebarTab,setSidebarTab]=useState('spots'); // 'spots' | 'bookmarks' | 'library'
  const [drawerH,setDrawerH]=useState(null); // null = fill available height
  const [drawerResizing,setDrawerResizing]=useState(false);
  const [showLibrary,setShowLibrary]=useState(false);
  const [pageRangeEdit,setPageRangeEdit]=useState(null); // attachId being edited
  const [pageRangeVals,setPageRangeVals]=useState({start:'',end:''});
  const [bmName,setBmName]=useState('');
  const [bmPage,setBmPage]=useState('');
  const [bmRenamingId,setBmRenamingId]=useState(null);
  const [bmRenameVal,setBmRenameVal]=useState('');
  const [currentViewPage,setCurrentViewPage]=useState(1);
  const [expanded,setExpanded]=useState(false); // fullscreen modal
  const [sidebarCollapsed,setSidebarCollapsed]=useState(false);
  const viewerRef=useRef(null); // exposed jumpToPage from PdfViewer

  useEffect(()=>{
    if(!pdfItem.pdfs||pdfItem.pdfs.length===0){setActivePdfId(null);return;}
    if(!pdfItem.pdfs.some(p=>p.id===activePdfId))
      setActivePdfId(pdfItem.defaultPdfId||pdfItem.pdfs[0].id);
  },[pdfItem.pdfs,pdfItem.defaultPdfId,activePdfId]);

  const activePdf=pdfItem.pdfs?.find(p=>p.id===activePdfId);
  const activeUrl=activePdf?pdfUrlMap[activePdf.libraryId||activePdf.id]:null;
  const atLimit=(pdfItem.pdfs||[]).length>=5;

  const handleFile=async(file)=>{
    if(!file||file.type!=='application/pdf'){
      setConfirmModal&&setConfirmModal({message:'Please select a PDF file.',confirmLabel:'OK',onConfirm:()=>setConfirmModal(null)});
      return;
    }
    if(atLimit){
      setConfirmModal&&setConfirmModal({message:'Up to 5 PDFs per item.',confirmLabel:'OK',onConfirm:()=>setConfirmModal(null)});
      return;
    }
    const id=await addPdfToItem(pdfItem.id,file,file.name.replace(/\.pdf$/i,''));
    if(id)setActivePdfId(id);
  };

  const onDrop=(e)=>{e.preventDefault();setDragOver(false);const f=e.dataTransfer.files?.[0];if(f)handleFile(f);};
  const onInputChange=(e)=>{const f=e.target.files?.[0];if(f)handleFile(f);e.target.value='';};

  const startRename=(p)=>{setRenamingId(p.id);setRenameVal(p.name);};
  const commitRename=()=>{if(renamingId&&renameVal.trim())renamePdf(pdfItem.id,renamingId,renameVal.trim());setRenamingId(null);};
  const confirmRemove=(p)=>{
    setConfirmModal&&setConfirmModal({
      message:`Remove "${p.name}"?`,
      confirmLabel:'Remove',
      onConfirm:()=>{setConfirmModal(null);removePdfFromItem(pdfItem.id,p.id);},
    });
  };

  // Outer drawer height resize
  const drawerResizeDragStartY=useRef(0);
  const drawerResizeDragStartH=useRef(0);
  const onDrawerResizeMouseDown=(e)=>{
    e.preventDefault();
    e.stopPropagation();
    const currentH=drawerH||(window.innerHeight-48);
    drawerResizeDragStartY.current=e.clientY;
    drawerResizeDragStartH.current=currentH;
    setDrawerResizing(true);
  };
  useEffect(()=>{
    if(!drawerResizing)return;
    const maxH=window.innerHeight-48;
    const move=(e)=>{
      const delta=e.clientY-drawerResizeDragStartY.current;
      setDrawerH(Math.max(MIN_DRAWER_H,Math.min(maxH,drawerResizeDragStartH.current+delta)));
    };
    const up=()=>setDrawerResizing(false);
    window.addEventListener('mousemove',move);
    window.addEventListener('mouseup',up);
    return()=>{window.removeEventListener('mousemove',move);window.removeEventListener('mouseup',up);};
  },[drawerResizing]);

  const isActiveWhole=activeItemId===pdfItem.id&&!activeSpotId;
  const isActiveAny=activeItemId===pdfItem.id;
  const spots=pdfItem.spots||[];
  const bookmarks=activePdf?.bookmarks||[];

  // Attach from library
  const handleAttachLibrary=(libId)=>{
    if(atLimit)return;
    const id=attachLibraryPdf&&attachLibraryPdf(pdfItem.id,libId,null,null,null);
    if(id)setActivePdfId(id);
    setShowLibrary(false);
  };

  // Page range editing
  const openPageRangeEdit=(att)=>{
    setPageRangeEdit(att.id);
    setPageRangeVals({start:att.startPage??'',end:att.endPage??''});
  };
  const commitPageRange=()=>{
    if(pageRangeEdit){
      const s=parseInt(pageRangeVals.start,10)||null;
      const e=parseInt(pageRangeVals.end,10)||null;
      setPdfPageRange&&setPdfPageRange(pdfItem.id,pageRangeEdit,s,e);
    }
    setPageRangeEdit(null);
  };

  // Add bookmark
  const handleAddBookmark=()=>{
    if(!activePdfId||!bmName.trim())return;
    const page=parseInt(bmPage,10)||currentViewPage||1;
    addBookmark&&addBookmark(pdfItem.id,activePdfId,bmName.trim(),page);
    setBmName('');setBmPage('');
  };
  const commitBmRename=()=>{
    if(bmRenamingId&&bmRenameVal.trim())
      renameBookmark&&renameBookmark(pdfItem.id,activePdfId,bmRenamingId,bmRenameVal.trim());
    setBmRenamingId(null);
  };
  const jumpToBookmark=(bm)=>{
    viewerRef.current?.jumpToPage(bm.page);
  };

  // P6: Auto-jump when a spot with a linked bookmark or pdfPage becomes active
  useEffect(()=>{
    if(!activeSpotId||activeItemId!==pdfItem.id)return;
    const spot=(pdfItem.spots||[]).find(s=>s.id===activeSpotId);
    if(!spot)return;
    // Bookmark-linked jump (existing)
    if(spot.bookmarkId&&spot.pdfAttachmentId){
      const att=(pdfItem.pdfs||[]).find(p=>p.id===spot.pdfAttachmentId);
      if(!att)return;
      const bm=(att.bookmarks||[]).find(b=>b.id===spot.bookmarkId);
      if(!bm)return;
      setActivePdfId(att.id);
      setTimeout(()=>{viewerRef.current?.jumpToPage(bm.page);},80);
    }
    // Direct page jump (new — spot.pdfPage)
    else if(spot.pdfPage){
      setTimeout(()=>{viewerRef.current?.jumpToPage(spot.pdfPage);},80);
    }
  },[activeSpotId,activeItemId,pdfItem.id,pdfItem.spots,pdfItem.pdfs]);

  // Library: PDFs in library not yet attached to this item
  const attachedLibraryIds=new Set((pdfItem.pdfs||[]).map(p=>p.libraryId));
  const availableLibrary=(pdfLibrary||[]).filter(e=>!attachedLibraryIds.has(e.id));

  const eIn={background:'transparent',color:TEXT,border:'none',outline:'none',fontFamily:mono,fontSize:'11px'};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{padding:(isMobile||expanded)?0:'24px',background:'rgba(0,0,0,0.85)',backdropFilter:'blur(8px)'}}>
      <div className="absolute inset-0" onClick={onClose}/>
      <div className="relative flex flex-col" style={{width:'100%',maxWidth:expanded?'100%':'112rem',height:(drawerH&&!expanded)?`${drawerH}px`:'100%',background:BG,border:expanded?'none':`1px solid ${LINE_STR}`,boxShadow:expanded?'none':'0 20px 60px rgba(0,0,0,0.8)'}}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 gap-3 shrink-0" style={{borderBottom:`1px solid ${LINE_MED}`}}>
          <div className="min-w-0 flex-1">
            <div className="uppercase" style={{color:FAINT,fontSize:'10px',letterSpacing:'0.32em'}}>Score</div>
            <h3 className="text-xl mt-0.5 truncate" style={{fontFamily:serif,fontWeight:300}}>
              {formatByline(pdfItem)&&<span className="italic" style={{color:MUTED}}>{formatByline(pdfItem)} — </span>}
              {displayTitle(pdfItem)}
              {pdfItem.catalog&&<span className="italic ml-2" style={{color:FAINT,fontSize:'14px'}}>{pdfItem.catalog}</span>}
              {pdfItem.instrument&&<span className="uppercase ml-3" style={{color:FAINT,fontSize:'10px',letterSpacing:'0.22em'}}>· {pdfItem.instrument}</span>}
            </h3>
            {pdfItem.referenceUrl&&<a href={pdfItem.referenceUrl} target="_blank" rel="noopener noreferrer" className="uppercase flex items-center gap-1.5 mt-1" style={{color:IKB,fontSize:'9px',letterSpacing:'0.22em'}}><Music className="w-3 h-3" strokeWidth={1.25}/> Reference ↗</a>}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={()=>{isActiveAny?stopItem():startItem(pdfItem.id);}}
              disabled={dayClosed&&!isActiveAny}
              className="uppercase px-3 py-2 flex items-center gap-1.5"
              style={isActiveWhole
                ?{background:IKB,color:TEXT,border:`1px solid ${IKB}`,boxShadow:`0 0 15px ${IKB}60`,fontSize:'10px',letterSpacing:'0.22em'}
                :{background:'transparent',color:dayClosed?FAINT:TEXT,border:`1px solid ${LINE_STR}`,fontSize:'10px',letterSpacing:'0.22em',cursor:(dayClosed&&!isActiveAny)?'not-allowed':'pointer'}}>
              {isActiveAny?<><Pause className="w-3 h-3" strokeWidth={1.25}/> Pause</>:<><Play className="w-3 h-3" strokeWidth={1.25}/> {dayClosed?'Closed':'Whole piece'}</>}
            </button>
            <button onClick={()=>setExpanded(v=>!v)} title={expanded?'Restore':'Expand'} style={{color:MUTED}}>
              {expanded?<Minimize2 className="w-4 h-4" strokeWidth={1.25}/>:<Maximize2 className="w-4 h-4" strokeWidth={1.25}/>}
            </button>
            <button onClick={onClose} style={{color:MUTED}}><X className="w-4 h-4" strokeWidth={1.25}/></button>
          </div>
        </div>

        {/* Tab bar — score attachments */}
        <div className="flex items-center gap-0 overflow-x-auto shrink-0" style={{borderBottom:`1px solid ${LINE}`,background:SURFACE}}>
          {(pdfItem.pdfs||[]).map(p=>{
            const active=p.id===activePdfId;
            const isD=p.id===pdfItem.defaultPdfId;
            const ren=renamingId===p.id;
            return (
              <div key={p.id} className="group flex items-center gap-2 px-4 py-2.5 shrink-0"
                style={{borderRight:`1px solid ${LINE}`,borderBottom:active?`2px solid ${IKB}`:'2px solid transparent',background:active?IKB_SOFT:'transparent',cursor:ren?'default':'pointer'}}
                onClick={()=>{if(!ren)setActivePdfId(p.id);}}
                onDoubleClick={()=>startRename(p)}>
                {isD&&<Bookmark className="w-3 h-3 shrink-0" strokeWidth={1.25} style={{color:IKB}}/>}
                {ren?(
                  <input autoFocus value={renameVal} onChange={e=>setRenameVal(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={e=>{if(e.key==='Enter')commitRename();else if(e.key==='Escape')setRenamingId(null);}}
                    onClick={e=>e.stopPropagation()}
                    className="focus:outline-none px-1"
                    style={{background:SURFACE2,color:TEXT,border:`1px solid ${LINE_MED}`,fontSize:'12px',width:'120px'}}/>
                ):(
                  <span style={{fontSize:'12px',fontWeight:active?400:300,color:active?TEXT:MUTED,maxWidth:'180px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.name}</span>
                )}
                {active&&!ren&&(
                  <div className="flex items-center gap-1">
                    <button onClick={e=>{e.stopPropagation();startRename(p);}} className="opacity-0 group-hover:opacity-100" style={{color:FAINT,fontSize:'9px',letterSpacing:'0.2em'}}>edit</button>
                    {!isD&&<button onClick={e=>{e.stopPropagation();setDefaultPdf(pdfItem.id,p.id);}} className="opacity-0 group-hover:opacity-100" style={{color:FAINT}}><Bookmark className="w-3 h-3" strokeWidth={1.25}/></button>}
                    <button onClick={e=>{e.stopPropagation();openPageRangeEdit(p);}} className="opacity-0 group-hover:opacity-100" style={{color:FAINT,fontSize:'9px',letterSpacing:'0.2em'}}>range</button>
                    <button onClick={e=>{e.stopPropagation();confirmRemove(p);}} className="opacity-0 group-hover:opacity-100" style={{color:FAINT}}><X className="w-3 h-3" strokeWidth={1.25}/></button>
                  </div>
                )}
              </div>
            );
          })}
          {!atLimit&&(
            <label className="flex items-center gap-1.5 px-4 py-2.5 cursor-pointer shrink-0" style={{color:FAINT,fontSize:'11px',letterSpacing:'0.2em'}}>
              <Plus className="w-3 h-3" strokeWidth={1.25}/> Upload
              <input type="file" accept="application/pdf" className="hidden" onChange={onInputChange}/>
            </label>
          )}
          {!atLimit&&availableLibrary.length>0&&(
            <button className="flex items-center gap-1.5 px-4 py-2.5 shrink-0" style={{color:FAINT,fontSize:'11px',letterSpacing:'0.2em'}}
              onClick={()=>setShowLibrary(v=>!v)}>
              <Library className="w-3 h-3" strokeWidth={1.25}/> From library
            </button>
          )}
          <div className="ml-auto px-4 py-2.5 uppercase shrink-0" style={{color:DIM,fontSize:'9px',letterSpacing:'0.22em'}}>{(pdfItem.pdfs||[]).length}/5</div>
        </div>

        {/* Page range quick edit */}
        {pageRangeEdit&&(
          <div className="flex items-center gap-3 px-6 py-2 shrink-0" style={{borderBottom:`1px solid ${LINE}`,background:SURFACE2}}>
            <span style={{color:FAINT,fontSize:'10px',letterSpacing:'0.22em',fontFamily:sans}}>PAGE RANGE</span>
            <input type="number" placeholder="Start" min="1" value={pageRangeVals.start}
              onChange={e=>setPageRangeVals(v=>({...v,start:e.target.value}))}
              style={{...eIn,width:'60px',border:`1px solid ${LINE_MED}`,padding:'2px 6px'}}/>
            <span style={{color:FAINT}}>–</span>
            <input type="number" placeholder="End" min="1" value={pageRangeVals.end}
              onChange={e=>setPageRangeVals(v=>({...v,end:e.target.value}))}
              style={{...eIn,width:'60px',border:`1px solid ${LINE_MED}`,padding:'2px 6px'}}/>
            <button onClick={commitPageRange} style={{color:IKB,fontSize:'10px',letterSpacing:'0.22em',fontFamily:sans}}>Save</button>
            <button onClick={()=>setPageRangeEdit(null)} style={{color:FAINT}}><X className="w-3 h-3" strokeWidth={1.25}/></button>
          </div>
        )}

        {/* Library picker */}
        {showLibrary&&(
          <div className="flex items-center gap-3 px-6 py-3 shrink-0 overflow-x-auto" style={{borderBottom:`1px solid ${LINE}`,background:SURFACE2}}>
            <span style={{color:FAINT,fontSize:'10px',letterSpacing:'0.22em',fontFamily:sans}}>LIBRARY</span>
            {availableLibrary.map(e=>(
              <button key={e.id} onClick={()=>handleAttachLibrary(e.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 shrink-0"
                style={{border:`1px solid ${LINE_MED}`,color:TEXT,fontSize:'11px'}}>
                <FileText className="w-3 h-3" strokeWidth={1.25} style={{color:FAINT}}/> {e.name}
              </button>
            ))}
            {availableLibrary.length===0&&<span style={{color:DIM,fontSize:'11px',fontStyle:'italic'}}>No other PDFs in library.</span>}
            <button onClick={()=>setShowLibrary(false)} style={{color:FAINT,marginLeft:'auto'}}><X className="w-3 h-3" strokeWidth={1.25}/></button>
          </div>
        )}

        {/* Main body: viewer + sidebar */}
        <div className="flex-1 flex overflow-hidden" style={{userSelect:drawerResizing?'none':'auto',flexDirection:isMobile?'column':'row'}}>

          {/* PDF viewer area */}
          <div className="flex-1 relative overflow-hidden"
            style={{background:'rgba(255,255,255,0.02)'}}
            onDragOver={e=>{e.preventDefault();setDragOver(true);}}
            onDragLeave={()=>setDragOver(false)}
            onDrop={onDrop}>
            {activeUrl?(
              <PdfViewer
                ref={viewerRef}
                url={activeUrl}
                startPage={activePdf?.startPage||null}
                endPage={activePdf?.endPage||null}
                bookmarks={activePdf?.bookmarks||[]}
                onPageChange={setCurrentViewPage}
                dragging={drawerResizing}
                onAddBookmark={addBookmark?(name,page)=>{
                  addBookmark(pdfItem.id,activePdfId,name,page);
                }:undefined}
              />
            ):activePdf?(
              <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                <FileText className="w-10 h-10 mb-5" strokeWidth={1} style={{color:DIM}}/>
                <p className="uppercase mb-3" style={{color:FAINT,fontSize:'10px',letterSpacing:'0.32em'}}>Attached on another device</p>
                <p className="text-sm max-w-sm italic" style={{color:MUTED,fontFamily:serif,fontSize:'15px',lineHeight:1.6}}>This score is not available here.</p>
              </div>
            ):(
              <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                <FileText className="w-10 h-10 mb-5" strokeWidth={1} style={{color:DIM}}/>
                <p className="uppercase mb-3" style={{color:FAINT,fontSize:'10px',letterSpacing:'0.32em'}}>No score attached</p>
                <p className="text-sm mb-6 max-w-sm italic" style={{color:MUTED,fontFamily:serif,fontSize:'15px',lineHeight:1.6}}>Upload a PDF or drag one here.</p>
                <label className="px-4 py-2 uppercase cursor-pointer flex items-center gap-2" style={{background:IKB,color:TEXT,fontSize:'10px',letterSpacing:'0.22em'}}>
                  <Upload className="w-3 h-3" strokeWidth={1.25}/> Upload PDF
                  <input type="file" accept="application/pdf" className="hidden" onChange={onInputChange}/>
                </label>
              </div>
            )}
            {dragOver&&(
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{background:`${IKB}20`,border:`2px dashed ${IKB}`,boxShadow:`inset 0 0 40px ${IKB}30`}}>
                <div className="px-6 py-4 flex items-center gap-3" style={{background:BG,border:`1px solid ${IKB}`}}>
                  <Upload className="w-5 h-5" strokeWidth={1.25} style={{color:IKB}}/>
                  <span className="uppercase" style={{color:TEXT,fontSize:'11px',letterSpacing:'0.28em'}}>Drop to upload PDF</span>
                </div>
              </div>
            )}
          </div>


          {/* Collapsed stub — desktop (right strip) or mobile (bottom bar) */}
          {sidebarCollapsed&&(isMobile?(
            <div style={{height:'36px',flexShrink:0,borderTop:`1px solid ${LINE_MED}`,
              display:'flex',alignItems:'center',justifyContent:'center',background:SURFACE}}>
              <button
                onClick={()=>setSidebarCollapsed(false)}
                title="Expand panel"
                style={{display:'flex',alignItems:'center',gap:'5px',color:FAINT,
                  background:'transparent',border:'none',cursor:'pointer',
                  fontFamily:sans,fontSize:'9px',letterSpacing:'0.22em',textTransform:'uppercase'}}>
                <ChevronUp className="w-3.5 h-3.5" strokeWidth={1.25}/>
                Spots &amp; Marks
              </button>
            </div>
          ):(
            <div style={{width:'28px',flexShrink:0,borderLeft:`1px solid ${LINE_MED}`,
              display:'flex',flexDirection:'column',alignItems:'center',paddingTop:'8px',
              background:SURFACE}}>
              <button
                onClick={()=>setSidebarCollapsed(false)}
                title="Expand panel"
                style={{color:FAINT,padding:'4px',display:'flex',alignItems:'center',justifyContent:'center',
                  background:'transparent',border:'none',cursor:'pointer'}}>
                <ChevronLeft className="w-3.5 h-3.5" strokeWidth={1.25}/>
              </button>
            </div>
          ))}

          {/* Sidebar — visible when expanded */}
          {!sidebarCollapsed&&(
          <div style={isMobile?{height:'240px',flexShrink:0,display:'flex',flexDirection:'column',overflow:'hidden',borderTop:`1px solid ${LINE_MED}`}:{width:SIDEBAR_W,flexShrink:0,display:'flex',flexDirection:'column',overflow:'hidden',borderLeft:`1px solid ${LINE_MED}`}}>
            {/* Sidebar tabs + collapse button */}
            <div className="flex items-center shrink-0" style={{borderBottom:`1px solid ${LINE}`}}>
              {[{id:'spots',icon:<Crosshair className="w-3 h-3" strokeWidth={1.25}/>,label:'Spots'},
                {id:'bookmarks',icon:<Bookmark className="w-3 h-3" strokeWidth={1.25}/>,label:'Marks'},
              ].map(t=>(
                <button key={t.id} onClick={()=>setSidebarTab(t.id)}
                  className="flex items-center gap-1.5 px-4 py-2.5 uppercase"
                  style={{fontSize:'9px',letterSpacing:'0.22em',color:sidebarTab===t.id?TEXT:FAINT,borderBottom:sidebarTab===t.id?`2px solid ${IKB}`:'2px solid transparent',background:'transparent'}}>
                  {t.icon}{t.label}
                </button>
              ))}
              <button
                onClick={()=>setSidebarCollapsed(true)}
                title="Collapse panel"
                style={{marginLeft:'auto',padding:'0 10px',color:FAINT,height:'100%',display:'flex',
                  alignItems:'center',background:'transparent',border:'none',cursor:'pointer'}}>
                {isMobile
                  ?<ChevronDown className="w-3.5 h-3.5" strokeWidth={1.25}/>
                  :<ChevronRight className="w-3.5 h-3.5" strokeWidth={1.25}/>}
              </button>
            </div>

            {/* Time row */}
            <div className="px-4 py-3 shrink-0" style={{borderBottom:`1px solid ${LINE}`}}>
              <div className="uppercase" style={{color:FAINT,fontSize:'10px',letterSpacing:'0.28em'}}>Today</div>
              <div className="text-xs font-mono tabular-nums mt-0.5" style={{color:MUTED,fontWeight:300}}>{fmt(getItemTime(itemTimes,pdfItem.id))}</div>
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-auto">
              {sidebarTab==='spots'&&(
                <div className="px-4 py-3">
                  {activePdf?.startPage&&activeUrl&&(
                    <button
                      onClick={()=>viewerRef.current?.jumpToPage(activePdf.startPage)}
                      className="flex items-center gap-1.5 mb-3 uppercase"
                      style={{color:IKB,fontSize:'9px',letterSpacing:'0.22em',fontFamily:sans}}>
                      <Crosshair className="w-3 h-3" strokeWidth={1.25}/>
                      Jump to piece start · p.{activePdf.startPage}
                    </button>
                  )}
                  {spots.length>0&&(
                    <div style={{background:SURFACE2,border:`1px solid ${LINE}`,marginBottom:'8px'}}>
                      {spots.map((s,idx)=>(
                        <div key={s.id} style={{borderBottom:idx<spots.length-1?`1px solid ${LINE}`:'none'}}>
                          <SpotRow spot={s} itemId={pdfItem.id} itemTimes={itemTimes}
                            isActive={activeItemId===pdfItem.id&&activeSpotId===s.id}
                            onStart={()=>startItem(pdfItem.id,s.id)} onStop={stopItem}
                            onRename={(label)=>updateSpot(pdfItem.id,s.id,{label})}
                            onDelete={()=>deleteSpot(pdfItem.id,s.id)}
                            onEditTime={editSpotTime?(v)=>editSpotTime(pdfItem.id,s.id,v):undefined}
                            onPdfPageJump={s.pdfPage?(pg)=>viewerRef.current?.jumpToPage(pg):undefined}
                            dayClosed={dayClosed} compact/>
                          {activeUrl&&(
                            <SpotPdfPageRow
                              page={s.pdfPage||null}
                              onSet={(pg)=>updateSpot(pdfItem.id,s.id,{pdfPage:pg})}
                              onJump={(pg)=>viewerRef.current?.jumpToPage(pg)}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  <button onClick={()=>addSpot(pdfItem.id,'New spot')}
                    className="uppercase flex items-center gap-1.5 italic"
                    style={{color:MUTED,fontFamily:serif,fontSize:'12px'}}>
                    <Plus className="w-3 h-3 not-italic" strokeWidth={1.25}/> Add spot
                  </button>
                  <textarea value={pdfItem.todayNote||''} onChange={e=>updateItem(pdfItem.id,{todayNote:e.target.value})}
                    placeholder="Today's notes…" className="w-full resize-none focus:outline-none mt-4"
                    rows={5}
                    style={{background:'transparent',color:TEXT,fontFamily:serif,fontSize:'13px',lineHeight:1.7,fontWeight:300,border:`1px solid ${LINE}`,padding:'8px'}}/>
                </div>
              )}

              {sidebarTab==='bookmarks'&&(
                <div className="px-4 py-3">
                  {/* Current page indicator + jump to piece start */}
                  <div className="flex items-center justify-between mb-3">
                    {activeUrl&&<div style={{color:FAINT,fontSize:'10px',fontFamily:mono}}>Viewing p.{currentViewPage}</div>}
                    {activePdf?.startPage&&activeUrl&&(
                      <button
                        onClick={()=>viewerRef.current?.jumpToPage(activePdf.startPage)}
                        className="flex items-center gap-1 uppercase"
                        style={{color:IKB,fontSize:'9px',letterSpacing:'0.22em',fontFamily:sans}}>
                        <Crosshair className="w-3 h-3" strokeWidth={1.25}/>
                        p.{activePdf.startPage}
                      </button>
                    )}
                  </div>

                  {/* Bookmark list */}
                  {bookmarks.length>0&&(
                    <div style={{border:`1px solid ${LINE}`,marginBottom:'12px'}}>
                      {bookmarks.map((bm,idx)=>(
                        <div key={bm.id} className="group flex items-center gap-2 px-3 py-2"
                          style={{borderBottom:idx<bookmarks.length-1?`1px solid ${LINE}`:'none',cursor:'pointer'}}
                          onClick={()=>jumpToBookmark(bm)}>
                          <Bookmark className="w-3 h-3 shrink-0" strokeWidth={1.25} style={{color:IKB}}/>
                          {bmRenamingId===bm.id?(
                            <input autoFocus value={bmRenameVal} onChange={e=>setBmRenameVal(e.target.value)}
                              onBlur={commitBmRename}
                              onKeyDown={e=>{if(e.key==='Enter')commitBmRename();else if(e.key==='Escape')setBmRenamingId(null);}}
                              onClick={e=>e.stopPropagation()}
                              className="flex-1 focus:outline-none"
                              style={{background:SURFACE2,color:TEXT,border:`1px solid ${LINE_MED}`,fontSize:'11px',padding:'1px 4px'}}/>
                          ):(
                            <span className="flex-1 truncate" style={{fontSize:'12px',color:TEXT}}>{bm.name}</span>
                          )}
                          <span style={{color:FAINT,fontSize:'10px',fontFamily:mono,flexShrink:0}}>p.{bm.page}</span>
                          <button onClick={e=>{e.stopPropagation();setBmRenamingId(bm.id);setBmRenameVal(bm.name);}}
                            className="opacity-0 group-hover:opacity-100 shrink-0" style={{color:FAINT}}>
                            <Pencil className="w-3 h-3" strokeWidth={1.25}/>
                          </button>
                          <button onClick={e=>{e.stopPropagation();removeBookmark&&removeBookmark(pdfItem.id,activePdfId,bm.id);}}
                            className="opacity-0 group-hover:opacity-100 shrink-0" style={{color:FAINT}}>
                            <X className="w-3 h-3" strokeWidth={1.25}/>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add bookmark form */}
                  {activePdf&&(
                    <div style={{border:`1px solid ${LINE}`,padding:'10px'}}>
                      <div style={{color:FAINT,fontSize:'9px',letterSpacing:'0.22em',marginBottom:'8px',fontFamily:sans}}>ADD BOOKMARK</div>
                      <input
                        type="text" placeholder="Bookmark name" value={bmName}
                        onChange={e=>setBmName(e.target.value)}
                        onKeyDown={e=>{if(e.key==='Enter')handleAddBookmark();}}
                        style={{width:'100%',background:'transparent',color:TEXT,border:`1px solid ${LINE_MED}`,fontSize:'12px',padding:'4px 6px',outline:'none',marginBottom:'6px'}}/>
                      <div className="flex items-center gap-2">
                        <input
                          type="number" placeholder={`p.${currentViewPage}`} value={bmPage} min="1"
                          onChange={e=>setBmPage(e.target.value)}
                          style={{width:'60px',background:'transparent',color:TEXT,border:`1px solid ${LINE_MED}`,fontSize:'12px',padding:'4px 6px',outline:'none',fontFamily:mono}}/>
                        <span style={{color:FAINT,fontSize:'10px'}}>page</span>
                        <button onClick={handleAddBookmark}
                          style={{marginLeft:'auto',color:IKB,fontSize:'10px',letterSpacing:'0.22em',fontFamily:sans}}>
                          Add
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Persistent notes */}
            <textarea value={pdfItem.detail} onChange={e=>updateItem(pdfItem.id,{detail:e.target.value})}
              placeholder="Long-running notes…" className="resize-none focus:outline-none"
              rows={5}
              style={{background:'transparent',color:TEXT,fontFamily:serif,fontSize:'13px',lineHeight:1.7,fontWeight:300,padding:'12px',borderTop:`1px solid ${LINE}`,flexShrink:0}}/>
          </div>
          )}
        </div>

        {/* Bottom resize handle — drag to resize the whole drawer height */}
        {!isMobile&&!expanded&&(
          <div
            onMouseDown={onDrawerResizeMouseDown}
            style={{height:'10px',flexShrink:0,cursor:'row-resize',
              background:drawerResizing?IKB:'rgba(244,238,227,0.05)',
              transition:'background 0.12s',
              display:'flex',alignItems:'center',justifyContent:'center',
              borderTop:`1px solid ${LINE}`}}
          >
            <div style={{height:'3px',width:'40px',borderRadius:'2px',
              backgroundImage:'radial-gradient(circle,currentColor 1px,transparent 1px)',
              backgroundSize:'6px 3px',
              color:drawerResizing?'rgba(255,255,255,0.9)':'rgba(255,255,255,0.25)'}}/>
          </div>
        )}
      </div>
    </div>
  );
}
