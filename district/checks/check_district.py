"""Play through the district with a real mouse and touchscreen in Chrome.

Run python checks/check_district.py [path-or-url] [--capture-dir directory].
The probe reads the application's WebGL colour/key buffer and uniforms.
"""
import argparse
from pathlib import Path
from time import monotonic, time

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
BROWSER = Path('C:/Program Files/Google/Chrome/Application/chrome.exe')
PROBE = r"""
(() => {
  const api=window.WebGL2RenderingContext?.prototype;
  if(!api)return;
  const q=window.districtCheck={history:[],last:null};
  q.paperSounds=0;q.sparrowSounds=0;
  const startSource=AudioBufferSourceNode.prototype.start;
  AudioBufferSourceNode.prototype.start=function(...args){
    if(this.buffer && Math.abs(this.buffer.duration-.93)<.001 && this.buffer.getChannelData(0).some(x=>Math.abs(x)>.02))q.paperSounds++;
    if(this.buffer && Math.abs(this.buffer.duration-1.48)<.001){
      const pcm=this.buffer.getChannelData(0),rate=this.buffer.sampleRate;
      if(pcm.subarray(rate*.2,rate*.7).some(x=>Math.abs(x)>.02) && pcm.subarray(rate*1.12,rate*1.31).some(x=>Math.abs(x)>.02))q.sparrowSounds++;
    }
    return startSource.apply(this,args);
  };
  const locations=new WeakMap(),programs=new WeakMap();
  let gl,prog,target,scene,sceneTarget;
  function wrap(name,record){
    const original=api[name];
    api[name]=function(...args){const value=original.apply(this,args);record.call(this,args,value);return value;};
  }
  wrap('getUniformLocation',function([p,name],loc){
    if(!loc)return;
    if(!programs.has(p))programs.set(p,{});
    locations.set(loc,[programs.get(p),name]);
    if(name==='lamp')scene=p;
    if(name==='stroke')programs.get(p).post=true;
  });
  wrap('useProgram',function([p]){gl=this;prog=p;});
  wrap('bindFramebuffer',function([type,fb]){
    if(type===this.FRAMEBUFFER||type===this.DRAW_FRAMEBUFFER)target=fb;
  });
  for(const type of ['uniform1i','uniform1f','uniformMatrix4fv'])wrap(type,function([loc,value,matrix]){
    const entry=loc&&locations.get(loc);if(!entry)return;
    const [state,name]=entry;
    state[name]=type==='uniformMatrix4fv'?Array.from(matrix):value;
  });
  wrap('drawArrays',function(){
    const state=programs.get(prog);
    if(prog===scene && target)sceneTarget=target;
    if(!state?.post||!sceneTarget)return;
    const s=programs.get(scene);
    q.last={view:s.view,scale:Math.hypot(s.view[0],s.view[4],s.view[8]),
      birdAge:s.birdAge,pageTurn:s.pageTurn,water:s.water,lamp:s.lamp,angle:s.angle,cloth:s.cloth,amplitude:s.clothAmplitude,
      time:performance.now(),size:[this.drawingBufferWidth,this.drawingBufferHeight]};
    q.history.push(q.last);if(q.history.length>550)q.history.shift();
  });
  function image(){
    const data=new Uint8Array(gl.drawingBufferWidth*gl.drawingBufferHeight*4);
    const fb=gl.getParameter(gl.READ_FRAMEBUFFER_BINDING);
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER,sceneTarget);
    try{gl.readPixels(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight,gl.RGBA,gl.UNSIGNED_BYTE,data);}
    finally{gl.bindFramebuffer(gl.READ_FRAMEBUFFER,fb);}
    return data;
  }
  q.objects=function(){
    const data=image(),counts={};
    for(let i=3;i<data.length;i+=4)counts[data[i]]=(counts[data[i]]||0)+1;
    return counts;
  };
  q.blankPoint=function(){
    const data=image(),w=gl.drawingBufferWidth,h=gl.drawingBufferHeight;
    const radius=Math.ceil(10*w/innerWidth);
    for(let y=radius;y<h-radius;y+=radius*2)for(let x=radius;x<w-radius;x+=radius*2){
      let clear=true;
      for(let dy=-radius;dy<=radius&&clear;dy++)for(let dx=-radius;dx<=radius;dx++){
        if(data[((y+dy)*w+x+dx)*4+3]){clear=false;break;}
      }
      if(clear)return {x:(x+.5)*innerWidth/w,y:(h-y-.5)*innerHeight/h,id:1};
    }
    throw Error('No empty touch target in this view');
  };
  q.object=function(id){
    const data=image(),w=gl.drawingBufferWidth,h=gl.drawingBufferHeight;
    let n=0,sx=0,sy=0,red=0,green=0,blue=0,hash=0;
    for(let i=0;i<data.length;i+=4){
      if(data[i+3]!==id)continue;
      const j=i/4;
      n++;sx+=j%w;sy+=Math.floor(j/w);
      red+=data[i];green+=data[i+1];blue+=data[i+2];
      hash=(Math.imul(hash,31)+j+data[i]*19+data[i+1]*13+data[i+2]*7)|0;
    }
    if(!n)throw Error('No visible pixels for part '+id);
    const cx=sx/n,cy=sy/n;
    const scoreAt=(x,y,r)=>x>r&&y>r&&x<w-r&&y<h-r&&
      [[-r,0],[r,0],[0,-r],[0,r]].every(([dx,dy])=>data[4*((y+dy)*w+x+dx)+3]===id);
    let best=-Infinity,bx,by;
    for(let i=3;i<data.length;i+=4){
      if(data[i]!==id)continue;
      const p=(i-3)/4,x=p%w,y=Math.floor(p/w);
      const d=(x-cx)**2+(y-cy)**2;
      const score=-d+(scoreAt(x,y,4)?1e9:scoreAt(x,y,1)?1e7:0);
      if(score>best){best=score;bx=x;by=y;}
    }
    return {n,uv:[(bx+.5)/w,1-(by+.5)/h],rgb:[red/n,green/n,blue/n],hash};
  };
  q.glError=()=>gl.getError();
})();"""


def wait(page, condition):
    page.wait_for_function(condition, timeout=45_000, polling=100)


def ready(page, url):
    page.goto(url, wait_until='domcontentloaded', timeout=90_000)
    wait(page, "document.querySelector('canvas')?.dataset.error || !!districtCheck.last")
    error = page.locator('canvas').get_attribute('data-error')
    assert not error, error


def resting_camera(page):
    # Camera interpolation can take several rendered frames at high DPR.
    start = monotonic()
    prev = page.evaluate('districtCheck.last.view')
    still = 0
    while monotonic()-start < 12:
        page.wait_for_timeout(155)
        view = page.evaluate('districtCheck.last.view')
        still = still+1 if max(abs(a-b) for a,b in zip(prev,view)) < .00001 else 0
        prev = view
        if still >= 3:
            return
    raise AssertionError('Camera did not settle')


def target(page, object_id):
    record = page.evaluate('id=>districtCheck.object(id)', object_id)
    box = page.locator('canvas').bounding_box()
    x,y = record['uv']
    return box['x']+x*box['width'],box['y']+y*box['height']


def select(page, id_, *, touch=False):
    x,y = target(page,id_)
    (page.touchscreen.tap if touch else page.mouse.click)(x,y)


def expect_hash(page, route):
    page.wait_for_function('s=>location.hash===s', arg=route, timeout=20_000)
    resting_camera(page)


def screenshot(page, captures, name):
    if captures:
        page.locator('canvas').screenshot(path=captures/(name+'.png'))


def desktop(browser, url, captures, width, height):
    ctx=browser.new_context(viewport={'width':width,'height':height},device_scale_factor=1)
    ctx.add_init_script(script=PROBE)
    page=ctx.new_page()
    failures=[]
    page.on('pageerror',lambda exc: failures.append(str(exc)))
    try:
        ready(page,url)
        resting_camera(page)
        counts=page.evaluate('districtCheck.objects()')
        assert all(counts.get(str(k),0)>24 for k in (1,2,3,4,5,11,12,13,15)),counts
        screenshot(page,captures,'desktop-district')
        overview=page.evaluate('districtCheck.last.scale')
        original=page.evaluate('districtCheck.last.view')
        x,y=target(page,2)
        page.mouse.move(x,y)
        page.mouse.down()
        page.mouse.move(x+80,y+25,steps=5)
        page.mouse.up()
        page.wait_for_timeout(375)
        rotated=page.evaluate('districtCheck.last.view')
        assert max(abs(a-b) for a,b in zip(original[:12],rotated[:12]))>.005
        assert not page.evaluate('location.hash'),'A drag activated a building'
        page.mouse.wheel(0,-240)
        wait(page,f"districtCheck.last.scale>{overview*1.17}")
        page.keyboard.press('Home')
        resting_camera(page)
        for building,route in enumerate(('tea','cycles','flats','florist','newsstand'),1):
            select(page,building)
            expect_hash(page,'#'+route)
            close=page.evaluate('districtCheck.last.scale')
            assert close>overview*1.15,(route,close,overview)
            action=building+10
            initial=page.evaluate('id=>districtCheck.object(id)',action)
            assert initial['n']>80,(route,initial)
            screenshot(page,captures,route)
            before=page.evaluate('districtCheck.last')
            select(page,action)
            if route=='tea':
                wait(page,f"Math.abs(districtCheck.last.lamp-{before['lamp']})>.6")
            elif route=='cycles':
                wait(page,f"Math.abs(districtCheck.last.angle-{before['angle']})>.55")
            elif route=='newsstand':
                wait(page,'districtCheck.last.pageTurn===1 && districtCheck.paperSounds===1')
                screenshot(page,captures,'newsstand-open')
            elif route=='florist':
                wait(page,'districtCheck.last.water>.50')
            else:
                wait(page,f"districtCheck.history.some(f=>f.time>{before['time']} && f.cloth>0 && f.amplitude>.45)")
            after=page.evaluate('id=>districtCheck.object(id)',action)
            assert after['hash']!=initial['hash'],(route,'unchanged pixels')
            if route=='tea':
                assert abs(after['rgb'][0]-initial['rgb'][0])>8,(initial,after)
            page.keyboard.press('Home')
            expect_hash(page,'')
            assert abs(page.evaluate('districtCheck.last.scale')-overview)<.002
        for index,route in enumerate(('tea','cycles','flats','florist','newsstand'),1):
            page.goto('about:blank')
            ready(page,url+'#'+route)
            expect_hash(page,'#'+route)
            assert page.evaluate('districtCheck.last.scale')>overview*1.15
            assert page.evaluate('id=>districtCheck.object(id).n',index+10)>80
        assert not failures,failures
        assert page.evaluate('districtCheck.glError()')==0
        print('Desktop: five buildings, drag/zoom, five focus routes, lamp/rim/cloth pixels, Home and fresh deep links passed',flush=True)
    finally:
        ctx.close()


def mobile(browser, url, captures):
    ctx=browser.new_context(viewport={'width':390,'height':844},has_touch=True,is_mobile=True,device_scale_factor=3)
    ctx.add_init_script(script=PROBE)
    page=ctx.new_page()
    failures=[]
    page.on('pageerror',lambda exc: failures.append(str(exc)))
    try:
        ready(page,url)
        resting_camera(page)
        overview=page.evaluate('districtCheck.last')
        assert overview['size']==[1170,2532],overview['size']
        screenshot(page,captures,'mobile-district')
        x,y=target(page,2)
        device=ctx.new_cdp_session(page)
        def fingers(event,span):
            points=[{'x':x+sign*span,'y':y,'id':i} for i,sign in enumerate((-1,1))] if span else []
            device.send('Input.dispatchTouchEvent',{'type':event,'touchPoints':points})
        fingers('touchStart',19)
        for span in (25,32,40):
            fingers('touchMove',span)
        fingers('touchEnd',0)
        wait(page,f"districtCheck.last.scale>{overview['scale']*1.30}")
        page.wait_for_timeout(500)
        assert not page.evaluate('location.hash'),'A pinch activated a building'
        assert abs(page.evaluate('districtCheck.last.angle')-overview['angle'])<.01,'A pinch spun the wheel'
        assert page.evaluate('districtCheck.last.size')==[1170,2532]
        page.keyboard.press('Home')
        resting_camera(page)
        # Even when the first touch hits the small moving part, it should first
        # focus its host building, making the second touch easy to aim.
        select(page,12,touch=True)
        expect_hash(page,'#cycles')
        assert abs(page.evaluate('districtCheck.last.angle')-overview['angle'])<.01
        select(page,12,touch=True)
        wait(page,f"Math.abs(districtCheck.last.angle-{overview['angle']})>.5")
        screenshot(page,captures,'mobile-cycles')
        # Preserve a human double-tap cadence even if software WebGL blocks
        # the browser's main thread between native events.
        blank=page.evaluate('districtCheck.blankPoint()')
        touched=time()
        for offset,pressed in ((0,True),(.035,False),(.145,True),(.18,False)):
            device.send('Input.dispatchTouchEvent',{
                'type':'touchStart' if pressed else 'touchEnd',
                'touchPoints':[blank] if pressed else [],'timestamp':touched+offset,
            })
        expect_hash(page,'')
        assert abs(page.evaluate('districtCheck.last.scale')-overview['scale'])<.002
        assert not failures,failures
        assert page.evaluate('districtCheck.glError()')==0
        select(page,4,touch=True)
        expect_hash(page,'#florist')
        select(page,14,touch=True)
        wait(page,'districtCheck.last.water>.50')
        screenshot(page,captures,'mobile-florist')
        page.set_viewport_size({'width':844,'height':390})
        resting_camera(page)
        assert page.evaluate('location.hash')=='#florist'
        wait(page,'districtCheck.last.water===0')
        select(page,14,touch=True)
        wait(page,'districtCheck.last.water>.50')
        assert not failures,failures
        assert page.evaluate('districtCheck.glError()')==0
        page.set_viewport_size({'width':390,'height':844})
        page.keyboard.press('Home')
        expect_hash(page,'')
        for x in [-2.54,-1.76,-.91]:
            bx,by=page.evaluate('x=>{const m=districtCheck.last.view,y=.49,z=7.03;return [(1+m[0]*x+m[4]*y+m[8]*z+m[12])*innerWidth/2,(1-m[1]*x-m[5]*y-m[9]*z-m[13])*innerHeight/2]}',x)
            page.touchscreen.tap(bx,by)
            assert page.evaluate("location.hash==='' && districtCheck.paperSounds===0")
        select(page,15,touch=True)
        expect_hash(page,'#newsstand')
        assert page.evaluate('districtCheck.last.pageTurn===0 && districtCheck.paperSounds===0')
        select(page,15,touch=True)
        wait(page,'districtCheck.last.pageTurn===1 && districtCheck.paperSounds===1')
        screenshot(page,captures,'mobile-newsstand-open')
        page.set_viewport_size({'width':844,'height':390})
        resting_camera(page)
        page.keyboard.press('m')
        select(page,15,touch=True)
        wait(page,'districtCheck.last.pageTurn===0')
        assert page.evaluate('districtCheck.paperSounds===1')
        assert not failures,failures
        assert page.evaluate('districtCheck.glError()')==0
        print('Mobile newsstand: bench, focus, page turning, landscape, paper sound and mute passed')
        print('Mobile florist: portrait and landscape taps passed')
        print('Mobile: native 1170x2532, real two-finger pinch, no false tap, two-step wheel action and double-tap overview passed',flush=True)
    finally:
        ctx.close()


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('target',nargs='?',default=str(ROOT/'index.html'))
    parser.add_argument('--capture-dir',type=Path)
    parser.add_argument('--chrome',type=Path)
    parser.add_argument('--width',type=int,default=1080)
    parser.add_argument('--height',type=int,default=760)
    args=parser.parse_args()
    if args.capture_dir:
        args.capture_dir.mkdir(parents=True,exist_ok=True)
    url=(args.target if '://' in args.target else Path(args.target).resolve().as_uri()).split('#')[0]
    start=monotonic()
    with sync_playwright() as pw:
        browser=pw.chromium.launch(executable_path=str(args.chrome or (BROWSER if BROWSER.is_file() else pw.chromium.executable_path)),
            headless=True,chromium_sandbox=True,args=['--use-gl=angle','--use-angle=swiftshader',
            '--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--disable-background-timer-throttling'])
        try:
            desktop(browser,url,args.capture_dir,args.width,args.height)
            mobile(browser,url,args.capture_dir)
        finally:
            browser.close()
    print(f'Elapsed {monotonic()-start:.1f}s',flush=True)


if __name__=='__main__':
    main()
