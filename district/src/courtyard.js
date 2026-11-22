// The two low treads rise eastwards from the florist's stone lane.
function buildCourtyard(g){
  const bowlX=-.38,bowlZ=-7.16,limestone=['#b9b49c','#c6bda4','#aea994','#bdbba1'];
  const box=(x,y,z,w,h,d,c)=>g.box([x,y,z],[w,h,d],c);
  g.group(6);
  box(.03,.055,-7.33,3.21,.12,2.05,'#a59f8a');
  for(let j=0;j<5;j++){
    const z=-6.53-j*.40;
    box(-1.38,.078,z,.38,.16,.389,limestone[j%4]);
    box(-.96,.15,z,.44,.30,.389,limestone[(j+1)%4]);
  }
  box(.44,.15,-7.33,2.37,.30,2.035,'#afa890');
  for(let j=0;j<4;j++)for(let k=0;k<3;k++){
    box(-.347+k*.784,.307,-6.575-j*.502,.774,.023,.491,limestone[(j*3+k)%4]);
  }
  for(let i=0;i<6;i++){
    const x=-1.15+i*.505,h=.51+(i%3)*.012;
    box(x,.30+h/2,-8.29,.498,h,.28,i%2?'#929780':'#9ca08c');
    box(x,.30+h+.04,-8.29,.503,.08,.32,limestone[i%4]);
    for(let j=0;j<5;j++){
      const xx=x-.20+j*.061+.045*Math.sin(3*i+j),y=.44+.24*(.5+.5*Math.sin(2*i+j));
      const size=.032+.014*Math.cos(i*3+j);
      g.ball([xx,y,-8.149],[size*1.70,.018,size*.28],j%2?'#84916b':'#899772',7,3);
    }
  }
  for(const [x,z] of [[-.67,-8.02],[1.42,-8.02],[.87,-7.81],[-.78,-6.85]]){
    for(let j=0;j<7;j++){
      const a=j*2.4,l=.09+.04*(j%3),dx=Math.cos(a),dz=Math.sin(a);
      g.face([[x,.319,z],[x+dx*l*.45-dz*.022,.39,z+dz*l*.45+dx*.022],
        [x+dx*l,.41+.03*(j%2),z+dz*l],[x+dx*l*.52+dz*.015,.379,z+dz*l*.52-dx*.015]],j%2?'#81945e':'#98a96e');
    }
  }
  // An irregular lathed rim has a sloping interior around a separate water surface.
  g.group(16);
  const sides=24,stone=['#898e80','#959889','#848c80','#9b9e8c'];
  const profile=[[.22,.32],[.28,.36],[.34,.46],[.46,.65],[.455,.70],[.356,.70],[.329,.589]];
  function ring(i,band){
    const a=i*2*Math.PI/sides,[r,y]=profile[band],jitter=1+.018*Math.cos(a*5)+.014*Math.sin(a*3);
    return [bowlX+r*jitter*Math.cos(a),y+.006*Math.sin(3*a),bowlZ+r*jitter*Math.sin(a)];
  }
  for(let i=0;i<sides;i++)for(let j=0;j<profile.length-1;j++){
    g.face([ring(i,j),ring(i+1,j),ring(i+1,j+1),ring(i,j+1)],j===4?'#c0bca7':stone[(Math.floor(i/3)+j)%4]);
  }
  // Pale lichen patches and a few dark seams break up the worn lip of the basin.
  for(const a of [.31,.43,.51,2.52,2.67,2.71,4.42,5.03]){
    const r=.398+.012*Math.cos(a*9),y=.703+.006*Math.sin(3*a);
    g.ball([bowlX+r*Math.cos(a),y,bowlZ+r*Math.sin(a)],[.024,.004,.013],
      a<3?'#9ca483':'#adab99',7,3);
  }
  g.group(16,false,'basinWater');
  g.rod([bowlX,.599,bowlZ],[bowlX,.631,bowlZ],.349,'#749e98',24);
  buildCourtyardSparrow(g);
  g.group(0);
}

// Authored at the origin with its feet on the ground; the renderer puts it on
// either perch. Both wing hinges ride with the body and use the same flight clock.
function buildCourtyardSparrow(g){
  const egg=(x,y,z,rx,ry,rz,color)=>g.ball([x,y,z],[rx,ry,rz],color,12,7);
  g.group(16,false,'sparrow');
  for(const side of [-1,1]){
    const z=side*.038;
    g.line([[.006,.071,z],[.025,.028,z],[-.005,.008,z]],.008,'#967954');
    for(const toe of [-1,1])g.rod([-.005,.009,z],[-.040,.006,z+toe*.014],.005,'#90714f',5,.002);
  }
  egg(.019,.142,0,.148,.108,.092,'#ad8c62');
  egg(-.037,.127,0,.095,.091,.085,'#d2bf98');
  egg(-.094,.228,0,.098,.096,.092,'#a47c55');
  egg(-.100,.272,0,.089,.059,.083,'#986c4a');
  egg(-.163,.195,0,.040,.045,.049,'#594b3d');
  for(const s of [-1,1]){
    egg(-.115,.225,s*.072,.059,.047,.023,'#dfcfac');
    egg(-.097,.220,s*.092,.023,.017,.007,'#685341');
    egg(-.149,.254,s*.073,.017,.018,.013,'#3f3e33');
    egg(-.154,.260,s*.083,.005,.005,.004,'#eee2c4');
  }
  g.rod([-.17,.233,0],[-.244,.224,0],.027,'#63594a',6,.002);
  for(const s of [-1,1]){
    g.face([[.090,.158,s*.008],[.149,.166,s*.053],[.289,.204,s*.038],[.258,.204,s*.009]],'#80674c');
    g.group(16,false,s>0?'nearWing':'farWing');
    const shoulder=[-.036,.191,s*.071],mid=[.06,.159,s*.103],tip=[.157,.106,s*.085];
    g.face([shoulder,[.062,.202,s*.075],tip,mid],'#896947');
    g.face([shoulder,mid,tip,[.035,.103,s*.087]],'#776149');
    for(let i=0;i<2;i++){
      const x=.014+i*.036;
      g.face([[x,.174,s*.103],[x+.014,.174,s*.104],[x+.047,.14,s*.103],[x+.030,.142,s*.104]],'#d2b78c');
    }
    g.group(16,false,'sparrow');
  }
}

const courtyardFlightDuration=5.65;
function courtyardBirdPose(age,reduced){
  const ease=t=>t*t*(3-2*t);
  const unit=t=>Math.max(0,Math.min(1,t));
  const outward=ease(unit((age-.14)/.86)),back=ease(unit((age-3.53)/.72));
  const travel=outward-back;
  const arc=Math.sin(Math.PI*outward),hop=Math.sin(Math.PI*back);
  const step=reduced?(age>.55&&age<3.8?1:0):travel;
  const lift=reduced?0:.51*arc+.38*hop;
  return {offset:[-.04+.42*step,.70+.19*step+lift,-6.95-1.34*step],
    yaw:reduced?0:1.72*travel-2.8*ease(unit((age-2.95)/.48))*(1-back),
    wing:reduced?0:arc*(1.25+.88*Math.sin(age*35))+.27*hop};
}
