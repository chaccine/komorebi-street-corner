"""Walk from the tea shop to the riverside and back by picking visible geometry."""
import argparse
from pathlib import Path
from time import time

from playwright.sync_api import sync_playwright

import check_district as d


def double_blank(page, session, mobile):
    point = page.evaluate('districtCheck.blankPoint()')
    if not mobile:
        page.mouse.dblclick(point['x'], point['y'])
        return
    timestamp = time()
    for offset in (0, .17):
        for action, points, delay in [('touchStart', [point], 0), ('touchEnd', [], .04)]:
            session.send('Input.dispatchTouchEvent', dict(type=action, touchPoints=points,
                         timestamp=timestamp+offset+delay))


def drag_bridge(page, session, mobile):
    x, y = d.target(page, 30)
    dx = -47 if x > page.viewport_size['width']/2 else 47
    if mobile:
        for action, points in [('touchStart', [dict(x=x,y=y)]),
                               ('touchMove', [dict(x=x+dx,y=y+14)]), ('touchEnd', [])]:
            session.send('Input.dispatchTouchEvent', dict(type=action,touchPoints=points))
    else:
        page.mouse.move(x,y)
        page.mouse.down()
        page.mouse.move(x+dx,y+14,steps=4)
        page.mouse.up()


def exercise(browser, url, size, captures):
    w,h = size
    mobile = w < h
    label = f'{w}x{h}'
    ctx = browser.new_context(viewport=dict(width=w,height=h), is_mobile=mobile, has_touch=mobile,
                              device_scale_factor=3 if mobile else 1)
    try:
        ctx.add_init_script(script=d.PROBE)
        page = ctx.new_page()
        errors = []
        page.on('pageerror',lambda error: errors.append(str(error)))
        session = ctx.new_cdp_session(page)
        d.ready(page,url)
        def visible(ids):
            counts = page.evaluate('districtCheck.objects()')
            assert all(counts.get(str(i),0)>20 for i in ids), (label,ids,counts)
        def choose(id_, route):
            d.select(page,id_,touch=mobile)
            d.expect_hash(page,'#'+route)
        visible([1,4,5,30])
        d.screenshot(page,captures,label+'-street')
        choose(1,'tea')
        double_blank(page,session,mobile)
        d.expect_hash(page,'')
        before = page.evaluate('districtCheck.last.view')
        drag_bridge(page,session,mobile)
        d.resting_camera(page)
        assert page.evaluate('location.hash')==''
        assert before != page.evaluate('districtCheck.last.view')
        choose(30,'riverside')
        visible([8,9,30])
        d.screenshot(page,captures,label+'-river')
        drag_bridge(page,session,mobile)
        d.resting_camera(page)
        assert page.evaluate('location.hash')=='#riverside'
        choose(30,'bridgehead')
        visible([5,30])
        d.screenshot(page,captures,label+'-bridgehead')
        page.go_back()
        d.expect_hash(page,'#riverside')
        page.go_forward()
        d.expect_hash(page,'#bridgehead')
        choose(30,'riverside')
        for id_,slug in [(8,'postbox'),(9,'riverside-steps')]:
            choose(id_,slug)
            double_blank(page,session,mobile)
            d.expect_hash(page,'#riverside')
        d.ready(page,url+'#riverside')
        visible([8,9,30])
        assert page.evaluate('districtCheck.glError()')==0 and not errors,errors
        print(label,'tea, bridge on both banks, drags, history, river landmarks and direct entry passed',flush=True)
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
        for size in [(390,844),(1080,760),(360,800)]:
            exercise(browser,args.url.split('#')[0],size,args.capture_dir)
        browser.close()
