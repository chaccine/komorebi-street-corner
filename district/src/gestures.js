function attachDistrictGestures(canvas, {pick, activate, orbit, pan, zoom, reset, unlockSound, highlight, keyAction}) {
  const win = canvas.ownerDocument.defaultView;
  const active = new Map();
  const listeners = [];
  const oldCursor = canvas.style.cursor;
  const oldTouchAction = canvas.style.touchAction;
  const oldShortcuts = canvas.getAttribute('aria-keyshortcuts');
  let lastBlankTap = null;
  let twoFingerTap = null;
  let hoverPoint = null;
  let hoverFrame = 0;
  let hoverTimer = 0;
  let lastPickTime = -Infinity;
  let lastRelease = -Infinity;
  const now = () => win.performance.now();
  const interval = type => type === 'touch' ? 330 : 310;
  const tapRadius = type => type === 'touch' ? 9 : 5;
  const doubleRadius = type => type === 'touch' ? 26 : 9;
  const distance = (a,b) => Math.hypot(a.x-b.x, a.y-b.y);
  const position = e => ({x:e.clientX, y:e.clientY});

  function listen(target, name, callback, options) {
    target.addEventListener(name, callback, options);
    listeners.push(() => target.removeEventListener(name, callback, options));
  }
  function inCanvas(p) {
    const rect = canvas.getBoundingClientRect();
    return p.x >= rect.left && p.x < rect.right && p.y >= rect.top && p.y < rect.bottom;
  }
  function clearHover() {
    hoverPoint = null;
    if (hoverTimer) win.clearTimeout(hoverTimer);
    if (hoverFrame) win.cancelAnimationFrame(hoverFrame);
    hoverFrame = hoverTimer = 0;
  }
  function hover(p) {
    if (!inCanvas(p) || active.size) return;
    hoverPoint = p;
    if (hoverTimer || hoverFrame) return;
    function nextFrame() {
      hoverTimer = 0;
      hoverFrame = win.requestAnimationFrame(() => {
        hoverFrame = 0;
        if (!hoverPoint || active.size) return;
        lastPickTime = now();
        const id=pick(hoverPoint.x,hoverPoint.y);
        highlight(id);
        canvas.style.cursor = id>0 ? 'pointer' : 'grab';
      });
    }
    const delay = 40 - (now()-lastPickTime);
    if (delay > 0) hoverTimer = win.setTimeout(nextFrame, delay);
    else nextFrame();
  }
  function onDown(e) {
    if (![0,1,2].includes(e.button) || active.has(e.pointerId)) return;
    const p = position(e), type = e.pointerType || 'mouse';
    if(e.isTrusted && type==='mouse')unlockSound();
    const canTap = !active.size && e.button === 0 && !e.shiftKey && !e.ctrlKey && !e.altKey;
    // Input timestamps keep double taps reliable when a GPU readback stalls.
    const previous = lastBlankTap;
    lastBlankTap = null;
    const elapsed = previous ? e.timeStamp - previous.time : Infinity;
    const hit=canTap?pick(p.x,p.y,type):0;
    const second = canTap && hit === 0 && previous?.type === type &&
      elapsed >= 0 && elapsed <= interval(type) && distance(p,previous.point) <= doubleRadius(type);
    const state = {id:e.pointerId, type, start:p, point:p, drag:false, multi:false,
      downAt:e.timeStamp, still:true,
      pan:e.button !== 0 || e.shiftKey, canTap, second:!!second,
      hit};
    active.set(state.id,state);
    if (active.size > 1) {
      const first = active.values().next().value;
      twoFingerTap = active.size === 2 && first.canTap && first.still &&
        first.type === 'touch' && type === 'touch' && e.button === 0 &&
        e.timeStamp - first.downAt <= 120 ? {startTime:first.downAt, firstUp:null} : null;
      for (const finger of active.values()) {
        finger.multi = true;
        finger.canTap = false;
        finger.second = false;
      }
    }
    clearHover();
    highlight(0);
    canvas.style.cursor = 'grabbing';
    if (canvas.tabIndex >= 0 && canvas.ownerDocument.activeElement !== canvas) {
      canvas.focus({preventScroll:true});
    }
    // Capture keeps a drag active when the pointer leaves the canvas.
    try { canvas.setPointerCapture(e.pointerId); } catch {}
    e.preventDefault();
  }
  function move(state, p, shift) {
    const previous = state.point;
    if (p.x === previous.x && p.y === previous.y) return;
    if (distance(p,state.start) > 4) state.still = false;
    if (twoFingerTap) {
      // A few CSS pixels of contact jitter should neither move the camera nor cancel a tap.
      if (state.still) return;
      twoFingerTap = null;
    }
    state.point = p;
    if (active.size > 1) {
      const [a,b] = active.values();
      if (state !== a && state !== b) return;
      const other = (a === state ? b : a).point;
      const before = distance(previous,other), after = distance(p,other);
      if (before > 4 && after > 4) {
        zoom(after/before,{x:(previous.x+other.x)/2,y:(previous.y+other.y)/2});
      }
      pan((p.x-previous.x)/2,(p.y-previous.y)/2);
      return;
    }
    if (!state.drag && distance(p,state.start) <= tapRadius(state.type)) return;
    const from = state.drag ? previous : state.start;
    state.drag = true;
    state.canTap = false;
    state.second = false;
    (state.pan || shift ? pan : orbit)(p.x-from.x,p.y-from.y);
  }
  function onMove(e) {
    const state = active.get(e.pointerId), p = position(e);
    if (state) move(state,p,e.shiftKey);
    else if (!active.size && e.pointerType !== 'touch') hover(p);
  }
  function finish(e,canceled) {
    const state = active.get(e.pointerId);
    if (!state) return;
    if(!canceled && e.isTrusted)unlockSound();
    const p = position(e);
    if (twoFingerTap && (canceled || !inCanvas(p) || e.timeStamp-twoFingerTap.startTime > 260)) {
      twoFingerTap = null;
    }
    if (!canceled) move(state,p,e.shiftKey);
    active.delete(e.pointerId);
    if (twoFingerTap) {
      if (active.size) twoFingerTap.firstUp = e.timeStamp;
      else {
        if (e.timeStamp-twoFingerTap.firstUp <= 120) keyAction('m');
        twoFingerTap = null;
      }
    }
    lastRelease = now();
    if (canceled) lastBlankTap = null;
    else if (state.canTap && !state.drag && !state.multi && inCanvas(p)) {
      if (state.second) reset();
      else {
        const hit = distance(p,state.start) <= 1 ? state.hit : pick(p.x,p.y,state.type);
        if (hit === state.hit) {
          if (hit > 0) activate(hit,state.type);
          else lastBlankTap = {point:p,type:state.type,time:e.timeStamp};
        }
      }
    }
    if (active.size === 1) {
      const remaining = active.values().next().value;
      if (!twoFingerTap) remaining.start = remaining.point;
      remaining.drag = true;
      remaining.canTap = false;
    }
    if (!active.size) {
      canvas.style.cursor = 'grab';
      if (!canceled && state.type !== 'touch') hover(p);
    }
  }
  function abandon() {
    lastBlankTap = null;
    twoFingerTap = null;
    clearHover();
    const ids = [...active.keys()];
    active.clear();
    for (const id of ids) {
      try {
        if (canvas.hasPointerCapture(id)) canvas.releasePointerCapture(id);
      } catch {}
    }
    canvas.style.cursor = 'grab';
  }
  canvas.style.touchAction = 'none';
  canvas.style.cursor = 'grab';
  canvas.setAttribute('aria-keyshortcuts',
    'ArrowLeft ArrowRight ArrowUp ArrowDown Shift+ArrowLeft Shift+ArrowRight Shift+ArrowUp Shift+ArrowDown Plus - Home Escape 1 2 3 4 5 6 Enter Space B M');
  const arrows = {ArrowLeft:[-30,0],ArrowRight:[30,0],ArrowUp:[0,-30],ArrowDown:[0,30]};
  listen(win,'keydown',e=>{
    if((e.target!==win.document.body&&e.target!==win.document.documentElement)||
      e.defaultPrevented||e.isComposing||e.ctrlKey||e.metaKey||e.altKey||e.repeat)return;
    const key=e.key.toLowerCase();
    if(!['m','1','2','3','4','5','6','b','enter',' ','home','escape'].includes(key))return;
    if(e.isTrusted)unlockSound();
    canvas.focus({preventScroll:true});keyAction(key);e.preventDefault();
  });
  listen(canvas,'keydown',e => {
    if (e.target !== canvas || e.defaultPrevented || e.isComposing || e.ctrlKey || e.metaKey || e.altKey) return;
    const key=e.key.toLowerCase();
    if(e.isTrusted && (Object.hasOwn(arrows,e.key)||['home','escape','+','=','-','1','2','3','4','5','6','b','enter',' ','m'].includes(key)))unlockSound();
    if (Object.hasOwn(arrows,e.key)) {
      (e.shiftKey ? pan : orbit)(...arrows[e.key]);
    } else if (e.key === '+' || (!e.shiftKey && (e.key === '=' || e.key === '-'))) {
      const rect = canvas.getBoundingClientRect();
      zoom(e.key === '-' ? 1/1.15 : 1.15,{x:(rect.left+rect.right)/2,y:(rect.top+rect.bottom)/2});
    } else if (!e.shiftKey && ['1','2','3','4','5','6','b','enter',' ','m','home','escape'].includes(key)) {
      if (!e.repeat) keyAction(key);
    } else {
      return;
    }
    lastBlankTap = null;
    e.preventDefault();
  });
  listen(canvas,'pointerdown',onDown);
  listen(canvas,'pointermove',onMove);
  // Window listeners also complete a drag if a host loses pointer capture.
  listen(win,'pointermove',e => {
    if (active.has(e.pointerId) && e.target !== canvas) onMove(e);
  });
  listen(win,'pointerup',e => finish(e,false),true);
  listen(win,'pointercancel',e => finish(e,true),true);
  listen(canvas,'lostpointercapture',e => finish(e,true));
  listen(canvas,'pointerleave',() => {
    clearHover();
    highlight(0);
    if (!active.size) canvas.style.cursor = 'grab';
  });
  listen(canvas,'contextmenu',e => e.preventDefault());
  listen(canvas,'wheel',e => {
    e.preventDefault();
    if(e.isTrusted && win.navigator.userActivation?.hasBeenActive)unlockSound();
    lastBlankTap = null;
    const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? canvas.clientHeight : 1;
    const p = position(e);
    zoom(Math.exp(-Math.max(-260,Math.min(260,e.deltaY*unit))*.0015),p);
    if (!active.size) hover(p);
  },{passive:false});
  listen(canvas,'dblclick',e => {
    e.preventDefault();
    // Pointer releases already classified real double clicks, including drags that
    // a browser might otherwise misclassify because both releases hit the canvas.
    if (!active.size && now()-lastRelease > interval('mouse') && pick(e.clientX,e.clientY)===0) {
      lastBlankTap = null;
      reset();
    }
  });
  listen(win,'blur',abandon);
  listen(canvas.ownerDocument,'visibilitychange',() => {
    if (canvas.ownerDocument.hidden) abandon();
  });
  return () => {
    abandon();
    for (const off of listeners) off();
    canvas.style.cursor = oldCursor;
    canvas.style.touchAction = oldTouchAction;
    if (oldShortcuts === null) canvas.removeAttribute('aria-keyshortcuts');
    else canvas.setAttribute('aria-keyshortcuts',oldShortcuts);
  };
}
