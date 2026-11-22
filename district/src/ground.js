// A single cut through the block. The sidewalk, repair yard and rear service
// lane meet at the same level, while the carriageway sits one kerb below.
function buildDistrictGround(g) {
  g.group(0);
  const tau=Math.PI*2, road=-.145;
  let seed=368392;
  function random(){
    seed=(Math.imul(1664525,seed)+1013904223)>>>0;
    return seed/4294967296;
  }
  const range=(a,b)=>a+(b-a)*random();
  const pick=list=>list[Math.floor(random()*list.length)];
  const box=(x,y,z,w,h,d,color)=>g.box([x,y,z],[w,h,d],color);
  function flat(points,y,color){
    let area=0;
    for(let i=0;i<points.length;i++){
      const [x,z]=points[i],[nextX,nextZ]=points[(i+1)%points.length];
      area+=x*nextZ-z*nextX;
    }
    const vertices=points.map(([x,z])=>[x,y,z]);
    g.face(area>0?vertices.reverse():vertices,color);
  }
  function spot(x,z,y,rx,rz,color,n=9){
    flat(Array.from({length:n},(_,i)=>{
      const a=tau*i/n;
      return [x+rx*Math.cos(a),z+rz*Math.sin(a)];
    }),y,color);
  }
  function strip(points,width,y,color){
    for(let i=1;i<points.length;i++){
      const [x,z]=points[i-1],[a,b]=points[i],l=Math.hypot(a-x,b-z);
      const nx=(b-z)/l*width/2,nz=(x-a)/l*width/2;
      flat([[x+nx,z+nz],[a+nx,b+nz],[a-nx,b-nz],[x-nx,z-nz]],y,color);
    }
  }
  function leaf(x,y,z,length,width,height,angle,color,shade){
    const dx=Math.cos(angle),dz=Math.sin(angle);
    const root=[x,y,z],tip=[x+length*dx,y+height,z+length*dz];
    const mid=[x+length*.49*dx,y+height*.67+.016,z+length*.49*dz];
    const left=[mid[0]-width*dz,mid[1]-.030,mid[2]+width*dx];
    const right=[mid[0]+width*dz,mid[1]-.030,mid[2]-width*dx];
    g.face([root,left,tip,mid],color);g.face([root,mid,tip,right],shade);
  }
  function grass(x,y,z,size){
    const colors=['#719854','#7d9f56','#90a85e','#9db364','#638950'];
    for(let i=0;i<5;i++){
      const a=range(0,tau);
      leaf(x+range(-.035,.035)*size,y,z+range(-.035,.035)*size,
        range(.12,.29)*size,.026*size,range(.15,.36)*size,a,pick(colors),'#658751');
    }
  }
  function fern(x,y,z,size){
    for(let j=0;j<5;j++){
      const a=tau*j/5+range(-.27,.27),l=range(.37,.59)*size,h=range(.24,.50)*size;
      const dx=Math.cos(a),dz=Math.sin(a);
      for(let i=0;i<5;i++){
        const u=i/5,px=x+dx*l*u,pz=z+dz*l*u,py=y+h*Math.sin(u*2.0);
        const width=(1-u*.75)*size;
        for(const side of [-1,1])leaf(px,py,pz,.136*width,.043*width,.061*width,
          a+side*.90,pick(['#79a055','#91ac57','#a1b763']),'#668e52');
      }
    }
  }
  function moss(x,z,y,size){
    for(let i=0;i<4;i++){
      spot(x+range(-.11,.11)*size,z+range(-.094,.094)*size,y+.001*i,
        range(.09,.18)*size,range(.065,.14)*size,pick(['#7e9263','#849b64','#99a86b','#a3ad72']),7);
    }
  }

  // Profile coordinates run clockwise around the full sixteen-metre island.
  function edge(side,t,y,out=0){
    return [[t,y,8+out],[8+out,y,-t],[-t,y,-8-out],[-8-out,y,t]][side];
  }
  flat([[-8,-8],[-8,8],[8,8],[8,-8]],road,'#69736b');
  flat([[-8,-8],[-8,8],[8,8],[8,-8]],-1.22,'#645c4f');
  for(let side=0;side<4;side++){
    const spans=32,rows=[];
    for(let i=0;i<=spans;i++){
      const t=-8+16*i/spans,w=Math.sin(Math.PI*i/spans);
      rows.push([t,road,-.295+w*(.031*Math.sin(t*2.3)+range(-.012,.012)),
        -.655+w*(.078*Math.sin(t*1.12+side)+range(-.031,.031)),
        -.966+w*(.055*Math.sin(t*.84)+range(-.022,.022)),-1.22]);
    }
    const strata=[['#515b55','#525c56','#5b635a'],['#ada895','#afa996','#aaa48f'],
      ['#8c8068','#877b63','#91846c'],['#756a57','#786c58','#726955']];
    for(let i=0;i<spans;i++){
      const a=rows[i],b=rows[i+1];
      for(let j=1;j<=4;j++)g.face([edge(side,a[0],a[j]),edge(side,b[0],b[j]),
        edge(side,b[0],b[j+1]),edge(side,a[0],a[j+1])],pick(strata[j-1]));
    }
    for(let i=0;i<112;i++){
      const t=range(-7.94,7.94),y=range(-1.13,-.19),w=range(.018,.086),h=range(.017,.051);
      g.face([edge(side,t-w,y,.004),edge(side,t-w*.28,y+h,.004),
        edge(side,t+w*.83,y+h*.5,.004),edge(side,t+w,y-h*.48,.004),
        edge(side,t-w*.21,y-h*.58,.004)],pick(y>-.29?['#6e7468','#434e48']:
        y>-.64?['#8e8d7d','#c0bba8','#999b89']:['#665f50','#9d9175','#837a61']));
    }
    for(const centre of [-5.45,-.60,4.60]){
      const t=centre+range(-.45,.45),y=-.48;
      g.face([edge(side,t-.59,y+.17,.012),edge(side,t-.27,y+.24,.012),edge(side,t+.53,y+.14,.012),
        edge(side,t+.38,y-.13,.012),edge(side,t-.07,y-.24,.012),edge(side,t-.36,y-.10,.012)],'#807c6d');
      for(let j=0;j<2;j++){
        const depth=y-.092*j;
        g.line([edge(side,t-.53,depth+.033,.015),edge(side,t-.27,depth,.048),
          edge(side,t+.035,depth-.040*j,.072),edge(side,t+.37,depth+.031,.018)],
          .016,'#946747',6);
      }
      g.line([edge(side,t+.15,y+.16,.028),edge(side,t+.18,y-.05,.069),
        edge(side,t+.24,y-.14,.04)],.012,'#936444',5);
    }
    // Root bundles cross the top lip and taper down the broken face.
    for(const [index,centre] of [[0,-5.83],[1,1.72],[2,6.05]]){
      const t=centre+range(-.44,.44),rootColor=pick(['#776d47','#73694b','#807347']);
      for(let j=0;j<4;j++){
        const start=t+.09*j,turn=range(-.14,.21),depth=range(.51,1.03);
        const pts=[edge(side,start+.13,road+.014,-.17),edge(side,start,road+.009,-.016),
          edge(side,start-.04,road-.09,.045),edge(side,start+turn,-.40,.073),
          edge(side,start+turn+.08,-.66*depth-.19,.04),edge(side,start+turn+.23,-depth-.12,.014)];
        for(let k=0;k<pts.length-1;k++)g.rod(pts[k],pts[k+1],(.046-.006*k)*(1-j*.10),
          rootColor,7,(.039-.006*k)*(1-j*.1));
        if(j===0)g.line([pts[3],edge(side,start-.18,-.49,.05),edge(side,start-.27,-.58,.009)],
          .015,'#7c744e',5);
        if(index!==1 && j===1){
          for(let k=0;k<7;k++){
            const u=k/7,yy=road-.12-.63*u,tt=start+turn*u+.045*Math.sin(k);
            const a=edge(side,tt,yy,.080),b=edge(side,tt+(k%2?.09:-.09),yy-.033,.105);
            const c=edge(side,tt+(k%2?.13:-.13),yy-.117,.072),d=edge(side,tt+(k%2?.025:-.025),yy-.083,.087);
            g.face([a,b,c,d],pick(['#81a35b','#678d52','#94a861']));
          }
        }
      }
    }
  }

  // The same kerb turns the corner into the narrow lane beside the flats.
  const pavement=[[-8,-8],[-8,2.10],[6.25,2.10],[6.94,1.41],[6.94,-8]];
  flat(pavement,-.009,'#bab8a3');
  for(let k=0;k<pavement.length;k++){
    const a=pavement[k],b=pavement[(k+1)%pavement.length];
    g.face([[a[0],-.009,a[1]],[b[0],-.009,b[1]],[b[0],road,b[1]],[a[0],road,a[1]]],'#9a9989');
  }
  function kerb(a,b){
    const [x,z]=a,[u,v]=b,L=Math.hypot(u-x,v-z),dx=(u-x)/L,dz=(v-z)/L;
    const nx=-dz,nz=dx,parts=Math.ceil(L/.68);
    const pt=(s,h,w)=>[x+s*dx+w*nx,h,z+s*dz+w*nz];
    for(let i=0;i<parts;i++){
      const p=L*i/parts+.008,q=L*(i+1)/parts-.009;
      g.face([pt(p,-.004,-.135),pt(q,-.004,-.135),pt(q,-.004,.013),pt(p,-.004,.013)],pick(['#cecab2','#c8c5b1','#c1c0ad']));
      g.face([pt(p,-.004,.013),pt(q,-.004,.013),pt(q,-.039,.042),pt(p,-.039,.042)],'#c8c5b0');
      g.face([pt(p,-.039,.042),pt(q,-.039,.042),pt(q,road,.042),pt(p,road,.042)],'#a9ab99');
      g.face([pt(p,road+.005,.047),pt(q,road+.005,.047),pt(q,road+.005,.158),pt(p,road+.005,.158)],'#7f877b');
    }
  }
  kerb(pavement[1],pavement[2]);kerb(pavement[2],pavement[3]);kerb(pavement[3],pavement[4]);
  for(let row=0;row<3;row++){
    const z=1.91-row*.35;
    for(let n=-9;n<9;n++){
      const x=n*.92+(row%2)*.45,w=.9;
      const l=Math.max(-7.995,x-w/2),r=Math.min(6.23,x+w/2);
      if(r<=l)continue;
      flat([[l,z-.157],[r,z-.157],[r,z+.157],[l,z+.157]],-.004+row*.0002,
        pick(['#c7c4ad','#c9c6af','#c4c2ad','#c6c6b1']));
    }
  }
  // Worked-in concrete panels at the repair stand, with a narrow brick border.
  for(let row=0;row<5;row++)for(let col=0;col<5;col++){
    const x=-1.47+col*.69,z=-1.15+row*.46;
    flat([[x,z],[x+.666,z],[x+.666,z+.444],[x,z+.444]],-.005,
      pick(['#b4b7a6','#b9baa8','#b2b5a4','#b9b9a4']));
  }
  for(let i=0;i<11;i++)box(-1.31+i*.313,-.004,1.09,.298,.012,.117,pick(['#a98c71','#a88f76','#b49876']));
  // Drain grates and the outer white shoulder keep the reading of the road clear.
  for(const x of [-6.82,-1.98,2.50,5.70]){
    box(x,road+.008,2.31,.62,.022,.248,'#505f54');
    for(let i=0;i<9;i++)box(x-.25+i*.063,road+.023,2.31,.023,.01,.193,'#879087');
    for(const s of [-1,1])box(x,road+.022,2.31+s*.107,.60,.012,.018,'#9b9e8b');
  }
  const paint=['#d6d4b9','#d9d7c0','#d1d1b7'];
  for(const [l,r] of [[-8,-6.77],[-3.92,-1.70],[-.82,3.45],[4.12,6.05]]){
    flat([[l,2.61],[r,2.61],[r-.036,2.668],[l,2.683]],road+.007,pick(paint));
  }
  strip([[6.27,2.57],[7.41,1.47],[7.41,-3.44]],.055,road+.007,'#d0d0b6');
  for(let i=0;i<6;i++){
    const x=-5.72+.045*Math.sin(i),z=2.78+i*.506;
    flat([[x-.73,z],[x+.76,z+.014],[x+.70,z+.242],[x-.66,z+.257],[x-.76,z+.181]],
      road+.009,pick(paint));
    for(let k=0;k<3;k++){
      const px=x+range(-.63,.64),pz=z+range(.052,.19);
      flat([[px-.047,pz],[px+.022,pz-.014],[px+.053,pz+.006],[px-.022,pz+.021]],road+.011,'#7e8878');
    }
  }
  for(let i=0;i<82;i++){
    const x=range(-7.92,7.92),z=range(2.73,6.26),w=range(.025,.115);
    if(x> -6.55&&x< -4.77)continue;
    flat([[x-w,z],[x+.24*w,z-w*.20],[x+w,z+.19*w],[x-.3*w,z+.29*w]],road+.003,
      pick(['#737b70','#758074','#657167','#82887a']));
  }
  function manhole(x,z,r){
    for(const [rad,h,col] of [[1,.013,'#505e54'],[.91,.017,'#899184'],[.84,.022,'#5e6b5c']]){
      spot(x,z,road+h,r*rad,r*rad,col,24);
    }
    for(let i=0;i<16;i++){
      const a=tau*i/16,px=x+Math.cos(a)*r*.65,pz=z+Math.sin(a)*r*.65;
      strip([[px,pz],[px+Math.cos(a+.6)*r*.12,pz+Math.sin(a+.6)*r*.12]],.019,road+.025,'#9c9e84');
    }
    flat([[x-.12,z],[x-.04,z-.077],[x+.14,z-.084],[x+.077,z+.032],[x-.05,z+.067]],road+.027,'#9a9f84');
  }
  manhole(2.95,4.55,.40);manhole(7.52,-2.09,.23);
  const fissure=[[-7.80,4.74],[-7.05,4.62],[-6.82,4.26],[-6.39,4.19],[-6.07,3.91],[-5.68,3.95],[-5.38,3.64]];
  strip(fissure,.044,road+.013,'#586358');
  for(let i=0;i<fissure.length;i++){
    const [x,z]=fissure[i];moss(x,z,road+.015,.6);if(i%2===1)grass(x,road+.016,z,.41);
  }

  // A separate public verge across the carriageway makes the foreground a place,
  // with a low rail and a seat instead of another row of buildings.
  const frontRim=[[-8,6.10],[-4.78,6.10],[-4.21,6.56],[2.51,6.56],[3.03,6.20],[8,6.20]];
  for(let i=1;i<frontRim.length;i++){
    const a=frontRim[i-1],b=frontRim[i];
    flat([a,b,[b[0],8],[a[0],8]],-.027,'#98a17c');
    g.face([[a[0],-.027,a[1]],[b[0],-.027,b[1]],[b[0],road,b[1]],[a[0],road,a[1]]],'#93937e');
    const len=Math.hypot(b[0]-a[0],b[1]-a[1]),n=Math.ceil(len/.74);
    for(let j=0;j<n;j++){
      const vx=(b[0]-a[0])/n,vz=(b[1]-a[1])/n;
      const px=a[0]+vx*j,pz=a[1]+vz*j;
      flat([[px+.009,pz],[px+vx-.009,pz+vz],[px+vx-.011,pz+vz+.14],[px+.009,pz+.14]],-.017,
        pick(['#b6b59b','#b5b6a0','#c0bca4']));
    }
  }
  for(let i=0;i<53;i++){
    const x=range(-7.72,7.72),z=range(6.84,7.83),s=range(.43,1.12);
    moss(x,z,-.022,s);
    if(i%2===1)grass(x,-.011,z,s);
  }
  // Locally laid brick seat pad. Its long sightline faces all three shop fronts.
  for(let i=0;i<8;i++)for(let j=0;j<3;j++){
    const x=-2.93+i*.35+(j%2)*.075,z=6.78+j*.25;
    box(x,-.02,z,.334,.035,.231,pick(['#bdad91','#c4b298','#b8a389','#c9b79a']));
  }
  for(const x of [-2.46,-1.06]){
    box(x,.214,7.04,.128,.44,.37,'#647469');
    box(x,.48,7.25,.081,.76,.080,'#627267');
  }
  for(const z of [6.88,7.035,7.19])box(-1.76,.448,z,1.94,.052,.125,'#b89162');
  for(const y of [.67,.817])box(-1.76,y,7.26,1.94,.107,.055,'#aa835a');
  for(let k=0;k<3;k++){
    const x=3.45+k*1.43;
    g.rod([x,-.025,6.48],[x,.46,6.48],.052,'#788b78',8);
    g.ball([x,.462,6.48],[.054,.028,.054],'#acaf90',8,4);
    if(k<2)g.line([[x,.337,6.48],[x+.70,.306,6.48],[x+1.43,.337,6.48]],.023,'#81917e',6);
  }
  g.face([[-8,-.027,8],[8,-.027,8],[8,road,8],[-8,road,8]],'#8c9274');
  for(const x of [-8,8]){
    const start=x<0?6.10:6.20;
    g.face([[x,-.027,start],[x,-.027,8],[x,road,8],[x,road,start]],'#93977a');
  }

  // Rear access path and low, moss-capped retaining stones beneath the gardens.
  flat([[-7.96,-7.98],[6.89,-7.98],[6.89,-5.63],[-7.96,-5.63]],-.004,'#99a380');
  flat([[-7.98,-5.54],[6.90,-5.54],[6.90,-4.69],[-7.98,-4.69]],-.0046,'#a8a997');
  for(let i=0;i<25;i++){
    const x=-7.69+i*.592;
    if(Math.abs(x+2.05)<.70)continue;
    box(x,.12,-5.69,.574,.254,.238,pick(['#939984','#979987','#999986']));
    box(x,.264,-5.69,.582,.044,.252,pick(['#b0b09a','#afae98','#a4ad8c']));
  }
  for(const x of [-6.52,-3.35,1.66,4.34]){
    for(let i=0;i<5;i++){
      const xx=x+range(-.51,.51),z=range(-7.48,-6.02);
      moss(xx,z,.001,1.4);grass(xx,.002,z,1.0);
    }
    fern(x,.02,-6.66,1.13);
  }
  for(const [x,z] of [[-7.15,1.9],[2.74,.95],[6.64,1.52],[6.85,-3.67],[-7.73,7.67],[2.72,7.45]]){
    moss(x,z,.003,1.45);fern(x,.010,z,.84);
  }
  // A few flowering weeds have taken the joint between the stone and road.
  for(const [x,z] of [[-4.95,6.29],[1.73,6.68],[6.50,1.61]]){
    for(let j=0;j<4;j++){
      const px=x+range(-.14,.14),pz=z+range(-.055,.07),h=range(.16,.29);
      g.rod([px,.006,pz],[px+.028,h,pz-.015],.010,'#678354',5,.006);
      const bx=px+.028,bz=pz-.015;
      for(let k=0;k<5;k++){
        const a=tau*k/5,dx=.024*Math.cos(a),dz=.024*Math.sin(a);
        flat([[bx,bz],[bx+dx-dz*.6,bz+dz+dx*.6],[bx+dx*1.9,bz+dz*1.9],
          [bx+dx+dz*.6,bz+dz-dx*.6]],h,'#eadcaa');
      }
      spot(bx,bz,h+.002,.019,.019,'#d3ad5a',7);
    }
  }

  // Small clusters with warm shaded undersides and folded outer leaves retain
  // hand-cut silhouettes on a phone, with only a few hundred large crown facets.
  function streetTree(x,z,h,spread,base,olive=false){
    const color=olive?'#766e50':'#776643',inner=olive?'#667a54':'#4f8155';
    const lo=[x,base,z],mid=[x+h*.024,base+h*.32,z-h*.024],fork=[x-h*.026,base+h*.52,z+h*.012];
    g.rod(lo,mid,h*.045,color,9,h*.035);g.rod(mid,fork,h*.035,color,8,h*.024);
    for(let i=0;i<6;i++){
      const a=tau*i/6+.3,dist=range(.29,.54)*spread;
      g.rod([x+Math.cos(a)*dist,base+.015,z+Math.sin(a)*dist],[x,base+.24,z],.056*spread,color,6,h*.033);
    }
    const palette=olive?['#82945f','#91a065','#a4ac71','#92a46e']:['#70a35f','#8cb363','#91bb68','#76a66a','#a3c474'];
    for(let i=0;i<12;i++){
      const a=i*2.39996,layer=i<7?.72:.89,r=i<7?range(.47,.77)*spread:range(.13,.46)*spread;
      const tip=[x+Math.cos(a)*r*(olive?.95:1.25)+(olive?0:spread*(layer-.7)*1.5),
        base+h*(layer+range(-.061,.065))+(olive?0:.06*h*Math.cos(a+.8)),z+Math.sin(a)*r];
      const joint=[x+(tip[0]-x)*.56,base+h*(layer-.175),z+(tip[2]-z)*.48];
      g.rod(fork,joint,h*.020,color,7,h*.015);g.rod(joint,tip,h*.015,color,6,h*.007);
      const rx=range(.50,.70)*spread,rz=range(.48,.68)*spread,ry=range(.100,.148)*h;
      g.ball([tip[0],tip[1]-.058*h,tip[2]],[rx*.92,ry*.93,rz*.90],inner,8,4);
      g.ball(tip,[rx,ry,rz],pick(palette),9,5);
      // Splits at the ends of the boughs make an irregular outline against the sky.
      const fringeX=tip[0]+Math.cos(a)*rx*.83,fringeZ=tip[2]+Math.sin(a)*rz*.83;
      g.ball([fringeX,tip[1]-.015*h,fringeZ],[.245*spread,.068*h,.225*spread],pick(palette),6,3);
      for(let k=0;k<19;k++){
        const phi=range(0,tau),up=range(-.3,1),rad=Math.sqrt(1-up*up);
        const px=tip[0]+Math.cos(phi)*rx*rad,pz=tip[2]+Math.sin(phi)*rz*rad,py=tip[1]+ry*up;
        leaf(px,py,pz,range(.14,.25)*spread,range(.055,.10)*spread,range(-.06,.12)*spread,
          phi+range(-.40,.4),pick(palette),pick(palette));
      }
    }
    g.ball([x+.07*spread,base+h*.968,z-.04*spread],[.51*spread,.11*h,.49*spread],palette[2],9,4);
  }
  streetTree(-6.35,6.64,3.36,1.15,-.026);
  streetTree(5.12,-6.73,3.5,1.17,0,true);
  // The rear gardener's pruned pine has separate flattened sprays and a crooked
  // leader, unlike the broad, deciduous shade tree opposite the tea shop.
  const pineX=-5.59,pineZ=-6.43;
  const spine=[[pineX,0,pineZ],[pineX+.14,.85,pineZ+.06],[pineX-.12,1.50,pineZ],
    [pineX+.05,2.25,pineZ-.04],[pineX-.06,3.10,pineZ-.07]];
  for(let i=0;i<4;i++)g.rod(spine[i],spine[i+1],.116-.021*i,'#776b4c',8,.098-.020*i);
  for(let i=0;i<7;i++){
    const a=i*2.39996+.27,dist=.84-.079*i,by=.99+i*.27;
    const tx=pineX+Math.cos(a)*dist,tz=pineZ+Math.sin(a)*dist;
    g.line([[pineX,by-.21,pineZ],[pineX+.63*(tx-pineX),by-.07,pineZ+.63*(tz-pineZ)],
      [tx,by+.14,tz]],.047-.004*i,'#746848',7);
    for(let j=0;j<3;j++){
      const ja=a+1.89*j;
      g.ball([tx+.23*Math.cos(ja),by+.17+j*.033,tz+.21*Math.sin(ja)],
        [.46-i*.018,.18,.37-i*.014],pick(['#668957','#75985f','#86a266','#8fa66a']),8,4);
    }
  }
  g.ball([pineX-.06,3.05,pineZ-.07],[.41,.22,.34],'#8ba66f',8,4);

  // The florist's eight-metre square shares its front edge with the old yard.
  box(-1.4,-.98,-12,8,1.00,8,'#999581');
  box(-1.4,-.30,-12,8,.36,8,'#b5ae98');
  box(-1.4,-.063,-12,8,.114,8,'#a9ad88');
  for(let i=0;i<32;i++){
    const x=range(-5.3,2.48),z=range(-15.9,-8.1);
    if(z<-14.39||x>1.7||x<-4.38){moss(x,z,.005,.65);grass(x,.01,z,.85);}
  }
  for(let j=0;j<25;j++){
    const z=1.2-j*.49;
    for(let k=0;k<2;k++){
      const x=-2.24+k*.38;
      box(x,.018,z,.36,.042,.466,pick(['#c5bea7','#c5b89c','#d4cbb5','#bcb79f']));
    }
    box(-1.62,.012,z,.12,.036,.48,'#777f71');
    if(j%5===2)for(let k=0;k<4;k++)box(-1.62,.034,z-.18+k*.10,.145,.018,.024,'#a4a390');
    if(j%4===1)moss(-2.49,z,.041,.27);
  }
  for(let i=0;i<7;i++){
    const x=-5+i*1.15;
    box(x,.42,-15.81,.10,.88,.10,'#8a8066');
    if(i<6)for(const y of [.33,.63])box(x+.575,y,-15.81,1.17,.09,.065,'#a59977');
  }
}
