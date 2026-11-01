import test from 'node:test';
import assert from 'node:assert/strict';
import {fullscreenSupported, isFullscreenShortcut, toggleFullscreen} from '../src/lib/fullscreen.js';

test('full screen requests the document root and exits the existing session', async () => {
  const calls=[];
  const doc={fullscreenEnabled:true,documentElement:{async requestFullscreen(){calls.push(this);}},async exitFullscreen(){calls.push('exit');}};
  assert.ok(fullscreenSupported(doc));
  await toggleFullscreen(doc);
  assert.equal(calls[0],doc.documentElement);
  doc.fullscreenElement=doc.documentElement;
  await toggleFullscreen(doc);
  assert.deepEqual(calls,[doc.documentElement,'exit']);
});

test('unavailable or disallowed full screen does not request entry', async () => {
  let requests=0;
  const doc={fullscreenEnabled:false,documentElement:{requestFullscreen(){requests++;}},exitFullscreen(){}};
  assert.equal(fullscreenSupported(doc),false);
  assert.equal(fullscreenSupported({documentElement:{}}),false);
  await assert.rejects(toggleFullscreen(doc),/unavailable/);
  assert.equal(requests,0);
});

test('an existing full screen session can exit even if new entry is disallowed', async () => {
  let exited=false;
  await toggleFullscreen({fullscreenElement:{},fullscreenEnabled:false,async exitFullscreen(){exited=true;}});
  assert.ok(exited);
});

test('browser rejections are returned to the caller for a retry message', async () => {
  const doc={fullscreenEnabled:true,documentElement:{requestFullscreen(){return Promise.reject(Error('denied'));}},exitFullscreen(){}};
  await assert.rejects(toggleFullscreen(doc),/denied/);
});

test('only an unmodified, unrepeated F shortcut is handled', () => {
  assert.ok(isFullscreenShortcut({key:'f'}));
  assert.ok(isFullscreenShortcut({key:'F'}));
  for(const key of ['Escape','F11','Enter',' ','g'])assert.equal(isFullscreenShortcut({key}),false);
  for(const flag of ['repeat','defaultPrevented','isComposing','ctrlKey','metaKey','altKey','shiftKey']){
    assert.equal(isFullscreenShortcut({key:'f',[flag]:true}),false,flag);
  }
});

test('typing in form controls and editable content never toggles full screen', () => {
  for(const target of [{isContentEditable:true},{closest:()=>({})}])assert.equal(isFullscreenShortcut({key:'f',target}),false);
  assert.equal(isFullscreenShortcut({key:'f',target:{},composedPath:()=>[{}, {isContentEditable:true}]}),false);
  assert.ok(isFullscreenShortcut({key:'f',target:{closest:()=>null}}));
});
