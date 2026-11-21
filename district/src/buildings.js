// Distances are metres. Each workshop owns its pick groups; the street renderer
// can omit fine details until a visitor comes close.
function buildDistrictBuildings(g) {
  const tau=2*Math.PI;
  function workshop(x0,z0) {
    const point=([x,y,z])=>[x+x0,y,z+z0];
    return {
      box:(x,y,z,w,h,d,c)=>g.box(point([x,y,z]),[w,h,d],c),
      face:(vertices,c)=>g.face(vertices.map(point),c),
      rod:(a,b,r,c,s=8,r2=r)=>g.rod(point(a),point(b),r,c,s,r2),
      line:(path,r,c,s=6)=>g.line(path.map(point),r,c,s),
      ball:(x,y,z,rx,ry,rz,c,s=10,n=6)=>g.ball(point([x,y,z]),[rx,ry,rz],c,s,n),
      sign:(t,x,y,z,w,h,fg,bg)=>g.sign(t,point([x,y,z]),w,h,fg,bg)
    };
  }

  function pot(b,x,y,z,s,leaf,clay) {
    b.rod([x,y,z],[x,y+.19*s,z],.10*s,clay,8,.145*s);
    b.rod([x,y+.177*s,z],[x,y+.207*s,z],.149*s,clay,8);
    for(let i=0;i<6;i++){
      const a=i*2.39+.3,length=s*(.19+.035*(i%3)),h=s*(.18+.045*((i*2)%3));
      const tip=[x+Math.cos(a)*length,y+.23*s+h,z+Math.sin(a)*length];
      const side=[-.048*s*Math.sin(a),.048*s*Math.cos(a)];
      const mid=[(x+tip[0])*.5,y+.29*s+h*.45,(z+tip[2])*.5];
      const base=[x,y+.19*s,z];
      b.face([base,[mid[0]+side[0],mid[1],mid[2]+side[1]],tip,mid],leaf);
      b.face([base,mid,tip,[mid[0]-side[0],mid[1]-.02*s,mid[2]-side[1]]],i%2?'#65915d':'#799954');
    }
  }

  // A wheel has an open hub and a solid tyre section, so the spokes can be
  // seen from behind and its profile remains legible from the side.
  function wheel(b,x,y,z,r,segments,tyre,rim,spokes,reflector) {
    const thickness=.088*r;
    const path=(rad,slice,depth)=>[x+rad*Math.cos(slice*tau/segments),
      y+rad*Math.sin(slice*tau/segments),z+depth];
    for(let i=0;i<segments;i++){
      const j=i+1,outer=r,inner=r*.882;
      b.face([path(outer,i,-thickness),path(outer,j,-thickness),
        path(outer,j,thickness),path(outer,i,thickness)],i%7===2?'#514e42':tyre);
      for(const side of [-1,1]){
        const dz=side*thickness;
        b.face([path(outer,i,dz),path(outer,j,dz),path(inner,j,dz),path(inner,i,dz)],tyre);
        b.face([path(inner,i,dz),path(inner,j,dz),path(.84*r,j,dz),path(.84*r,i,dz)],rim);
      }
      if(i%2===0)b.rod([x,y,z],path(.87*r,(i+1)%segments,.008),.018*r,spokes,5);
    }
    b.rod([x,y,z-thickness*1.6],[x,y,z+thickness*1.75],.105*r,rim,9);
    if(reflector){
      b.rod(path(.52*r,2,thickness),path(.79*r,2,thickness),.045*r,'#eaae53',6);
      b.rod(path(.82*r,13,thickness),path(.72*r,13,thickness),.018*r,'#cbaf78',6);
    }
  }

  function teaShop(){
    const b=workshop(-4.6,-.75);
    const wood='#705840',beam='#584c3d',cream='#e2d8b5',trim='#a88c61',green='#567b70';
    const front=1.33,back=-1.42;
    g.group(1);
    b.box(0,.12,0,4.08,.24,2.92,'#898c7b');
    b.box(0,2.65,-.045,3.93,1.83,2.75,cream);
    b.box(0,1.00,-.78,3.93,1.60,1.28,'#ae9a77');
    b.box(-1.84,.99,.55,.25,1.61,1.53,cream);
    b.box(1.27,.99,.55,1.35,1.61,1.53,cream);
    b.box(-.56,.68,front-.05,2.44,.94,.18,'#735944');
    for(let i=0;i<11;i++)b.box(-1.69+i*.222,.66,front+.046,.018,.84,.023,'#85694d');
    b.box(-.56,1.14,front-.19,2.57,.10,.65,trim);
    b.box(-.56,1.47,.77,2.43,.62,.07,'#45574d');
    b.box(-.55,1.72,.84,2.35,.08,.18,'#71654a');
    b.box(-.55,.97,front+.044,2.49,.063,.063,'#51493d');
    for(const x of [-1.92,.68,1.92])b.box(x,1.04,front+.065,.084,1.70,.105,beam);
    b.box(1.24,.98,front+.08,1.05,1.54,.10,beam);
    b.box(1.24,.98,front+.145,.91,1.41,.035,'#577667');
    b.box(1.24,1.22,front+.167,.76,.67,.027,'#344f51');
    b.box(1.24,1.34,front+.183,.695,.34,.012,'#78958d');
    b.box(1.24,.61,front+.17,.67,.32,.028,'#476054');
    b.box(1.58,.93,front+.207,.025,.18,.036,'#c0a36e');
    b.box(1.22,.165,front+.18,1.28,.065,.49,'#b6b299');
    b.box(0,1.82,front+.068,4.03,.15,.17,beam);
    b.box(0,2.24,front+.073,3.89,.36,.12,'#796a4f');
    b.box(0,2.246,front+.14,3.78,.283,.026,'#e8d8ae');
    b.sign('喫茶　晴間',.09,2.246,front+.158,2.47,.272,'#415747','#e8d8ae');
    // Upper glass has its own pick group for the café's warm-room response.
    for(const x of [-.93,.85]){
      b.box(x,2.96,front+.012,1.46,.77,.10,wood);
      g.group(11,false,'lamp');
      b.box(x,2.966,front+.067,1.332,.652,.023,'#6d8e88');
      g.group(1);
      b.box(x,3.085,front+.085,1.32,.032,.028,trim);
      for(let j=-1;j<=1;j++)b.box(x+.33*j,2.966,front+.091,.035,.68,.037,'#836b50');
      b.box(x,2.56,front+.052,1.57,.075,.21,'#a7a38a');
    }
    g.group(11,false,'lamp');
    b.box(-.99,1.62,.819,.52,.16,.022,'#b1a17a');
    g.group(1);
    // Orange fabric is pulled taut at the wall and cut into rounded scallops.
    const awning=['#cb804b','#d99254','#cc854c','#df9858','#d18d52'];
    for(let i=0;i<10;i++){
      const l=-2.01+i*.402,r=l+.402,z0=front+.08,z1=front+.70;
      b.face([[l,2.083,z0],[r,2.083,z0],[r,1.773,z1],[l,1.773,z1]],awning[i%5]);
      b.face([[l,1.774,z1],[r,1.774,z1],[r,1.720,z1],[r-.055,1.685,z1],
        [l+.10,1.681,z1],[l+.015,1.709,z1]],i%2?'#bc7245':'#bd7849');
      b.rod([l,2.086,z0],[l,1.776,z1],.009,'#e8b67d',5);
    }
    for(const x of [-1.87,1.85])b.rod([x,1.60,front+.11],[x,1.78,front+.67],.026,green,6);
    // Gabled standing-seam roof, topped with a folded ridge cap.
    const ridge=-.16,eave=3.55,peak=4.12,width=4.37;
    for(const side of [-1,1]){
      const z=side>0?front+.185:back-.19;
      for(let i=0;i<11;i++){
        const a=-width/2+width*i/11,c=a+width/11;
        b.face([[a,eave,z],[c,eave,z],[c,peak,ridge],[a,peak,ridge]],
          ['#648f80','#719988','#6d9683','#779d89'][i%4]);
        b.rod([a,eave+.01,z],[a,peak+.011,ridge],.014,'#96ad92',5);
      }
      b.box(0,eave-.04,z,width+.045,.09,.072,'#4a665b');
      for(const x of [-1.97,1.97]){
        b.face([[x,eave,z],[x,peak,ridge],[x,eave,ridge]],'#d2cbab');
        b.rod([x,eave+.005,z],[x,peak+.02,ridge],.032,'#698374',6);
      }
    }
    b.rod([-2.22,peak+.03,ridge],[2.22,peak+.03,ridge],.052,'#87a48c',6);
    // Narrow side sash and back door keep the shop readable on a full orbit.
    for(const side of [-1,1]){
      const x=side*1.976;
      b.box(x,2.89,-.45,.065,.76,1.22,wood);
      b.box(x+side*.043,2.89,-.45,.038,.64,1.1,'#708b83');
      b.box(x+side*.074,2.89,-.45,.028,.66,.043,trim);
      b.box(x+side*.068,2.55,-.45,.146,.06,1.32,'#a7a08a');
    }
    b.box(.97,1.01,back,1.0,1.60,.087,'#615644');
    b.box(.97,1.01,back-.061,.86,1.48,.047,'#788b71');
    // A squat blue kettle gives the original café its recognisable scale.
    b.ball(-.50,1.32,front+.02,.20,.165,.16,'#527f86',12,7);
    b.rod([-.50,1.452,front+.02],[-.50,1.48,front+.02],.127,'#8daaa3',10,.09);
    b.ball(-.50,1.494,front+.02,.037,.026,.035,beam,8,4);
    b.line([[-.64,1.395,front+.02],[-.64,1.53,front+.02],[-.56,1.596,front+.02],
      [-.43,1.596,front+.02],[-.36,1.525,front+.02],[-.36,1.395,front+.02]],.02,beam);
    b.rod([-.38,1.301,front+.046],[-.232,1.397,front+.07],.064,'#53838a',8,.043);
    b.rod([-.232,1.397,front+.07],[-.202,1.462,front+.07],.043,'#91aba5',8,.047);
    g.group(1,true);
    for(const x of [-1.24,-1.03]){
      b.rod([x,1.201,front+.05],[x,1.307,front+.05],.045,'#ded9bb',9,.071);
      b.rod([x,1.308,front+.05],[x,1.312,front+.05],.053,'#71624a',9);
    }
    b.line([[1.99,3.51,front-.04],[2.005,3.32,front-.04],[2.005,3.23,front-.13],
      [2.005,.38,front-.13],[2.08,.31,front-.12]],.036,green,7);
    b.box(-1.05,2.69,back-.002,1.32,.82,.074,trim);
    b.box(-1.05,2.69,back-.049,1.21,.70,.035,'#6f8980');
    b.box(-1.05,2.69,back-.071,.037,.69,.015,wood);
    b.box(.30,2.34,back-.045,.52,.33,.18,'#b6b69f');
    for(let i=0;i<5;i++)b.box(.15+i*.068,2.34,back-.148,.022,.22,.012,'#838a77');
    pot(b,-1.77,.22,front+.32,.77,'#6c8756','#a77755');
  }

  function bicycleShed(){
    const b=workshop(.35,-2);
    const post='#71644b',dark='#4d534a';
    const front=1.46,back=-1.24;
    g.group(2);
    b.box(0,.115,.025,3.10,.23,2.84,'#a4a18b');
    b.box(0,.222,.025,3.02,.044,2.78,'#aaa893');
    b.box(0,1.28,back,2.98,2.15,.096,'#758985');
    b.box(-1.45,1.24,-.04,.11,2.13,2.48,'#839691');
    b.box(1.45,1.20,-.47,.11,2.04,1.55,'#7f938e');
    for(const x of [-1.42,1.42])for(const z of [back+.02,front]){
      b.box(x,.31,z,.20,.27,.20,'#919582');
      b.box(x,1.40,z,.112,2.16,.112,post);
    }
    b.box(0,2.37,front,3.03,.15,.13,post);
    b.box(0,2.26,back,3.00,.11,.13,dark);
    const roofY=z=>2.46+.11*(z-back);
    const near=front+.24,far=back-.16;
    // Folded blue sheet with a rusty cut lip and a cooling strip of skylights.
    for(let i=0;i<17;i++){
      const x=-1.73+i*.204,mid=x+.045,r=x+.204;
      const tint=['#759398','#81999a','#728e92','#7c9695'][i%4];
      b.face([[x,roofY(far),far],[mid,roofY(far)+.035,far],
        [mid,roofY(near)+.035,near],[x,roofY(near),near]],'#93a9a2');
      b.face([[mid,roofY(far)+.035,far],[r,roofY(far),far],
        [r,roofY(near),near],[mid,roofY(near)+.035,near]],tint);
    }
    b.box(0,roofY(near)-.028,near,3.52,.08,.065,'#8b6c51');
    b.box(0,roofY(far)-.027,far,3.52,.08,.065,'#677b74');
    const skyPanel=[[.52,-.84],[1.15,-.84],[1.15,.13],[.52,.13]];
    b.face(skyPanel.map(([x,z])=>[x,roofY(z)+.055,z]),'#b2c5b7');
    for(let i=0;i<4;i++){
      const [x,z]=skyPanel[i],[tx,tz]=skyPanel[(i+1)%4];
      b.rod([x,roofY(z)+.060,z],[tx,roofY(tz)+.060,tz],.023,'#759087',6);
    }
    // A weathered fascia reserves a clear patch of air beneath for the wheel.
    b.box(-.79,2.50,front+.08,1.30,.30,.068,'#655842');
    b.sign('自転車',-.79,2.50,front+.117,1.22,.244,'#3f625c','#d8cba0');
    b.box(-.66,.92,-.81,1.30,.10,.58,'#847457');
    for(const x of [-1.22,-.11])b.box(x,.57,-.78,.078,.64,.29,dark);
    b.box(-.68,1.47,back+.081,1.37,.75,.05,'#b5a882');
    b.box(1.00,.66,-.79,.72,.85,.56,'#647e75');
    b.box(1.00,1.127,-.78,.80,.082,.61,'#99856b');
    for(let j=0;j<2;j++)b.box(1.02,.55+j*.31,-.49,.57,.026,.039,'#a9aa8b');
    const wx=.10,wy=1.98,wz=1.72,wr=.455;
    b.line([[wx-.35,roofY(near)-.11,wz-.07],[wx,wy,wz-.09],
      [wx+.22,roofY(near)-.11,wz-.07]],.014,'#756950',5);
    g.group(12,false,'wheel');
    wheel(b,wx,wy,wz,wr,32,'#3d4742','#bec2a7','#9ca59b',true);
    g.group(2);
    // A partly restored touring bicycle, with a visible frame triangle.
    const z=.80,ax=-1.07,bx=-.14,y=.56,r=.31;
    wheel(b,ax,y,z,r,24,'#4d554b','#b0afa0','#909b8b',false);
    wheel(b,bx,y,z,r,24,'#4d554b','#b0afa0','#909b8b',false);
    const rear=[ax,y,z+.03],hub=[-.69,y+.012,z+.064],head=[-.39,.947,z+.058],
      seat=[-.82,.965,z+.064],fork=[bx,y,z+.03];
    b.line([rear,seat,hub,rear],.025,'#a16547');
    b.line([hub,head,seat],.030,'#b67551');
    b.line([fork,head,[-.41,1.06,z+.058],[-.31,1.08,z+.058]],.021,'#797c68');
    b.line([hub,seat,[-.85,1.016,z+.064]],.021,'#858675');
    b.box(-.855,1.031,z+.065,.186,.041,.075,'#544b3c');
    b.rod([-.69,y+.012,z+.066],[-.69,y+.012,z+.11],.069,'#797967',9);
    b.box(-1.18,.857,z+.01,.257,.032,.15,'#8d8671');
    b.line([[ax,y,z],[ax-.03,.849,z],[-1.30,.849,z]],.012,'#898d7a');
    b.box(.92,.43,.31,.44,.37,.36,'#937650');
    b.box(.92,.43,.502,.38,.034,.023,'#b49870');
    g.group(2,true);
    for(let i=0;i<11;i++)b.box(-1.482,1.25,back+.13+i*.214,.052,1.99,.019,'#a0a998');
    for(let i=0;i<9;i++)b.box(-1.33+i*.315,1.40,back-.065,.025,1.88,.032,'#82948a');
    for(let j=0;j<5;j++){
      const x=-1.19+j*.236,yy=1.41+(j%2)*.105;
      b.rod([x,yy+.19,back+.127],[x+.045,yy-.10,back+.132],.023,j%2?'#807b61':'#656f67',6);
      b.rod([x+.044,yy-.095,back+.132],[x+.054,yy-.158,back+.136],.031,'#9d704c',7);
    }
    b.box(-.47,1.025,-.78,.25,.117,.19,'#607579');
    b.rod([-.18,.946,-.89],[-.18,1.21,-.89],.052,'#aca788',9);
    b.line([[.85,2.38,-.95],[1.34,1.91,-.95],[1.34,1.15,-.95]],.018,'#9c8c69');
    b.box(.45,1.20,back-.061,.70,.54,.06,post);
    b.box(.45,1.20,back-.101,.59,.43,.03,'#729090');
  }

  function apartment(){
    const b=workshop(4.9,-1.7);
    const trim='#70867a',rail='#698b7f',wall='#d5be99',cream='#ded0ac',shadow='#786d59';
    const front=1.36,back=-1.40;
    g.group(3);
    b.box(0,.141,-.02,3.29,.282,2.90,'#938f7c');
    b.box(0,2.78,-.02,3.10,5.03,2.76,wall);
    for(const floor of [0,1,2]){
      const y=.266+floor*1.64;
      b.box(0,y+.021,0,3.20,.104,2.89,'#b3a48a');
      b.box(0,y+.003,front+.205,3.26,.119,.55,'#9b9783');
      b.box(0,y+.059,front+.214,3.24,.037,.555,'#cbbea0');
      // Inset blue-green front doors and sliding sashes behind the galleries.
      b.box(-.91,y+.67,front+.018,.68,1.24,.063,shadow);
      b.box(-.91,y+.65,front+.062,.58,1.15,.027,['#738c81','#829488','#6b837b'][floor]);
      b.box(-.91,y+.96,front+.084,.37,.355,.024,'#54716e');
      b.box(-.702,y+.61,front+.091,.034,.082,.025,'#c6b088');
      b.box(.56,y+.905,front+.025,1.35,.78,.067,shadow);
      b.box(.56,y+.905,front+.075,1.235,.677,.026,'#75938d');
      b.box(.56,y+.98,front+.092,.034,.54,.030,'#c5b79a');
      b.box(.90,y+.942,front+.093,.325,.593,.016,'#d3c6a3');
      if(floor){
        const left=floor===1?-1.53:-.83,right=floor===1?.83:1.53;
        for(const [h,t] of [[.704,.052],[.227,.032]])
          b.box((left+right)/2,y+h,front+.466,right-left,t,.046,rail);
        for(let j=0;j<=8;j++)
          b.box(left+(right-left)*j/8,y+.41,front+.466,.030,.611,.034,rail);
      }
      // Shorter side windows on the stair-facing and open end walls.
      for(const side of [-1,1]){
        b.box(side*1.563,y+.928,-.39,.065,.80,1.23,shadow);
        b.box(side*1.609,y+.928,-.39,.028,.69,1.11,'#72928c');
        b.box(side*1.637,y+.928,-.39,.029,.69,.037,cream);
        b.box(side*1.595,y+.509,-.39,.15,.052,1.32,'#b5a68a');
      }
      b.box(.71,y+.889,back-.025,1.22,.79,.055,'#786c59');
      b.box(.71,y+.889,back-.062,1.12,.67,.032,'#799188');
      b.box(.71,y+.888,back-.090,.032,.69,.024,cream);
    }
    // Two flights zigzag in front of the gallery. The left foot opens on the
    // shared yard; the little half-landings leave each storey accessible.
    const z=front+.75,run=2.34,rise=1.64,steps=12;
    for(let flight=0;flight<2;flight++){
      const d=flight?-1:1,start=flight?1.17:-1.17,y=.32+flight*rise;
      const end=start+d*run;
      const point=t=>[start+d*run*t,y+rise*t,z+.241];
      for(let j=0;j<steps;j++){
        b.box(start+d*(j+.5)*run/steps,y+(j+1)*rise/steps,z,
          run/steps+.012,.058,.49,'#afaa92');
      }
      for(const side of [-1,1]){
        b.rod([start,y-.021,z+side*.218],[end,y+rise-.021,z+side*.218],.044,trim,6);
      }
      const first=point(0),last=point(1);
      b.rod([first[0],first[1]+.599,first[2]],[last[0],last[1]+.599,last[2]],.027,rail,7);
      for(let j=0;j<=6;j++){
        const [x,yy,pz]=point(j/6);
        b.rod([x,yy+.01,pz],[x,yy+.597,pz],.018,rail,6);
      }
      b.box(end,y+rise-.02,front+.49,.68,.105,.98,'#acaa93');
      b.box(end+d*.325,y+rise+.31,front+.50,.039,.65,.047,rail);
      b.box(end+d*.325,y+rise+.61,front+.51,.042,.045,.97,rail);
    }
    b.box(0,5.34,-.02,3.27,.126,2.92,'#928a77');
    b.box(0,5.42,-.02,3.21,.07,2.86,'#b1afa0');
    for(const x of [-1.57,1.57])b.box(x,5.52,-.02,.09,.17,2.84,'#c2b89e');
    for(const zEdge of [-1.397,1.36])b.box(0,5.52,zEdge,3.19,.17,.09,'#c9bda0');
    // A modest water tank is the high point of the residential silhouette.
    b.box(-.70,5.66,-.43,.79,.34,.81,trim);
    b.rod([-.70,5.83,-.43],[-.70,6.28,-.43],.414,'#a8b6a4',14);
    b.rod([-.70,6.28,-.43],[-.70,6.35,-.43],.43,'#8eaa96',14,.32);
    b.rod([-.70,5.91,-.43],[-.70,5.94,-.43],.42,'#879c8c',14);
    b.box(.99,5.56,-.73,.61,.26,.50,'#adac99');
    b.rod([.99,5.59,-.73],[.99,5.86,-.73],.108,trim,9);
    // Low laundry rail: the sheet's top is fixed to its clips. Each pleat is
    // mesh geometry and the lower hem hangs at its own length.
    const clothZ=1.91;
    for(const x of [-.52,1.32]){
      b.rod([x,4.32,front+.411],[x,4.97,clothZ],.021,rail,6);
    }
    b.rod([-.53,4.915,clothZ],[1.33,4.915,clothZ],.011,'#a59878',6);
    pot(b,.53,3.637,front+.28,1.12,'#5f8057','#a87958');
    g.group(13,false,'cloth');
    const top=[],bottom=[],segs=11;
    for(let i=0;i<=segs;i++){
      const u=i/segs,x=-.10+1.10*u,fold=Math.sin(u*Math.PI*5+.4)*.034;
      top.push([x,4.903-.024*Math.sin(Math.PI*u),clothZ+.023+fold*.27]);
      bottom.push([x+.025*Math.sin(u*4.3),4.015+.047*Math.cos(u*5.6)+.014*Math.sin(u*15),
        clothZ+.07+fold]);
    }
    for(let i=0;i<segs;i++){
      b.face([top[i],top[i+1],bottom[i+1],bottom[i]],
        ['#eee9ce','#f3ecd1','#e9e4ca','#e2e0c9','#eee7cd'][i%5]);
    }
    g.group(3,true);
    for(const x of [-.085,.98])b.box(x,4.909,clothZ+.026,.037,.073,.031,'#9c7e51');
    pot(b,1.17,.32,front+.189,.96,'#637d4d','#997152');
    pot(b,.95,1.984,front+.21,.74,'#74905b','#ad7c5a');
    for(let floor=0;floor<3;floor++){
      const y=.266+floor*1.64;
      b.box(-1.345,y+.98,front+.055,.126,.102,.035,'#e3d7b5');
      b.box(-1.33,y+.684,front+.058,.063,.067,.048,trim);
      b.box(1.605,y+.56,.63,.182,.322,.54,'#c4c2aa');
      for(let j=0;j<4;j++)b.box(1.70,y+.501+j*.038,.63,.018,.014,.35,'#919b89');
    }
    b.line([[-1.54,5.46,back],[-1.62,5.31,back-.05],[-1.62,.45,back-.05],
      [-1.68,.33,back-.13]],.039,'#7e9787',7);
  }
  teaShop();bicycleShed();apartment();g.group(0);
}
