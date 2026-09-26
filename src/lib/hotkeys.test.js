import {describe,it,expect} from 'vitest';
import {isTypingTarget,isTextEditable,isNearEditable,pressHoldsShortcuts} from './hotkeys.js';

// Minimal element trees: enough of the DOM shape (tagName, children, parentElement) for the helpers.
function h(tagName,props={},...children){
  const el={tagName,children,parentElement:null,getAttribute:(k)=>props.attrs?.[k]??null,...props};
  children.forEach(c=>{c.parentElement=el;});
  return el;
}

describe('isTypingTarget',()=>{
  it('treats inputs, textareas and selects as typing',()=>{
    expect(isTypingTarget(h('INPUT'))).toBe(true);
    expect(isTypingTarget(h('TEXTAREA'))).toBe(true);
    expect(isTypingTarget(h('SELECT'))).toBe(true); // was missing before v0.99.3
  });
  it('treats contenteditable (CodeMirror) as typing',()=>{
    expect(isTypingTarget(h('DIV',{attrs:{contenteditable:'true'}}))).toBe(true);
  });
  it('does not treat plain elements as typing',()=>{
    expect(isTypingTarget(h('DIV'))).toBe(false);
    expect(isTypingTarget(h('BUTTON'))).toBe(false);
    expect(isTypingTarget(null)).toBe(false);
  });
});

describe('isTextEditable',()=>{
  it('excludes non-text inputs and disabled fields',()=>{
    expect(isTextEditable(h('INPUT',{type:'checkbox'}))).toBe(false);
    expect(isTextEditable(h('INPUT',{type:'text',disabled:true}))).toBe(false);
    expect(isTextEditable(h('INPUT',{type:'number'}))).toBe(true);
    expect(isTextEditable(h('INPUT'))).toBe(true);
  });
});

describe('isNearEditable — the two reproduced bugs',()=>{
  it('repro 1: a click in the gap of the piece detail form counts as near a field',()=>{
    // EditorRow: <div row><div label/><input/></div> — clicking the row padding targets the row.
    const input=h('INPUT');const label=h('DIV');const row=h('DIV',{},label,input);
    h('DIV',{},row);
    expect(isNearEditable(row)).toBe(true);
    expect(isNearEditable(label)).toBe(true); // clicking the label: its parent holds the field
  });
  it('repro 2: a missed click on the Répertoire search row counts as near a field',()=>{
    const icon=h('SVG');const search=h('INPUT');const searchRow=h('DIV',{},icon,search);
    h('DIV',{},searchRow);
    expect(isNearEditable(searchRow)).toBe(true);
    expect(isNearEditable(icon)).toBe(true);
  });
  it('a click inside a CodeMirror line counts as in a field',()=>{
    const line=h('DIV');const content=h('DIV',{attrs:{contenteditable:'true'}},line);
    h('DIV',{},h('DIV',{},content));
    expect(isNearEditable(line)).toBe(true);
  });
});

describe('isNearEditable — the protected paths stay live',()=>{
  it('clicking a Today piece row with no field beside it leaves shortcuts on',()=>{
    const title=h('SPAN');const play=h('BUTTON');const row=h('DIV',{},title,play);
    const sessionList=h('DIV',{},row,h('DIV',{},h('SPAN')));
    h('DIV',{},sessionList);
    expect(isNearEditable(title)).toBe(false);
    expect(isNearEditable(play)).toBe(false);
    expect(isNearEditable(row)).toBe(false);
  });
  it('a field buried deep in a large container does not switch shortcuts off',()=>{
    // Page background click: the reflection editor is many levels down, not beside the click.
    const deepField=h('DIV',{attrs:{contenteditable:'true'}});
    const page=h('MAIN',{},h('SECTION',{},h('DIV',{},h('DIV',{},h('DIV',{},deepField)))));
    expect(isNearEditable(page)).toBe(false);
  });
  it('a checkbox beside the click is not a text field',()=>{
    const box=h('INPUT',{type:'checkbox'});const row=h('DIV',{},h('SPAN'),box);
    expect(isNearEditable(row)).toBe(false);
  });
  it('handles a missing target',()=>{
    expect(isNearEditable(null)).toBe(false);
  });
});

describe('pressHoldsShortcuts — both moments must agree',()=>{
  const press=(el)=>({el,near:isNearEditable(el)});
  it('a click that reveals fields (a collapsed piece expanding) keeps Space live',()=>{
    // Guards the layout case where expansion renders a field beside the clicked element. In today's
    // Today view it does not (checked on the live page, 27 Sep); this keeps it true if that changes.
    const title=h('SPAN');const row=h('DIV',{},title,h('BUTTON'));
    const p=press(title);                        // collapsed: no field beside the click
    const note=h('TEXTAREA');row.children.push(note);note.parentElement=row; // expansion renders fields
    expect(isNearEditable(title)).toBe(true);    // near *now*…
    expect(pressHoldsShortcuts(p)).toBe(false);  // …but not when pressed, so Space still works
  });
  it('a near-miss beside a field holds shortcuts off',()=>{
    const row=h('DIV',{},h('DIV'),h('INPUT'));
    expect(pressHoldsShortcuts(press(row))).toBe(true);
  });
  it('a field that has since closed releases shortcuts (time editor after Enter)',()=>{
    const input=h('INPUT');h('DIV',{},input);
    const p=press(input);
    input.isConnected=false;                     // unmounted on commit
    expect(pressHoldsShortcuts(p)).toBe(false);
  });
  it('no press yet',()=>{
    expect(pressHoldsShortcuts(null)).toBe(false);
  });
});
