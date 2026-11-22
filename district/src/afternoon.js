// World-space furniture and local-space figures share the street's cut-paper palette.
function buildAfternoon(g){
  const skin='#d8a482',hair='#524840',heel='#514e47';
  function oval(x,y,z,w,h,d,c){g.ball([x,y,z],[w,h,d],c,10,6);}
  function link(a,b,r,color,r2=r){g.rod(a,b,r,color,8,r2);}
  function rings(rows,color){
    for(let i=1;i<rows.length;i++){
      const a=rows[i-1],b=rows[i];
      for(let j=0;j<a.length;j++){const k=(j+1)%a.length;g.face([a[j],b[j],b[k],a[k]],color);}
    }
    g.face(rows[0].slice(),color);g.face(rows.at(-1).slice().reverse(),color);
  }
  function jacket(x,z,bottom,top,w,d,col,lean=0){
    const rows=[[bottom,w*.90,d],[bottom+.08,w,d],[top-.08,w*.96,d*.83],[top,w*.66,d*.64]].map(([y,rx,rz],i)=>
      Array.from({length:10},(_,j)=>[x+rx*Math.cos(j*Math.PI/5),y,z+i*lean/3+rz*Math.sin(j*Math.PI/5)]));
    rings(rows,col);
  }
  // The short bonnet and divided rear windows distinguish a kei estate from a van.
  g.group(40);
  const cx=4.18,cz=3.20,road=-.145;
  const carPoint=(x,y,z)=>[cx+x,road+y,cz+z];
  const panel=(points,c)=>g.face(points.map(p=>carPoint(...p)),c);
  function bodyRow(y,rear,nose,w,cut){
    return [[rear+cut,-w],[nose-cut,-w],[nose,-w+cut],[nose,w-cut],
      [nose-cut,w],[rear+cut,w],[rear,w-cut],[rear,-w+cut]].map(([x,z])=>carPoint(x,y,z));
  }
  rings([bodyRow(.24,-1.48,1.49,.56,.14),bodyRow(.36,-1.57,1.58,.64,.14),
    bodyRow(.68,-1.56,1.55,.63,.13),bodyRow(.78,-1.51,1.49,.61,.13)],'#e8daba');
  rings([bodyRow(.77,-1.43,1.00,.586,.10),bodyRow(1.30,-1.29,.61,.54,.11)],'#526b6a');
  rings([bodyRow(1.285,-1.31,.64,.56,.13),bodyRow(1.355,-1.24,.59,.52,.13)],'#829d8c');
  for(const side of [-1,1]){
    const z=.591*side,Z=.545*side;
    for(const [lo,hi,topL,topR] of [[-1.36,-.87,-1.23,-.86],[-.81,-.25,-.81,-.25],[-.18,.93,-.18,.58]]){
      panel([[lo,.826,z],[hi,.826,z],[topR,1.253,Z],[topL,1.253,Z]],'#92b2ab');
    }
    for(const x of [-.86,-.22]){
      link(carPoint(x,.79,z),carPoint(x,1.29,Z),.022,'#ebe0c4');
      g.box(carPoint(x+.15,.71,.635*side),[.132,.033,.025],'#726e60');
    }
    for(const x of [-1.01,1.04]){
      const wheel=(z1,z2,r,c)=>g.rod(carPoint(x,.264,side*z1),carPoint(x,.264,side*z2),r,c,16);
      wheel(.51,.664,.264,'#444b48');wheel(.664,.677,.161,'#bbc0ac');wheel(.677,.686,.072,'#85928a');
    }
    g.box(carPoint(1.546,.59,side*.419),[.045,.133,.215],'#f3e8bd');
    g.box(carPoint(-1.55,.57,side*.44),[.049,.17,.117],'#b5604c');
    g.box(carPoint(.69,.84,side*.665),[.16,.095,.13],'#80988a');
  }
  for(const [x,X] of [[.998,.612],[-1.435,-1.298]]){
    panel([[x,.81,-.45],[x,.81,.45],[X,1.258,.416],[X,1.258,-.416]],'#a4c1b4');
  }
  for(const x of [-1.57,1.58]){
    g.box(carPoint(x,.38,0),[.074,.078,1.05],'#a1a695');
    g.box(carPoint(x,.505,0),[.025,.11,.29],'#dfc991');
  }

  // Local +z faces the viewer. Each resident keeps distinct hair and clothing on a full orbit.
  function head(x,y,z,forward,style){
    const point=(a,b,c)=>[x+a,y+b,z+c*forward];
    oval(x,y,z,.146,.181,.141,skin);
    oval(x,y+.059,z-.024*forward,.151,.137,.143,hair);
    for(const side of [-1,1]){
      oval(...point(side*.131,-.003,0),.031,.044,.026,skin);
      oval(...point(side*.056,-.012,.132),.012,.013,.009,'#51473c');
    }
    oval(...point(0,-.042,.141),.028,.031,.026,skin);
    if(style==='bun')oval(...point(0,.051,-.158),.089,.080,.080,hair);
    if(style==='cap'){
      oval(...point(0,.116,-.01),.167,.084,.158,'#858a70');
      oval(...point(0,.092,.105),.146,.023,.112,'#78816d');
    }
    if(style==='hat'){
      oval(x,y+.102,z,.207,.025,.195,'#c4a776');
      oval(x,y+.146,z,.143,.08,.136,'#d5bd8b');
      oval(x,y+.126,z,.146,.019,.14,'#907659');
    }
  }
  g.group(41,false,'walker');
  jacket(0,0,.67,1.215,.205,.14,'#77948b');
  g.box([0,1.115,.122],[.104,.13,.017],'#e3d4b1');
  head(0,1.395,0,1,'hat');
  for(const side of [-1,1]){
    g.group(41,false,side<0?'leftStep':'rightStep');
    const x=side*.094;
    link([x,.71,0],[x,.37,.013],.10,'#626d75',.080);
    link([x,.39,.013],[x,.088,0],.080,'#626d75',.061);
    oval(x,.076,.046,.078,.074,.131,heel);
    g.group(41,false,side<0?'leftSwing':'rightSwing');
    link([side*.17,1.15,0],[side*.232,.94,.015],.084,'#77948b',.065);
    link([side*.232,.94,.015],[side*.239,.78,.063],.055,'#c79d7f',.042);
    oval(side*.239,.77,.063,.05,.058,.047,skin);
  }
  const bx=.276,bz=.06;
  g.rod([bx,.43,bz],[bx,.603,bz],.125,'#aa8357',10,.157);
  for(const y of [.459,.511,.57,.606])g.rod([bx,y,bz],[bx,y+.016,bz],.13+(y-.459)*.21,'#cfac75',10);
  g.line([[bx,.60,bz-.14],[bx,.724,bz-.11],[bx,.77,bz],[bx,.724,bz+.11],[bx,.60,bz+.14]],.015,'#987447',7);
  for(const [x,z,c] of [[-.06,.04,'#85a265'],[.04,-.05,'#d9b067'],[.07,.06,'#86a579']])oval(bx+x,.604,bz+z,.060,.069,.061,c);
  // A contact shadow follows the walker without refreshing the entire street's shadow map.
  g.group(41,false,'footShadow');
  g.face(Array.from({length:16},(_,i)=>[.23*Math.cos(-i*Math.PI/8),.002,.17*Math.sin(-i*Math.PI/8)]),'#a6a48f');

  g.group(42);
  const reader=-2.17,friend=-1.39;
  function sitter(x,color,style,lean){
    jacket(x,7.042,.52,1.075,.205,.128,color,lean);
    head(x,1.25,7.032+lean,-1,style);
    for(const side of [-1,1]){
      const a=x+side*.105;
      link([a,.56,7.03],[a+side*.022,.495,6.76],.097,'#5c6670',.083);
      link([a+side*.022,.495,6.76],[a+side*.044,.095,6.72],.080,'#5c6670',.056);
      oval(a+side*.044,.05,6.67,.076,.074,.132,heel);
    }
  }
  sitter(reader,'#738a98','cap',-.055);
  sitter(friend,'#be8d79','bun',-.083);
  function sleeve(a,b,c,col,pointing=false){
    link(a,b,.078,col,.061);link(b,c,.055,'#c99c80',.038);
    oval(...c,.049,.045,.052,skin);
    if(pointing)link(c,[c[0]-.067,c[1]-.01,c[2]-.026],.019,skin,.011);
  }
  for(const s of [-1,1])sleeve([reader+s*.164,1.012,6.993],[reader+s*.249,.837,6.915],[reader+s*.227,.813,6.763],'#738a98');
  sleeve([friend+.162,.995,6.968],[friend+.219,.79,6.901],[friend+.106,.604,6.754],'#be8d79');
  g.group(42,false,'pointing');
  sleeve([friend-.162,.995,6.968],[friend-.285,.883,6.86],[friend-.432,.83,6.728],'#be8d79',true);
  g.group(42,false,'lapPaper');
  function sheet(u,v){return [reader+u,.745+.205*v+.045*Math.abs(u),6.858-.31*v];}
  function print(l,r,b,t,c,ink=false){
    const points=[[l,b],[r,b],[r,t],[l,t]].map(([u,v])=>sheet(u,v));
    if(ink)for(const p of points)p[1]+=.004;
    g.face(points,c);
  }
  for(const s of [-1,1])print(Math.min(0,s*.286),Math.max(0,s*.286),0,1,'#e4dbc0');
  print(-.24,-.021,.68,.84,'#626f64',true);
  for(let i=0;i<5;i++)print(-.24,-.044+(i%2)*.018,.14+i*.09,.16+i*.09,'#919185',true);
  print(.027,.25,.24,.80,'#9fb4a4',true);
  g.face([[.046,.44],[.106,.65],[.188,.65],[.234,.44]].map(([u,v])=>{const p=sheet(u,v);p[1]+=.008;return p;}),'#60857a');

  function flowers(x,z,potted,red){
    g.group(43);
    const base=potted?.28:0;
    if(potted){
      g.rod([x,0,z],[x,.276,z],.14,'#b78265',10,.207);
      g.rod([x,.257,z],[x,.289,z],.22,'#c59170',10);
      g.rod([x,.289,z],[x,.293,z],.184,'#635d48',10);
    }
    for(let i=0;i<(potted?7:14);i++){
      const a=2.40*i,r=.15+.05*Math.sin(i*3.12);
      const X=x+Math.cos(a)*r*(potted?1:2.7),Z=z+Math.sin(a)*r,h=base+.19+.10*(.5+.5*Math.sin(i*2.37));
      link([X,base,Z],[X+.022,h,Z],.012,'#738957',.008);
      g.ball([X-.03,h-.09,Z],[.066,.034,.039],'#779357',6,3);
      g.ball([X+.055,h-.073,Z+.01],[.063,.037,.045],'#8da363',6,3);
      for(let j=0;j<5;j++){
        const theta=j*2*Math.PI/5+a;
        g.ball([X+.022+.031*Math.cos(theta),h+.008*Math.sin(theta),Z+.031*Math.sin(theta)],
          [.036,red?.031:.017,.035],red?['#c95d51','#d76b59'][i%2]:['#e6bd56','#efcf6a','#f1da89'][i%3],6,3);
      }
      g.ball([X+.022,h+.015,Z],[.021,.016,.021],red?'#e6a475':'#bd914a',6,2);
    }
  }
  flowers(-2.74,.91,true,true);flowers(-2.93,-5.47,false,false);flowers(13.57,8.76,false,false);
  g.group(0);
}

function afternoonPose(time){
  // Walk an integral number of strides, rest at the alley, turn there, then retrace the path.
  const leg=8.4,rest=4.2,half=leg+rest;
  const phase=time%(2*half),out=phase<half,t=phase%half;
  const q=Math.min(1,t/leg),distance=q*q*(3-2*q);
  const u=Math.min(1,Math.max(0,(t-leg-1.15)/1.8)),turn=u*u*(3-2*u);
  const heading=(out?0:Math.PI)+Math.PI*turn;
  return [-5.83+3.78*(out?distance:1-distance),Math.PI*1.5+heading,distance*6,
    Math.min(1,q*14,(1-q)*14)];
}
