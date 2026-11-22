const districtPlaces=[
  {id:1,slug:'tea',name:'晴间茶铺',center:[-4.65,1.90,.04],width:4.65,height:4.30,yaw:.15,feature:[-4.65,2.97,.67]},
  {id:2,slug:'cycles',name:'自行车修理棚',center:[.32,1.37,-.64],width:3.75,height:3.0,yaw:.16,feature:[.45,1.98,-.28]},
  {id:3,slug:'flats',name:'外廊公寓',center:[4.90,2.65,-.44],width:3.95,height:5.65,yaw:.29,feature:[5.35,4.45,.28]},
  {id:4,slug:'florist',name:'巷尾花店',center:[-1.4,1.42,-12.18],width:5.75,height:3.65,yaw:-.23,feature:[-.22,1.06,-10.75]},
  {id:5,slug:'newsstand',name:'旧书报亭',center:[1.17,.99,7.20],width:2.85,height:2.44,yaw:-.36,feature:[.92,1.03,7.68]}
];

async function startDistrict(){
  const canvas=document.querySelector('canvas'),status=document.querySelector('[role=status]');
  const touchScreen=matchMedia('(pointer:coarse)'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const audio=createDistrictAudio();
  // Let the cover reach the screen before outlining the thousands of small faces.
  await new Promise(resolve=>requestAnimationFrame(()=>setTimeout(resolve,0)));
  const mesh=createDistrictGeometry();
  buildDistrictGround(mesh);buildDistrictBuildings(mesh);
  const scene=createDistrictRenderer(canvas,mesh);
  const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
  const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
  const lerp=(a,b,t)=>a+(b-a)*t;
  const smooth=t=>t*t*(3-2*t);
  const start=performance.now();
  let focus=0,hover=0,transition=null,frame=0,timer=0,visible=true,settle=0;
  let interactionUntil=0,lastTimedFrame=0,slowFrames=0,economyUntil=0;
  let width=0,height=0,view=null,lastMatrix=null,lastEye=null;
  let wheelStart=-Infinity,wheelBase=0,clothStart=-Infinity;
  let waterStart=-Infinity;
  let pageStart=-Infinity,pageOpen=false;
  let lightStart=-Infinity,lightFrom=0,lightTo=0;
  function axes(yaw,tilt){
    const x=Math.sin(yaw),z=Math.cos(yaw),s=Math.sin(tilt),c=Math.cos(tilt);
    return [[z,0,-x],[-x*s,c,-z*s],[x*c,s,z*c]];
  }
  function matrixOf(p){
    const [r,u,eye]=axes(p.yaw,p.tilt),m=new Float32Array(16),halfX=p.extent*width/height;
    for(let k=0;k<3;k++){m[4*k]=r[k]/halfX;m[4*k+1]=u[k]/p.extent;m[4*k+2]=-eye[k]/55;}
    m[12]=-dot(p.center,r)/halfX;m[13]=-dot(p.center,u)/p.extent;m[14]=dot(p.center,eye)/55;m[15]=1;
    return {matrix:m,eye};
  }
  function poseFor(id){
    const aspect=width/Math.max(1,height),portrait=aspect<.84;
    if(id){
      const b=districtPlaces[id-1];
      return {center:b.center.slice(),yaw:b.yaw,tilt:id===5?.46:id===4?.51:.31,
        extent:Math.max(b.height*.61,b.width*.60/aspect)};
    }
    const yaw=portrait?-.48:.48,tilt=portrait?.67:.62,[r,u]=axes(yaw,tilt);
    const points=[];
    if(!portrait){
      for(const x of [-5.4,2.6])for(const z of [-16,-8])points.push([x,-1.5,z]);
      for(const x of [-8,8])for(const z of [-8,8])for(const y of [-1.5,0])points.push([x,y,z]);
    }
    for(const b of districtPlaces){
      for(const d of [-1,1])for(const y of [0,b.height]){
        points.push([b.center[0]+d*b.width*.5,y,b.center[2]+.15]);
        points.push([b.center[0]+d*b.width*.5,y,b.center[2]-2.6]);
      }
    }
    if(portrait)points.push([-4.9,-.4,3.5],[2.5,-.4,4.5]);
    const xs=points.map(p=>dot(p,r)),ys=points.map(p=>dot(p,u));
    const left=Math.min(...xs),right=Math.max(...xs),top=Math.max(...ys),bottom=Math.min(...ys);
    const center=[0,1,0],dx=(left+right)/2-dot(center,r),dy=(top+bottom)/2-dot(center,u);
    const extent=Math.max((right-left)*.54/aspect,(top-bottom)*.545);
    return {yaw,tilt,extent,center:center.map((v,i)=>v+r[i]*dx+u[i]*dy)};
  }
  function locationId(){return districtPlaces.find(b=>'#'+b.slug===location.hash)?.id||0;}
  function address(id){
    const hash=id?'#'+districtPlaces[id-1].slug:'';
    if(location.hash===hash)return;
    try{history.replaceState(null,'',location.pathname+location.search+hash);}catch{}
  }
  function stopFlight(){transition=null;}
  function travel(id,instant=false,changeAddress=true){
    focus=id;hover=0;
    if(changeAddress)address(id);
    const to=poseFor(id);
    if(instant||reduced.matches||!view){view=to;transition=null;}
    else{
      const delta=to.yaw-view.yaw;
      to.yaw=view.yaw+Math.atan2(Math.sin(delta),Math.cos(delta));
      transition={from:view,to,start:performance.now()};
    }
    status.textContent=id?'正在参观'+districtPlaces[id-1].name+'。':'晴间街区全景。';
    request();
  }
  function currentWheel(now){
    return wheelBase+(Number.isFinite(wheelStart)?wheelTravel*wheelProgress((now-wheelStart)/1000):0);
  }
  function currentLight(now){
    return lightFrom+(lightTo-lightFrom)*smooth(clamp((now-lightStart)/930,0,1));
  }
  function interact(id){
    const b=districtPlaces[id-1];if(!b)return;
    const now=performance.now();
    if(id===1){
      lightFrom=currentLight(now);lightTo=1-lightTo;lightStart=reduced.matches?now-1000:now;
      audio.play('light',b.feature);status.textContent=lightTo?'茶铺柜台和楼上的灯亮了。':'茶铺的灯熄了。';
    }else if(id===2){
      wheelBase=currentWheel(now)%(2*Math.PI);wheelStart=now;
      audio.play('wheel',b.feature);status.textContent='车轮开始空转，棘轮声渐渐放慢。';
    }else if(id===3){
      clothStart=now;audio.play('cloth',b.feature);status.textContent='风掀起床单，露出栏杆后面的植物。';
    }else if(id===4){
      if(now-waterStart<2450)return;
      waterStart=now;audio.play('water',b.feature);status.textContent='水壶倾向花槽，水滴落进泥土，花叶轻轻晃动。';
    }else if(id===5){
      if(now-pageStart<950)return;
      pageOpen=!pageOpen;
      pageStart=now;
      audio.play('paper',b.feature);
      status.textContent=pageOpen?'报纸翻开，露出夕阳下的巷尾花店插画。':'报纸翻回了头版。';
    }
    request();
  }
  function activate(hit,type){
    const owner=hit>10?hit-10:hit;
    if(owner<1||owner>districtPlaces.length)return;
    if(hit>10&&(type!=='touch'||focus===owner))interact(owner);
    else if(focus!==owner){travel(owner);if(owner===1&&!lightTo)interact(1);}
    else if(owner===1)interact(1);
    else travel(owner);
  }
  function project(point){
    const m=lastMatrix,[x,y,z]=point;
    return [(1+m[0]*x+m[4]*y+m[8]*z+m[12])*width/2,
            (1-m[1]*x-m[5]*y-m[9]*z-m[13])*height/2];
  }
  function pick(x,y,type){
    let id=scene.pick(x,y,type==='touch');
    // Hit the empty spaces between spokes as well as the rim. Keep other buildings in front.
    if(lastMatrix&&lastEye[2]>.22&&(id===2||id===0)){
      const b=districtPlaces[1].feature,center=project(b);
      const a=project([b[0]+.455,b[1],b[2]]),c=project([b[0],b[1]+.455,b[2]]);
      const box=canvas.getBoundingClientRect(),dx=x-box.left-center[0],dy=y-box.top-center[1];
      const ax=a[0]-center[0],ay=a[1]-center[1],cx=c[0]-center[0],cy=c[1]-center[1];
      const det=ax*cy-ay*cx;
      if(Math.abs(det)>1){
        const i=(dx*cy-dy*cx)/det,j=(ax*dy-ay*dx)/det;
        if(i*i+j*j<=1)id=12;
      }
    }
    return id;
  }
  function navigating(){
    stopFlight();interactionUntil=performance.now()+170;
    clearTimeout(settle);settle=setTimeout(request,190);request();
  }
  function offset(point){
    const box=canvas.getBoundingClientRect(),[r,u]=axes(view.yaw,view.tilt);
    const x=(2*(point.x-box.left)-width)/height,y=1-2*(point.y-box.top)/height;
    return r.map((v,i)=>v*x+u[i]*y);
  }
  function pan(dx,dy){
    navigating();const [r,u]=axes(view.yaw,view.tilt),s=2*view.extent/height;
    view.center=view.center.map((v,i)=>clamp(v+s*(-dx*r[i]+dy*u[i]),-20,20));
  }
  function zoom(factor,point){
    navigating();const previous=view.extent;
    view.extent=clamp(previous/factor,.80,poseFor(0).extent*1.75);
    if(point){const v=offset(point);view.center=view.center.map((x,i)=>clamp(x+v[i]*(previous-view.extent),-20,20));}
  }
  function keyAction(key){
    if(key==='m'){status.textContent=audio.toggle()?'已静音。':'声音已打开。';return;}
    if(key==='home'||key==='escape'){travel(0);return;}
    if(['1','2','3','4','5'].includes(key)){travel(Number(key));return;}
    if((key==='enter'||key===' ')&&focus)interact(focus);
  }
  function request(){
    clearTimeout(timer);timer=0;
    if(!frame&&!document.hidden&&visible)frame=requestAnimationFrame(render);
  }
  function pulse(t,duration){return t>=0&&t<duration?Math.sin(Math.PI*t/duration)**2:0;}
  function render(now){
    frame=0;
    if(!visible||document.hidden)return;
    if(transition){
      const {from,to,start:t0}=transition,p=clamp((now-t0)/650,0,1),s=smooth(p);
      view={yaw:lerp(from.yaw,to.yaw,s),tilt:lerp(from.tilt,to.tilt,s),
        extent:Math.exp(lerp(Math.log(from.extent),Math.log(to.extent),s)),
        center:from.center.map((v,i)=>lerp(v,to.center[i],s))};
      if(p===1)transition=null;
    }
    const time=(now-start)/1000,windAge=(now-clothStart)/1000,windPhase=(time+14)%27;
    const natural=pulse(windPhase,2.8)*.28;
    const cloth=reduced.matches?0:Math.max(natural,pulse(windAge,2.7));
    const rainPhase=(time+32)%57,rain=reduced.matches?0:pulse(rainPhase,11);
    const spinning=now-wheelStart<wheelDuration*1000;
    // An input can arrive after the timestamp of the first requested frame.
    const age=Math.max(0,(now-waterStart)/1000), watering=age<2.45;
    const turn=reduced.matches?1:smooth(clamp((now-pageStart)/950,0,1));
    const animating=turn<1||watering||!!transition||now-lightStart<960||(!reduced.matches&&spinning)||cloth>0||rain>0;
    const period=now-lastTimedFrame;
    if(lastTimedFrame&&period>52&&period<3000){if(++slowFrames>=5)economyUntil=now+4500;}
    else slowFrames=0;
    lastTimedFrame=animating||now<interactionUntil?now:0;
    const mobile=touchScreen.matches,economy=now<economyUntil;
    const native=window.devicePixelRatio||1, area=width*height;
    const budget=mobile?(now<interactionUntil?3.3e6:4.6e6):5e6;
    const quality=Math.min(mobile?Math.max(1.4,native):Math.min(2.3,Math.max(1.35,native)),
      4096/Math.max(width,height),Math.sqrt(budget/area));
    const {matrix,eye}=matrixOf(view);lastMatrix=matrix;lastEye=eye;audio.setView(matrix);
    const angle=reduced.matches&&Number.isFinite(wheelStart)?wheelBase+wheelTravel:currentWheel(now);
    scene.draw({matrix,eye,focus,hover,quality,mobile,economy,active:animating,
      pageTurn:pageOpen?turn:1-turn,water:watering?(reduced.matches?.85:age):0,wheelAngle:angle,lamp:currentLight(now),clothTime:cloth>0?time:0,clothAmplitude:cloth,
      rainTime:time,rainAmount:rain});
    if(!canvas.dataset.ready){canvas.dataset.ready='true';document.querySelector('.poster')?.remove();}
    if(animating){
      if(mobile||economy)timer=setTimeout(request,Math.max(0,1000/30-(performance.now()-now)-7));
      else request();
    }else if(!reduced.matches){
      // Sleep until the next breeze or passing shower.
      timer=setTimeout(request,Math.max(24,1000*Math.min(27-windPhase,57-rainPhase)+12));
    }
  }
  function layout(){
    const rect=canvas.getBoundingClientRect(),w=Math.max(1,rect.width),h=Math.max(1,rect.height);
    if(width===w&&height===h)return;
    width=w;height=h;travel(focus,true,false);
  }
  focus=locationId();layout();
  attachDistrictGestures(canvas,{pick,activate,pan,zoom,reset:()=>travel(0),unlockSound:audio.wake,keyAction,
    highlight(id){if(id!==hover){hover=id;request();}},
    orbit(dx,dy){navigating();view.yaw-=dx*.0065;view.tilt=clamp(view.tilt+dy*.0055,-1.12,1.49);}
  });
  function visibility(){
    audio.setVisible(!document.hidden&&visible);
    if(document.hidden||!visible){clearTimeout(timer);cancelAnimationFrame(frame);frame=0;lastTimedFrame=0;}
    else request();
  }
  document.addEventListener('visibilitychange',visibility);
  window.addEventListener('pagehide',()=>audio.setVisible(false));
  window.addEventListener('pageshow',visibility);
  window.addEventListener('hashchange',()=>travel(locationId(),false,false));
  reduced.addEventListener('change',()=>{if(reduced.matches&&transition){view=transition.to;transition=null;}request();});
  new ResizeObserver(layout).observe(canvas);
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;visibility();}).observe(canvas);
}
