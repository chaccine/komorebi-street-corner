"""Check the stone basin, both perches, visible ripples and the two-part sound."""
import argparse
from pathlib import Path

from playwright.sync_api import sync_playwright

import check_district as district


# Preserve the scene colours and depth test. Mark bird and ripple pixels in the
# picking channel so we can distinguish visible geometry from animation state.
MARK = r"""
const api=WebGL2RenderingContext.prototype, orig=api.shaderSource;
api.shaderSource=function(stage,code){
  code=code.replace('vec3 pigment=color;', 'float ring=0.;vec3 pigment=color;')
    .replace('lit=mix(lit,vec3(.85,.91,.77)', 'ring=wave;lit=mix(lit,vec3(.85,.91,.77)')
    .replace('float(id)/255.', '(movement>=9&&movement<=11?245.:ring>.28?246.:float(id))/255.');
  return orig.call(this,stage,code);
};
"""


def check_perch(page,x,y,z):
    uv=page.evaluate('districtCheck.object(245).uv')
    m=page.evaluate('districtCheck.last.view')
    expected=((1+m[0]*x+m[4]*y+m[8]*z+m[12])/2,(1-m[1]*x-m[5]*y-m[9]*z-m[13])/2)
    assert all(abs(a-b)<.055 for a,b in zip(uv,expected)),(uv,expected)


def tap_world(page,x,y,z):
    coords=page.evaluate('([x,y,z])=>{const m=districtCheck.last.view;return [(1+m[0]*x+m[4]*y+m[8]*z+m[12])*innerWidth/2,(1-m[1]*x-m[5]*y-m[9]*z-m[13])*innerHeight/2]}',[x,y,z])
    page.touchscreen.tap(*coords)


def exercise(browser,url,mobile,captures):
    size={'width':390,'height':844} if mobile else {'width':1080,'height':760}
    ctx=browser.new_context(viewport=size,device_scale_factor=3 if mobile else 1,is_mobile=mobile,has_touch=mobile)
    try:
        ctx.add_init_script(script=MARK)
        ctx.add_init_script(script=district.PROBE)
        page=ctx.new_page()
        district.ready(page,url)
        district.resting_camera(page)
        district.screenshot(page,captures,'mobile-district' if mobile else 'desktop-district')
        if mobile:
            for target,route in [(2,'cycles'),(4,'florist')]:
                district.select(page,target,touch=True)
                district.expect_hash(page,'#'+route)
                page.keyboard.press('Home')
                district.expect_hash(page,'')
        district.select(page,16 if mobile else 6,touch=mobile)
        district.expect_hash(page,'#courtyard')
        if mobile:
            tap_world(page,-.96,.30,-7.33)
            district.resting_camera(page)
            assert page.evaluate("location.hash==='#courtyard' && districtCheck.last.birdAge<0")
        assert page.evaluate('districtCheck.sparrowSounds')==0
        check_perch(page,-.04,.85,-6.95)
        district.screenshot(page,captures,'mobile-rim' if mobile else 'rim')
        if mobile:
            tap_world(page,-.71,.69,-7.16)
        else:
            district.select(page,16)
        district.wait(page,'districtCheck.last.birdAge>.35')
        assert page.evaluate('districtCheck.objects()[246]||0')>12,'No ripple on the water'
        district.wait(page,'districtCheck.last.birdAge>1.12')
        check_perch(page,.38,1.04,-8.29)
        district.screenshot(page,captures,'mobile-wall' if mobile else 'wall')
        district.wait(page,'districtCheck.last.birdAge<0')
        check_perch(page,-.04,.85,-6.95)
        assert page.evaluate('districtCheck.sparrowSounds')==1
        if mobile:
            page.set_viewport_size({'width':844,'height':390})
            district.resting_camera(page)
        page.keyboard.press('m')
        district.select(page,16,touch=mobile)
        district.wait(page,'districtCheck.last.birdAge>1.12')
        check_perch(page,.38,1.04,-8.29)
        assert page.evaluate('districtCheck.sparrowSounds')==1
        assert page.evaluate('districtCheck.glError()')==0
        print(('Touch' if mobile else 'Mouse')+': basin, two perches, ripples, flutter/chirp, muted replay passed',flush=True)
    finally:
        ctx.close()


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('target',nargs='?',default=(district.ROOT/'index.html').as_uri())
    parser.add_argument('--capture-dir',type=Path)
    args=parser.parse_args()
    if args.capture_dir:
        args.capture_dir.mkdir(parents=True,exist_ok=True)
    with sync_playwright() as pw:
        browser=pw.chromium.launch(executable_path=str(district.BROWSER if district.BROWSER.is_file() else pw.chromium.executable_path),
            chromium_sandbox=True,args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
        for mobile in (False,True):
            exercise(browser,args.target.split('#')[0],mobile,args.capture_dir)
        browser.close()


if __name__=='__main__':
    main()
