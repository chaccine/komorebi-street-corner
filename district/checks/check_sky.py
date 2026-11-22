"""Check the river arrival, visible silhouettes, perches and original picking channel."""
import argparse
from pathlib import Path

from playwright.sync_api import sync_playwright

import check_district as d
from check_riverside import drag_bridge


# Record the poses sent to WebGL. In diagnostic frames only, expose the visible
# sky meshes in the same colour buffer used by the established pixel tests.
PROBE = """
(() => {
  const gl=WebGL2RenderingContext.prototype,names=new WeakMap();
  const q=window.skyCheck={frames:[],mark:false,shift:0,positions:[],folds:[]};
  let id=0,position=null,fold=1;
  function wrap(name,record){
    const original=gl[name]; gl[name]=function(...args){
      const result=original.apply(this,args);record(args,result);return result;
    };
  }
  wrap('getUniformLocation',([p,name],loc)=>{if(loc)names.set(loc,name);});
  wrap('uniform1i',([loc,n])=>{if(names.get(loc)==='id')id=n;});
  wrap('uniform1f',([loc,n])=>{
    if(names.get(loc)==='swallowFold')fold=n;
    if(names.get(loc)==='cloudShift')q.shift=n;
  });
  wrap('uniform3fv',([loc,v])=>{if(names.get(loc)==='swallowPosition')position=Array.from(v);});
  wrap('drawArrays',()=>{
    if((id===45||id===46)&&position){q.positions[id-45]=position;q.folds[id-45]=fold;}
  });
  const mask=gl.colorMask;
  gl.colorMask=function(r,g,b,a){
    if(a&&q.positions.length===2){
      q.frames.push({t:performance.now(),folds:q.folds.slice(),pos:q.positions.slice(),shift:q.shift});
      if(q.frames.length>1800)q.frames.shift();
    }
    return mask.call(this,r,g,b,a||q.mark);
  };
})();
"""


def check(browser,url,mobile,captures):
    size=dict(width=390,height=844) if mobile else dict(width=1080,height=760)
    ctx=browser.new_context(viewport=size,device_scale_factor=3 if mobile else 1,is_mobile=mobile,has_touch=mobile)
    try:
        ctx.add_init_script(script=d.PROBE)
        ctx.add_init_script(script=PROBE)
        page=ctx.new_page()
        d.ready(page,url)
        label='portrait' if mobile else 'desktop'
        d.screenshot(page,captures,label+'-entry')
        start=page.evaluate('performance.now()')
        d.select(page,30,touch=mobile)
        d.expect_hash(page,'#riverside')
        d.wait(page,'skyCheck.frames.some(f=>f.t>'+str(start+1100)+' && f.folds[0]<.5 && f.folds[1]>.95)')
        d.wait(page,'skyCheck.folds.every(x=>x<.05)')
        page.evaluate('skyCheck.mark=true')
        d.wait(page,'districtCheck.objects()[46]>8 && districtCheck.objects()[45]>8')
        labels=page.evaluate('districtCheck.objects()')
        assert all(labels.get(str(i),0)>12 for i in (8,9,30,44,45,46)),labels
        d.screenshot(page,captures,label+'-in-flight')
        moving=page.evaluate('skyCheck.frames.filter(f=>f.folds[0]<.5).map(f=>f.pos[0][0])')
        assert max(moving)-min(moving)>.25
        page.evaluate('skyCheck.mark=false')
        d.wait(page,'!districtCheck.objects()[44] && !districtCheck.objects()[45] && !districtCheck.objects()[46]')
        drag_bridge(page,ctx.new_cdp_session(page),mobile)
        assert page.evaluate("location.hash==='#riverside'")
        d.select(page,30,touch=mobile)
        d.expect_hash(page,'#bridgehead')
        d.select(page,30,touch=mobile)
        d.expect_hash(page,'#riverside')
        d.wait(page,'skyCheck.folds.every(x=>x>.999) && Math.abs(skyCheck.positions[0][0]-18.05)<.002')
        page.evaluate('skyCheck.mark=true')
        page.emulate_media(reduced_motion='reduce')
        d.wait(page,'skyCheck.shift===0 && districtCheck.objects()[46]>4 && districtCheck.objects()[45]>4')
        perches=page.evaluate('skyCheck.positions.map(a=>a.slice())')
        assert abs(perches[0][0]-18.05)<.002 and abs(perches[1][0]-18.38)<.002,perches
        page.set_viewport_size(dict(width=size['width']+1,height=size['height']))
        d.resting_camera(page)
        assert page.evaluate('skyCheck.positions')==perches
        if not mobile:
            for quarter in range(4):
                page.mouse.move(420,330)
                page.mouse.down()
                page.mouse.move(662,330,steps=10)
                page.mouse.up()
                d.resting_camera(page)
                assert page.evaluate('(districtCheck.objects()[44]||0)>20')
        assert page.evaluate('districtCheck.glError()')==0
        print(label,'staggered takeoff, visible silhouettes, sky click-through, bridge return, perches and reduced motion passed',flush=True)
    finally:
        ctx.close()


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('url',nargs='?',default=(d.ROOT/'index.html').as_uri())
    parser.add_argument('--capture-dir',type=Path)
    args=parser.parse_args()
    if args.capture_dir:
        args.capture_dir.mkdir(parents=True,exist_ok=True)
    with sync_playwright() as pw:
        browser=pw.chromium.launch(executable_path=str(d.BROWSER if d.BROWSER.is_file() else pw.chromium.executable_path),
            chromium_sandbox=True,args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        for mobile in (True,False):
            check(browser,args.url.split('#')[0],mobile,args.capture_dir)
        browser.close()
