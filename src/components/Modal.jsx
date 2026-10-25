import { useEffect, useRef } from 'react';
export default function Modal({ title, children, onClose }) {
  const dialog = useRef(null);
  useEffect(()=>{ const d=dialog.current; const previous=document.activeElement; d.showModal(); return ()=>{d.close();previous?.focus();}; },[]);
  return <dialog ref={dialog} className="modal" onCancel={e=>{e.preventDefault();onClose();}}>
    <div className="row spread"><h2>{title}</h2><button className="icon-button" aria-label="Close dialog" onClick={onClose}>×</button></div>{children}
  </dialog>;
}

