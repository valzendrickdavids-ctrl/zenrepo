import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
export default function Modal({ title, children, onClose, className='', confirmOnEnter=false, inPage=false, animateClose=false }) {
  const dialog = useRef(null),closing=useRef(false),closeAnimation=useRef(null);
  useEffect(()=>{
    const d=dialog.current,previous=document.activeElement;
    if(!inPage)d.showModal();
    const overlay=inPage?d.parentElement:null;
    const siblings=overlay?Array.from(overlay.parentElement.children).filter(element=>element!==overlay).map(element=>[element,element.inert]):[];
    const previousOverflow=document.body.style.overflow;
    if(inPage){siblings.forEach(([element])=>{element.inert=true;});document.body.style.overflow='hidden';}
    if(confirmOnEnter)(d.querySelector('[data-confirm-action]:not(:disabled)')||d).focus();
    else if(inPage)d.focus();
    return()=>{
      closeAnimation.current?.cancel();
      if(!inPage)d.close();
      else{siblings.forEach(([element,inert])=>{element.inert=inert;});document.body.style.overflow=previousOverflow;}
      if(previous?.isConnected)previous.focus();
    };
  },[confirmOnEnter,inPage]);
  useEffect(()=>{
    const d=dialog.current;
    if(!confirmOnEnter||(!inPage&&!d.open))return;
    // Disabling a pending action can move focus to the page. Keep retries in the dialog.
    if(document.activeElement===document.body||document.activeElement===d)
      (d.querySelector('[data-confirm-action]:not(:disabled)')||d).focus();
  });
  async function closeButton(event){
    if(closing.current)return;
    if(!animateClose||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return onClose(event);
    const panel=dialog.current,style=getComputedStyle(panel);
    closing.current=true;
    try{
      closeAnimation.current=panel.animate([
        {opacity:style.opacity,transform:style.transform},
        {opacity:0,transform:'translateY(6px)'}
      ],{duration:220,easing:'ease-in',fill:'forwards'});
      await closeAnimation.current.finished;
      // Hold the transparent final frame until the dialog is removed.
      if(panel.isConnected)await onClose();
    }catch{
      closeAnimation.current?.cancel();closeAnimation.current=null;closing.current=false;
    }
  }
  function keyDown(event){
    if(inPage&&event.key==='Escape'){
      event.preventDefault();event.stopPropagation();onClose();return;
    }
    if(inPage&&event.key==='Tab'){
      const controls=Array.from(dialog.current.querySelectorAll('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex]:not([tabindex="-1"])')).filter(element=>element.getClientRects().length>0);
      const first=controls[0],last=controls[controls.length-1],active=document.activeElement;
      if(!first){event.preventDefault();dialog.current.focus();}
      else if(event.shiftKey&&(active===first||active===dialog.current)){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&(active===last||active===dialog.current)){event.preventDefault();first.focus();}
    }
    if(!confirmOnEnter||event.key!=='Enter'||event.defaultPrevented)return;
    const target=event.target;
    if(target.isContentEditable||target.closest('input,textarea,select,[role="textbox"],[role="combobox"]'))return;
    const confirm=dialog.current?.querySelector('[data-confirm-action]');
    if(!confirm)return;
    // Tab-selected cancel, close and link controls keep their usual Enter action.
    const control=target.closest('button,a,[role="button"]');
    if(control&&control!==confirm)return;
    event.preventDefault();
    event.stopPropagation();
    if(event.repeat||event.nativeEvent.isComposing||event.altKey||event.ctrlKey||event.metaKey||event.shiftKey||confirm.disabled)return;
    confirm.click();
  }
  const content=<><div className="row spread"><h2>{title}</h2><button type="button" className="icon-button modal-close" aria-label="Close dialog" onClick={closeButton}><X size={20} aria-hidden="true"/></button></div>{children}</>;
  if(inPage)return <div className="modal-overlay" onPointerDown={event=>{if(event.target===event.currentTarget)event.preventDefault();}}>
    <section ref={dialog} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} className={'modal in-page-modal'+(className?' '+className:'')} onKeyDown={keyDown}>{content}</section>
  </div>;
  return <dialog ref={dialog} aria-label={title} className={'modal'+(className?' '+className:'')} onKeyDown={keyDown} onCancel={e=>{e.preventDefault();onClose();}}>
    {content}
  </dialog>;
}

