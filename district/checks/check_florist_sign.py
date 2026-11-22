"""Check the florist's lettering against the eave in three actual browser views."""
import argparse
from pathlib import Path

from playwright.sync_api import sync_playwright

import check_district as district


# Mark just the lettered face in the existing pick channel. Colour, geometry,
# glass blending and depth testing stay identical to the production frame.
MARK_SIGN = r"""
const proto=WebGL2RenderingContext.prototype, original=proto.shaderSource;
proto.shaderSource=function(shader,source){
  const value='float(id)/255.';
  const face='(id==4 && uv.x>=0. && abs(world.z+10.605)<0.001 ? 240.:float(id))/255.';
  return original.call(this,shader,source.replace(value,face));
};
"""


def check_face(page, label):
    visible = page.evaluate('districtCheck.object(240).n')
    frame = page.evaluate('districtCheck.last')
    m = frame['view']
    w, h = frame['size']
    # Project the 1.87 m by 0.30 m vertical label, including foreshortening.
    projected = abs(m[0]*m[5] - m[1]*m[4]) * w*h/4 * 1.87*.30
    assert .97 < visible/projected < 1.03, (label, visible, projected)
    assert page.evaluate('districtCheck.object(14).n') > 80, 'Watering can obscured'
    print(f'{label}: {visible/projected:.1%} of the label face visible', flush=True)


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('target',nargs='?',default=(district.ROOT/'index.html').as_uri())
    parser.add_argument('--capture-dir',type=Path)
    args=parser.parse_args()
    if args.capture_dir:
        args.capture_dir.mkdir(parents=True,exist_ok=True)
    url=args.target.split('#')[0]+'#florist'
    with sync_playwright() as pw:
        browser=pw.chromium.launch(executable_path=str(district.BROWSER if district.BROWSER.is_file() else pw.chromium.executable_path),
            chromium_sandbox=True,args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
        for mobile in (False,True):
            size={'width':390,'height':844} if mobile else {'width':1280,'height':720}
            ctx=browser.new_context(viewport=size,device_scale_factor=3 if mobile else 1,is_mobile=mobile,has_touch=mobile)
            ctx.add_init_script(script=MARK_SIGN)
            ctx.add_init_script(script=district.PROBE)
            page=ctx.new_page()
            district.ready(page,url)
            for label,dx,dy in ([('portrait',0,0)] if mobile else [('front',-35,-20),('alley',94,10)]):
                if dx:
                    page.mouse.move(610,410)
                    page.mouse.down()
                    page.mouse.move(610+dx,410+dy,steps=5)
                    page.mouse.up()
                    if label=='front':
                        page.mouse.wheel(0,-245)
                    page.mouse.move(1,1)
                district.resting_camera(page)
                check_face(page,label)
                district.screenshot(page,args.capture_dir,label)
            district.select(page,14,touch=mobile)
            district.wait(page,'districtCheck.history.some(f=>f.water>.25)')
            assert page.evaluate('districtCheck.glError()')==0
            ctx.close()
        browser.close()


if __name__=='__main__':
    main()
