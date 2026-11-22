"""Test the moving street resident, decoration hits and both established walking routes."""
import argparse
from pathlib import Path

from playwright.sync_api import sync_playwright

import check_district as d
from check_riverside import double_blank


# Observe the same pose passed to the production GPU, including both end turns.
POSE = """
(() => {
  const api=WebGL2RenderingContext.prototype, names=new WeakMap();
  const location=api.getUniformLocation, send=api.uniform4fv;
  api.getUniformLocation=function(p,key){
    const loc=location.call(this,p,key);if(loc)names.set(loc,key);return loc;
  };
  api.uniform4fv=function(loc,values,...rest){
    if(names.get(loc)==='walker')window.walkPose=Array.from(values);
    return send.call(this,loc,values,...rest);
  };
})();
"""


def exercise(browser,url,mobile,captures):
    size={'width':390,'height':844} if mobile else {'width':1080,'height':760}
    ctx=browser.new_context(viewport=size,device_scale_factor=3 if mobile else 1,is_mobile=mobile,has_touch=mobile)
    try:
        ctx.add_init_script(script=d.PROBE)
        ctx.add_init_script(script=POSE)
        p=ctx.new_page()
        session=ctx.new_cdp_session(p)
        d.ready(p,url)
        label='portrait' if mobile else 'desktop'
        d.screenshot(p,captures,label+'-overview')
        counts=p.evaluate('districtCheck.objects()')
        assert all(counts.get(str(k),0)>25 for k in [1,4,5,30,40,41,42,43]),counts
        d.select(p,1,touch=mobile)
        d.expect_hash(p,'#tea')
        double_blank(p,session,mobile)
        d.expect_hash(p,'')
        d.wait(p,'walkPose[0]>-2.07 && walkPose[3]===0')
        d.select(p,4,touch=mobile)
        d.expect_hash(p,'#florist')
        d.select(p,14,touch=mobile)
        d.wait(p,'districtCheck.history.some(f=>f.water>.2)')
        double_blank(p,session,mobile)
        d.expect_hash(p,'')
        d.select(p,30,touch=mobile)
        d.expect_hash(p,'#riverside')
        d.select(p,30,touch=mobile)
        d.expect_hash(p,'#bridgehead')
        double_blank(p,session,mobile)
        d.expect_hash(p,'')
        # Freeze the moving pedestrian for reproducible surface hits on a small screen.
        p.emulate_media(reduced_motion='reduce')
        d.wait(p,'walkPose[0]<-5.82 && walkPose[3]===0')
        for k in [40,41,42]:
            x,y=d.target(p,k)
            tap=p.touchscreen.tap if mobile else p.mouse.click
            tap(x,y)
            assert p.evaluate("location.hash===''")
            before=p.evaluate('districtCheck.last.view')
            if mobile:
                for event,points in [('touchStart',[dict(x=x,y=y)]),('touchMove',[dict(x=x+27,y=y-11)]),('touchEnd',[])]:
                    session.send('Input.dispatchTouchEvent',dict(type=event,touchPoints=points))
            else:
                p.mouse.move(x,y)
                p.mouse.down()
                p.mouse.move(x+27,y-11,steps=4)
                p.mouse.up()
            d.resting_camera(p)
            assert p.evaluate('districtCheck.last.view')!=before
            assert p.evaluate("location.hash===''")
            double_blank(p,session,mobile)
            d.resting_camera(p)
        assert p.evaluate("districtCheck.glError()===0 && walkPose[0]<-5.82")
        if not mobile:
            # Inspect the other side of all figures, then return to the entrance angle.
            for quarter in range(4):
                p.mouse.move(350,375)
                p.mouse.down()
                p.mouse.move(350+242,375,steps=12)
                p.mouse.up()
                d.resting_camera(p)
                assert p.evaluate("location.hash==='' && districtCheck.glError()===0")
                d.screenshot(p,captures,'orbit-'+str(quarter+1))
            x,y=d.target(p,42)
            p.mouse.move(x,y)
            for _ in range(4):
                p.mouse.wheel(0,-250)
                p.wait_for_timeout(180)
            d.resting_camera(p)
            d.screenshot(p,captures,'bench-close')
        print(label,'landmarks, florist at alley stop, watering, both crossings, reduced motion and three drag origins passed',flush=True)
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
            exercise(browser,args.url.split('#')[0],mobile,args.capture_dir)
        browser.close()
