// The bookstall verge ends at x=8. The promenade meets the arch at x=12.6.
function buildRiverside(g){
  const bridgeZ=7.14, start=7.65, span=5.15;
  const stone=['#cec5a5','#d8ccab','#bfbda5','#d6c9af'];
  const grass=['#889b59','#a4af66','#78945b'];
  let seed=22417;
  function random(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
  function slab(x,y,z,w,h,d,color){g.box([x,y,z],[w,h,d],color);}
  function stalk(x,y,z,h,col){
    g.face([[x-.046,y,z],[x+.053,y,z+.02],[x+.11,y+h,z-.05]],col);
    g.face([[x,y,z+.08],[x,y,z-.04],[x-.10,y+h*.78,z+.09]],col);
  }
  g.group(0);
  // Sandstone layers along the cut bank, with the current drawn in short broken strokes.
  slab(10.28,-1.36,5.15,4.56,.78,10.7,'#948d77');
  slab(10.28,-1.02,5.15,4.56,.23,10.7,'#9dbba1');
  slab(10.28,-.894,5.15,4.56,.07,10.7,'#75b7ac');
  for(let i=0;i<100;i++){
    const x=8.08+random()*4.34,z=.04+random()*10.17,l=.13+random()*.55;
    const c=i%4===0?'#b6d8bd':i%4===1?'#97c9b8':'#84bfb1';
    g.face([[x,-.855,z-l*.5],[x-.034,-.855,z],[x+.02,-.855,z+l*.5],[x+.025,-.855,z]],c);
  }
  slab(16.55,-.96,5.15,8.1,1.72,10.7,'#ab9e83');
  slab(16.55,-1.45,5.15,8.105,.15,10.705,'#a3967d');
  slab(16.55,-.27,5.15,8.116,.2,10.716,'#b5ab8c');
  slab(16.55,-.095,5.15,8.1,.19,10.7,'#b7c080');
  for(let row=0;row<3;row++){
    for(let z=-.2;z<10.499;){
      const length=Math.min(10.5-z,.58+random()*.53);
      slab(12.50,-.14-row*.3,z+length/2,.17,.287,length-.012,stone[(random()*4)|0]);
      z+=length;
    }
  }
  // Promenade runs along the river. Its paving turns into the bridge at the bookstall.
  const pavers=['#cec6aa','#d6cdb4','#d2c8ad','#d8cfb4'];
  function paving(x,z,w,d,idx){slab(x,.026,z,w,.052,d,pavers[idx%4]);}
  for(let i=0;i<12;i++)paving(2.70+i*.43,bridgeZ,.417,1.04,i);
  for(let i=0;i<6;i++)paving(12.98+i*.39,bridgeZ,.378,1.46,i+1);
  for(let i=0;i<18;i++){
    const z=.52+.535*i;
    for(let j=0;j<2;j++)paving(14.96+j*.73,z,.712,.517,i+j*2);
  }
  for(let i=0;i<4;i++)paving(12.83+.51*i,3.17,.497,1.8,i);
  g.group(9);
  for(let i=0;i<5;i++){
    const x=12.59-i*.31,top=.059-i*.183;
    for(let j=0;j<3;j++)slab(x,(top-1.02)/2,2.38+j*.77,.329,top+1.02,.756,stone[(i+j)%4]);
  }
  g.group(30);
  function crown(t){return .079+.26*Math.sin(Math.PI*t);}
  function soffit(t){return -.89+.995*Math.sin(Math.PI*t)**.60;}
  const count=16;
  for(let i=0;i<count;i++){
    const t=i/count,u=(i+1)/count,x=start+t*span,X=start+u*span;
    const y=crown(t),Y=crown(u),s=soffit(t),S=soffit(u);
    const back=bridgeZ-.77,front=bridgeZ+.77;
    g.face([[x,y,back],[x,y,front],[X,Y,front],[X,Y,back]],stone[(i*3)%4]);
    g.face([[x,s,front],[x,y,front],[X,Y,front],[X,S,front]].reverse(),stone[i%4]);
    g.face([[x,s,back],[x,y,back],[X,Y,back],[X,S,back]],stone[i%4]);
    g.face([[x,s,front],[x,s,back],[X,S,back],[X,S,front]],'#9e9c85');
    for(const z of [back,front]){
      g.rod([x,y+.045,z],[X,Y+.045,z],.083,'#d4c5a8',6);
      for(const h of [.34,.61])g.rod([x,y+h,z],[X,Y+h,z],h>.4?.043:.022,'#5b776b',6);
      if(i%3===0||i===count-1){
        g.rod([x,y+.05,z],[x,y+.63,z],.043,'#576f61',6);
      }
    }
  }
  for(const x of [start,start+span])for(const z of [bridgeZ-.77,bridgeZ+.77]){
    slab(x,.36,z,.23,.71,.23,'#b6b39b');slab(x,.735,z,.29,.075,.29,'#dccdb0');
  }
  g.group(8);
  const mx=14.16,mz=8.35;
  function drum(y,Y,r,R,color){g.rod([mx,y,mz],[mx,Y,mz],r,color,16,R);}
  slab(mx,.071,mz,.68,.14,.67,'#b8ad93');
  drum(.14,.21,.28,.25,'#5d6259');drum(.21,.59,.18,.19,'#9f4636');
  drum(.55,.65,.29,.305,'#a64738');drum(.65,1.40,.30,.30,'#c65741');
  drum(1.40,1.45,.33,.34,'#a24936');drum(1.45,1.54,.34,.27,'#cf6149');
  drum(1.54,1.59,.27,.082,'#cf6149');
  slab(mx,1.245,mz+.292,.31,.078,.035,'#493f39');
  slab(mx,1.302,mz+.31,.38,.045,.095,'#a14734');
  g.sign('〒',[mx,1.05,mz+.307],.29,.23,'#fff0cc','#c65741');
  slab(mx,.80,mz+.297,.20,.09,.024,'#efe4c4');
  g.group(0);
  // Stone edging, grass tufts and alder branches keep the far bank low at the bridge.
  for(let i=0;i<26;i++){
    const z=.26+random()*9.82,x=12.68+random()*.45;
    if(Math.abs(z-bridgeZ)<1.04||Math.abs(z-3.17)<1.43)continue;
    for(let j=0;j<5;j++)stalk(x+.11*random(),.005,z+.15*random(),.16+.23*random(),grass[j%3]);
    if(i%3===0)g.ball([x-.33,-.81,z],[.22,.17,.35],'#9aab92',7,3);
  }
  for(const [x,z,h] of [[18.75,2.36,2.8],[19.3,8.63,2.22]]){
    g.rod([x,0,z],[x-.08,h*.77,z],.135,'#817961',8,.067);
    for(let i=0;i<5;i++){
      const a=i*2.41,dx=.64*Math.cos(a),dz=.64*Math.sin(a),y=h-.22*i;
      g.rod([x-.05,h*.42,z],[x+dx,y,z+dz],.068,'#8d8268',6,.032);
      g.ball([x+dx,y+.13,z+dz],[.76,.52,.76],['#8da878','#a2b87c','#799a71'][i%3],9,4);
    }
    for(let i=0;i<10;i++)stalk(x+random()*1.3-.65,0,z+random()*1.1-.55,.19,grass[i%3]);
  }
  for(const [x,z] of [[16.75,1.18],[18.7,.72],[19.72,4.44],[17.8,9.38],[13.46,1.22]]){
    for(let i=0;i<9;i++){
      const X=x+(random()-.5)*.86,Z=z+(random()-.5)*.49,h=.10+random()*.13;
      stalk(X,.01,Z,h,grass[i%3]);
      if(i%3===0)g.ball([X+.07,h,Z],[.055,.025,.055],'#f4df91',6,2);
    }
  }
  // A narrow timber seat faces the channel beside the steps.
  for(const z of [2.8,4.15])slab(16.43,.215,z,.48,.41,.20,'#a6a38c');
  for(const x of [16.23,16.43,16.63])slab(x,.455,3.48,.175,.105,2.06,'#aa8968');
}
