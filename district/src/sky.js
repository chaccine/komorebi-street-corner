const swallowPerches=[[18.05,2.48,8.57],[18.38,2.67,8.18]];

function buildRiverSky(g){
  // A single faceted volume. Overlapping domes share a shallow, uneven underside.
  g.group(44,false,'cloud');
  const puffs=[[-1.32,.53,.36,.42],[-.79,.72,.67,.74],[-.03,.78,.96,.89],
    [.69,.71,.52,.68],[1.32,.61,.29,.48],[1.81,.44,.15,.31]];
  let last;
  for(let i=0;i<=56;i++){
    const x=-1.85+i*4.10/56;
    let high=.003,wide=.003;
    for(const [mid,r,h,w] of puffs){
      const arc=Math.sqrt(Math.max(0,1-((x-mid)/r)**2));
      high=Math.max(high,arc*h);wide=Math.max(wide,arc*w);
    }
    const ring=Array.from({length:18},(_,j)=>{
      const a=j*Math.PI/9,s=Math.sin(a),c=Math.cos(a);
      return [16.2+x,6.16+(s>0?high:.33*wide)*s+.055*Math.sin(2*x),
        1.05+.18*Math.sin(x*2.8)+wide*c*(1+.10*Math.sin(3*a+x))];
    });
    if(last)for(let j=0;j<ring.length;j++){
      const k=(j+1)%ring.length;
      g.face([last[j],ring[j],ring[k],last[k]],j<9?'#fff4da':'#cbdad3');
    }
    last=ring;
  }
  // Exposed alder twigs support the feet above the foliage on the mailbox side.
  g.group(0);
  for(const [x,y,z] of swallowPerches){
    g.line([[19.19,1.43,8.58],[x+.38,y-.36,z+.12],[x,y-.093,z],[x-.19,y-.075,z-.07]],.038,'#82775e',7);
  }
  for(let i=0;i<2;i++){
    g.group(45+i,false,'swallow');
    g.ball([.014,.035,0],[.196,.085,.089],'#384653',10,5);
    g.ball([.044,.008,0],[.156,.067,.078],'#dedbca',10,5);
    g.ball([.171,.085,0],[.091,.083,.078],'#34414d',10,5);
    g.rod([.225,.076,0],[.301,.064,0],.037,'#605549',6,.002);
    for(const s of [-1,1]){
      g.ball([.201,.104,s*.069],[.016,.016,.011],'#252e35',7,3);
      g.face([[-.10,.048,0],[-.106,.048,s*.067],[-.51,.084,s*.185],[-.226,.048,s*.018]],'#354350');
      g.rod([.056,-.032,s*.036],[.042,-.087,s*.038],.009,'#63584c',5);
    }
    g.group(45+i,false,'swallowWing');
    for(const s of [-1,1]){
      const root=[.092,.08,s*.046],elbow=[.076,.116,s*.283],tip=[-.226,.121,s*.575];
      const wrist=[-.106,.065,s*.259],back=[-.119,.055,s*.057];
      g.face([root,elbow,wrist,back],'#42515f');
      g.face([elbow,tip,wrist],'#303e4c');
      g.face([back,wrist,tip,[-.172,.074,s*.241]],'#56636d');
    }
  }
  g.group(0);
}

function createRiverSky(){
  const period=29,flight=14;
  const clamp=x=>Math.max(0,Math.min(1,x));
  const smooth=x=>x*x*(3-2*x);
  const mix=(a,b,t)=>a+(b-a)*t;
  const angleMix=(a,b,t)=>a+Math.atan2(Math.sin(b-a),Math.cos(b-a))*t;
  const perched=i=>({position:swallowPerches[i],yaw:-2.74,pitch:.10,bank:0,flap:0,fold:1,air:false});
  // A closed river circuit with continuous tangents, starting and ending at its own twig.
  const routes=swallowPerches.map((p,i)=>[p,[16.15,3.78-i*.28,7.15-i*.64],
    [12.48+i*.46,4.45-i*.32,5.69-i*.69],[10.03+i*.62,4.71-i*.36,3.46],
    [11.64+i*.46,5.36-i*.37,1.14+i*.48],[15.05,4.84-i*.29,2.65+i*.58],
    [17.36,3.79-i*.24,5.97+i*.32],p]);
  function position(i,u){
    const route=routes[i],v=clamp(u)*(route.length-1),k=Math.min(route.length-2,Math.floor(v)),s=v-k;
    const a=route[Math.max(0,k-1)],b=route[k],c=route[k+1],d=route[Math.min(k+2,route.length-1)];
    return b.map((B,j)=>.5*((2*B)+(-a[j]+c[j])*s+
      (2*a[j]-5*B+4*c[j]-d[j])*s*s+(-a[j]+3*B-3*c[j]+d[j])*s*s*s));
  }
  function fly(i,t){
    if(t<=0||t>=flight)return perched(i);
    const u=t/flight,point=position(i,u),ahead=position(i,u+.002),behind=position(i,u-.002);
    const tangent=ahead.map((v,j)=>v-behind[j]),dy=tangent[1];
    const heading=Math.atan2(tangent[2],tangent[0]);
    const spread=smooth(clamp(t/.52))*smooth(clamp((flight-t)/.82));
    const beat=t*(i?3.55:3.04),burst=(beat%10);
    const flap=burst<3?Math.sin(beat*2*Math.PI)*Math.min(1,burst*3,(3-burst)*3):0;
    return {position:point,yaw:angleMix(perched(i).yaw,heading,spread),
      pitch:Math.atan2(dy,Math.hypot(tangent[0],tangent[2]))*spread,
      bank:.44*Math.sin(Math.PI*u)*Math.sin(2*Math.PI*u+.4),flap:.60*flap,fold:1-spread,air:true};
  }
  let epoch=1.6,approach=null,introduced=false;
  function sample(time,reduced){
    if(reduced)return [perched(0),perched(1)];
    if(approach?.canceled&&time>=approach.start+approach.duration){
      epoch=approach.start+approach.duration+1.6;approach=null;
    }
    if(approach){
      const s=smooth(clamp((time-approach.start)/approach.duration));
      return approach.from.map((from,i)=>{
        const to=perched(i);
        const arc=from.air?.21*Math.sin(Math.PI*s):0;
        return {...to,position:from.position.map((v,j)=>mix(v,to.position[j],s)+(j===1?arc:0)),
          yaw:angleMix(from.yaw,to.yaw,s),pitch:mix(from.pitch,to.pitch,s),
          bank:from.bank*(1-s),fold:mix(from.fold,1,s),flap:from.flap*(1-s),air:from.air&&s<1};
      });
    }
    const t=time-epoch;
    return [0,1].map(i=>fly(i,t<0?-1:t%period-i*1.04));
  }
  return {sample,
    approach(time,reduced){
      if(introduced)return;
      if(reduced){introduced=true;approach=null;epoch=time+.52;return;}
      if(approach){approach.canceled=false;return;}
      approach={from:sample(time,reduced),start:time,duration:1.1};
    },
    arrive(time){
      if(introduced||(approach&&time<approach.start+approach.duration))return;
      introduced=true;approach=null;epoch=time+.52;
    },
    cancel(){if(approach)approach.canceled=true;}
  };
}
