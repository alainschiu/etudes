import React from 'react';
import {BG, TEXT, MUTED, FAINT, LINE, LINE_STR, IKB, serif, serifText, sans} from '../constants/theme.js';

/**
 * Top-level React error boundary around the view router. Catches render-time
 * throws (e.g. corrupt localStorage shape after a migration, an unexpected
 * undefined deref) and renders a quiet fallback so the user still has a path
 * to reload — and to export their journal even if the UI is broken.
 *
 * Scoped to <main> in App.jsx, not the whole tree, so the Footer/TopBar stay
 * functional when a single view fails.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props){
    super(props);
    this.state = {hasError: false, error: null};
  }

  static getDerivedStateFromError(error){
    return {hasError: true, error};
  }

  componentDidCatch(error, info){
    // eslint-disable-next-line no-console
    console.error('Études — view crashed:', error, info?.componentStack);
  }

  handleReload = () => {
    this.setState({hasError: false, error: null});
    window.location.reload();
  };

  handleExport = () => {
    try { this.props.onExport?.(); }
    catch (e) { /* swallow — this is a recovery path, not a guarantee */ }
  };

  render(){
    if (!this.state.hasError) return this.props.children;
    return (
      <div style={{flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'48px 24px', background:BG}}>
        <div style={{maxWidth:'420px', width:'100%'}}>
          <div className="uppercase mb-4" style={{color:FAINT, fontFamily:sans, fontSize:'10px', letterSpacing:'0.32em'}}>Something didn't load.</div>
          <p style={{fontFamily:serifText, fontSize:'15px', lineHeight:1.7, color:MUTED, fontWeight:300}}>
            Try reloading. If it keeps failing, export a backup so you can restore your journal in a fresh session.
          </p>
          <div className="mt-7 flex flex-col gap-2">
            <button onClick={this.handleReload} className="w-full py-2.5 uppercase" style={{background:IKB, color:TEXT, fontFamily:sans, fontSize:'10px', letterSpacing:'0.28em', border:'none', cursor:'pointer'}}>
              Reload
            </button>
            {this.props.onExport && (
              <button onClick={this.handleExport} className="w-full py-2.5 uppercase" style={{color:MUTED, fontFamily:sans, fontSize:'10px', letterSpacing:'0.22em', background:'transparent', border:`1px solid ${LINE_STR}`, cursor:'pointer'}}>
                Export backup
              </button>
            )}
          </div>
          {this.state.error?.message && (
            <div className="mt-6 italic" style={{color:FAINT, fontFamily:serif, fontSize:'11px', lineHeight:1.6, borderTop:`1px solid ${LINE}`, paddingTop:'14px'}}>
              {String(this.state.error.message).slice(0, 240)}
            </div>
          )}
        </div>
      </div>
    );
  }
}
