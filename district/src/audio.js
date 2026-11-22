const wheelDuration=4.4, wheelTravel=25.5;
function wheelProgress(seconds){
  const t=Math.min(1,Math.max(0,seconds/wheelDuration));
  return t*(2-t);
}

function createDistrictAudio(){
  let muted=false,context=null,master=null,camera=null,visible=true,spinVoice=null;
  const samples=new Map(),voices=new Set(),rate=24000;
  try{muted=localStorage.getItem('haruma.district.muted')==='yes';}catch{}
  function wake(){
    if(!visible)return;
    if(!context){
      const Engine=window.AudioContext||window.webkitAudioContext;
      if(!Engine)return;
      try{context=new Engine({latencyHint:'interactive'});}catch{return;}
      master=context.createGain();master.gain.value=muted?0:.62;master.connect(context.destination);
    }
    if(context.state!=='running')context.resume().catch(()=>{});
  }
  function makeSample(kind){
    if(samples.has(kind))return samples.get(kind);
    const length={wheel:wheelDuration+.075,cloth:1.55,light:.13,water:2.12,paper:.93}[kind];
    const buffer=context.createBuffer(1,Math.ceil(rate*length),rate),out=buffer.getChannelData(0);
    let seed=739;
    function noise(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2147483648-1;}
    function tick(at,gain,frequency){
      const start=Math.floor(at*rate);
      let air=0;
      for(let i=0;i<rate*.043&&start+i<out.length;i++){
        const t=i/rate;
        air+=.70*(noise()-air);
        out[start+i]+=gain*Math.min(1,i/12)*Math.exp(-t*145)*
          (.72*air+.35*Math.sin(6.283*frequency*t)+.12*Math.sin(6.283*frequency*2.6*t));
      }
    }
    if(kind==='wheel'){
      // Invert the same decelerating rotation used by the drawn wheel.
      const toothAngle=Math.PI/8;
      for(let tooth=1;tooth*toothAngle<wheelTravel;tooth++){
        const speed=Math.sqrt(1-tooth*toothAngle/wheelTravel);
        tick(wheelDuration*(1-speed),(.33+.34*speed)*(.92+.08*noise()),1380+310*speed);
      }
    }else if(kind==='paper'){
      let low=0,mid=0;
      for(let i=0;i<out.length;i++){
        const t=i/rate,n=noise();
        low+=.10*(n-low);mid+=.65*(n-mid);
        const sweep=.55*Math.exp(-((t-.32)**2)/.016)+.30*Math.exp(-((t-.69)**2)/.005);
        out[i]=(mid-low)*sweep*(.66+.19*Math.cos(77*t)+.12*Math.sin(151*t));
      }
      tick(.82,.14,830);
    }else if(kind==='water'){
      let low=0;
      for(let i=Math.floor(.45*rate);i<out.length;i++){
        const t=i/rate, swell=Math.min(1,(t-.45)*6,(length-t)*5);
        low+=.16*(noise()-low);out[i]=.36*swell*low;
      }
      for(let t=.5;t<2;t+=.033+.047*(1+noise()))tick(t,.22+.10*noise(),670+360*noise());
    }else if(kind==='light'){
      tick(0,.69,760);tick(.023,.32,521);
    }else{
      let low=0,mid=0;
      for(let i=0;i<out.length;i++){
        const t=i/rate, n=noise();low+=.047*(n-low);mid+=.31*(n-mid);
        const swell=Math.sin(Math.PI*t/length)**2*(.63+.24*Math.cos(9*t)+.10*Math.cos(19*t));
        out[i]=swell*(.68*low+.42*mid);
      }
    }
    samples.set(kind,buffer);return buffer;
  }
  function place(voice){
    if(!camera)return;
    const [x,y,z]=voice.pos,m=camera;
    const dx=m[0]*x+m[4]*y+m[8]*z+m[12],dy=m[1]*x+m[5]*y+m[9]*z+m[13];
    const t=context.currentTime;
    if(voice.pan)voice.pan.pan.setTargetAtTime(Math.max(-.85,Math.min(.85,dx*.82)),t,.06);
    const localEffect=voice.kind==='water'||voice.kind==='paper';
    const proximity=localEffect?Math.min(1, .22+2.4*Math.hypot(m[1],m[5],m[9])):1;
    voice.gain.gain.setTargetAtTime(.92*proximity/(1+.7*(dx*dx+dy*dy)),t,.08);
  }
  function play(kind,pos){
    if(!context||muted||!visible||voices.size>12)return;
    if(kind==='wheel'&&spinVoice)spinVoice.source.stop();
    const source=context.createBufferSource(),gain=context.createGain();
    source.buffer=makeSample(kind);
    const pan=context.createStereoPanner?context.createStereoPanner():null;
    source.connect(gain);
    if(pan){gain.connect(pan);pan.connect(master);}else gain.connect(master);
    const v={source,gain,pan,pos,kind};place(v);voices.add(v);
    if(kind==='wheel')spinVoice=v;
    source.onended=()=>{voices.delete(v);if(spinVoice===v)spinVoice=null;source.disconnect();gain.disconnect();pan?.disconnect();};
    source.start();
  }
  function setView(m){
    camera=m;
    for(const v of voices)place(v);
  }
  function setVisible(next){
    if(visible===next)return;
    visible=next;
    if(!context)return;
    if(!visible){
      for(const v of voices)v.source.stop();
      context.suspend().catch(()=>{});
    }else if(!muted)context.resume().catch(()=>{});
  }
  function toggle(){
    muted=!muted;
    try{localStorage.setItem('haruma.district.muted',muted?'yes':'no');}catch{}
    if(master)master.gain.setTargetAtTime(muted?0:.62,context.currentTime,.012);
    return muted;
  }
  return {wake,play,setView,setVisible,toggle};
}
