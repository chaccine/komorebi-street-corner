// Geometry is authored in metres. Meshes with the same action and material
// share one draw call, and small details can stay off the GPU until approached.
function createDistrictGeometry() {
  const groups=new Map(),colors=new Map(),signs=[];
  let current,atlas=null,minimumY=0;
  function group(id=0,nearOnly=false,motion=''){
    const key=id+'/'+Number(nearOnly)+'/'+motion;
    if(!groups.has(key))groups.set(key,{id,nearOnly,motion,used:0,
      data:new Float32Array(11*96),lo:[Infinity,Infinity,Infinity],hi:[-Infinity,-Infinity,-Infinity]});
    current=groups.get(key);
  }
  group();
  function rgb(hex){
    if(colors.has(hex))return colors.get(hex);
    let s=String(hex).replace(/^#/,'');
    if(s.length===3)s=s[0]+s[0]+s[1]+s[1]+s[2]+s[2];
    const value=parseInt(s,16);
    if(!Number.isFinite(value))throw Error('Unknown paint colour: '+hex);
    const c=[((value>>16)&255)/255,((value>>8)&255)/255,(value&255)/255];
    colors.set(hex,c);return c;
  }
  function triangle(a,b,c,paint,uvA,uvB,uvC){
    const abx=b[0]-a[0],aby=b[1]-a[1],abz=b[2]-a[2];
    const acx=c[0]-a[0],acy=c[1]-a[1],acz=c[2]-a[2];
    const nx=aby*acz-abz*acy,ny=abz*acx-abx*acz,nz=abx*acy-aby*acx;
    const norm=Math.hypot(nx,ny,nz);if(norm<1e-10)return;
    const g=current;
    if(g.used+33>g.data.length){const next=new Float32Array(g.data.length*2);next.set(g.data);g.data=next;}
    function vertex(p,uv){
      let j=g.used;
      for(let i=0;i<3;i++){
        g.data[j++]=p[i];g.lo[i]=Math.min(g.lo[i],p[i]);g.hi[i]=Math.max(g.hi[i],p[i]);
      }
      g.data[j++]=nx/norm;g.data[j++]=ny/norm;g.data[j++]=nz/norm;
      g.data[j++]=paint[0];g.data[j++]=paint[1];g.data[j++]=paint[2];
      g.data[j++]=uv?uv[0]:-1;g.data[j++]=uv?uv[1]:-1;
      minimumY=Math.min(minimumY,p[1]);g.used=j;
    }
    vertex(a,uvA);vertex(b,uvB);vertex(c,uvC);
  }
  function face(points,hex){
    const col=rgb(hex);
    if(current.motion==='cloth'&&points.length===4){
      // Each authored pleat has its own hem length. Four strips let the
      // lower edge curl smoothly while keeping the two clips motionless.
      const [a,b,c,d]=points;
      let left=a,right=b;
      for(let j=1;j<=4;j++){
        const t=j/4;
        const nextLeft=a.map((v,i)=>v+(d[i]-v)*t),nextRight=b.map((v,i)=>v+(c[i]-v)*t);
        triangle(left,right,nextRight,col);triangle(left,nextRight,nextLeft,col);
        left=nextLeft;right=nextRight;
      }
      return;
    }
    for(let i=1;i<points.length-1;i++)triangle(points[0],points[i],points[i+1],col);
  }
  function box(center,size,hex){
    const [x,y,z]=center,[w,h,d]=size.map(v=>v*.5);
    const v=[[x-w,y-h,z-d],[x+w,y-h,z-d],[x+w,y+h,z-d],[x-w,y+h,z-d],
      [x-w,y-h,z+d],[x+w,y-h,z+d],[x+w,y+h,z+d],[x-w,y+h,z+d]];
    for(const ids of [[0,3,2,1],[4,5,6,7],[0,4,7,3],[1,2,6,5],[3,7,6,2],[0,1,5,4]]){
      face(ids.map(i=>v[i]),hex);
    }
  }
  function rod(a,b,r,hex,sides=8,r2=r){
    const axis=districtUnit([b[0]-a[0],b[1]-a[1],b[2]-a[2]]);
    if(axis.every(n=>n===0))return;
    const u=districtUnit(districtCross(axis,Math.abs(axis[1])>.85?[1,0,0]:[0,1,0]));
    const v=districtCross(axis,u),base=[],top=[];
    for(let i=0;i<sides;i++){
      const angle=i*2*Math.PI/sides,c=Math.cos(angle),s=Math.sin(angle);
      const normal=u.map((val,j)=>val*c+v[j]*s);
      base.push(a.map((val,j)=>val+r*normal[j]));top.push(b.map((val,j)=>val+r2*normal[j]));
    }
    for(let i=0;i<sides;i++){
      const j=(i+1)%sides;face([base[i],base[j],top[j],top[i]],hex);
    }
    if(r>0)face(base.reverse(),hex);
    if(r2>0)face(top,hex);
  }
  function ball(center,radii,hex,sides=10,rings=6){
    const R=typeof radii==='number'?[radii,radii,radii]:radii;
    const rows=[];
    for(let j=0;j<=rings;j++){
      const a=-Math.PI*.5+j*Math.PI/rings,h=Math.cos(a),row=[];
      for(let i=0;i<sides;i++){
        const b=2*Math.PI*i/sides;
        row.push([center[0]+R[0]*h*Math.cos(b),center[1]+R[1]*Math.sin(a),center[2]+R[2]*h*Math.sin(b)]);
      }
      rows.push(row);
    }
    for(let j=0;j<rings;j++)for(let i=0;i<sides;i++){
      const k=(i+1)%sides;face([rows[j][i],rows[j+1][i],rows[j+1][k],rows[j][k]],hex);
    }
  }
  function line(points,r,hex,sides=6){
    for(let i=0;i<points.length-1;i++)rod(points[i],points[i+1],r,hex,sides);
  }
  function sign(text,center,width,height,foreground,background){
    signs.push({text,center,width,height,foreground,background,group:current});
  }
  function finish(){
    if(atlas)return atlas;
    const canvas=document.createElement('canvas');
    // Match the board's aspect ratio in the atlas. A wide sign stuffed into a
    // square cell would select a coarse mip for its short edge and blur the text.
    let x=3,y=3,rowH=0,lastX=1;
    const cells=signs.map(tag=>{
      const ratio=tag.width/tag.height;
      const w=Math.max(16,Math.min(960,Math.round(ratio*104))),h=Math.max(16,Math.min(192,Math.round(w/ratio)));
      if(x+w+3>1024){x=3;y+=rowH+6;rowH=0;}
      const cell={x,y,w,h};
      x+=w+6;lastX=Math.max(lastX,x);rowH=Math.max(rowH,h);return cell;
    });
    canvas.width=Math.min(1024,lastX);canvas.height=signs.length?y+rowH+3:1;
    const pen=canvas.getContext('2d');
    signs.forEach((tag,i)=>{
      const {x:sx,y:sy,w,h}=cells[i];
      if(tag.background){pen.fillStyle=tag.background;pen.fillRect(sx,sy,w,h);}
      pen.save();pen.translate(sx+w/2,sy+h/2);
      pen.font='bold '+Math.round(h*.86)+'px "Yu Gothic","Microsoft YaHei","Noto Sans CJK JP",sans-serif';
      pen.fillStyle=tag.foreground;pen.textAlign='center';pen.textBaseline='middle';
      const advance=pen.measureText(tag.text).width;
      pen.scale(Math.min(1.25,w*.93/Math.max(1,advance)),1);
      pen.fillText(tag.text,0,h*.025);pen.restore();
      const [x,y,z]=tag.center,hw=tag.width/2,hh=tag.height/2;
      const a=[x-hw,y-hh,z],b=[x+hw,y-hh,z],c=[x+hw,y+hh,z],d=[x-hw,y+hh,z];
      const l=(sx+.5)/canvas.width,r=(sx+w-.5)/canvas.width,t=(sy+.5)/canvas.height,bt=(sy+h-.5)/canvas.height;
      current=tag.group;
      triangle(a,b,c,[1,1,1],[l,bt],[r,bt],[r,t]);
      triangle(a,c,d,[1,1,1],[l,bt],[r,t],[l,t]);
    });
    atlas=canvas;
    for(const b of groups.values())b.data=b.data.slice(0,b.used);
    return atlas;
  }
  return {group,box,face,rod,ball,line,sign,finish,groups,get minimumY(){return minimumY;}};
}
function districtCross(a,b){return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];}
function districtUnit(a){const l=Math.hypot(...a)||1;return a.map(v=>v/l);}

function createDistrictRenderer(canvas,geometry){
  const gl=canvas.getContext('webgl2',{alpha:false,antialias:false,depth:true,preserveDrawingBuffer:false,powerPreference:'high-performance'});
  if(!gl)throw Error('WebGL 2 unavailable');
  const atlasImage=geometry.finish(),batches=[...geometry.groups.values()].filter(b=>b.used);
  const floorY=geometry.minimumY-.036;
  const floorGeometry=createDistrictGeometry();
  floorGeometry.face([[-170,floorY,-170],[-170,floorY,170],[170,floorY,170],[170,floorY,-170]],'#efedde');
  const floor=[...floorGeometry.groups.values()][0];
  let resources,lastState=null,hitBytes=new Uint8Array(4);
  const vertex=`#version 300 es
  precision highp float;
  layout(location=0)in vec3 pos;layout(location=1)in vec3 norm;
  layout(location=2)in vec3 paint;layout(location=3)in vec2 st;
  uniform mat4 view,solar;uniform int movement;
  uniform float angle,cloth,clothAmplitude,clothTop,clothHeight;
  out vec3 normal,color,world,sun;out vec2 uv;
  void main(){
    vec3 p=pos,n=norm;
    if(movement==1){
      float c=cos(angle),s=sin(angle);mat2 turn=mat2(c,s,-s,c);
      p.xy=vec2(.45,1.98)+turn*(p.xy-vec2(.45,1.98));n.xy=turn*n.xy;
    }
    if(movement==2&&cloth>0.){
      float span=max(.1,clothHeight-.032);
      float free=clamp((clothTop-.032-p.y)/span,0.,1.);
      float wave=sin(4.8*cloth-p.x*2.7+p.y*.70);
      float gust=clamp(clothAmplitude,0.,1.);
      float bend=max(.0001,gust*.43+gust*gust*(1.07+.10*wave));
      float turn=bend*free,cs=cos(turn),sn=sin(turn);
      float bow=span*(1.-cs)/bend;
      p.y+=span*(free-sn/bend);
      p.z+=bow*(.72+.10*wave);
      p.x+=bow*(.19+.08*wave);
      n.yz=mat2(cs,-sn,sn,cs)*n.yz;
      n.x+=gust*free*.21*cos(4.8*cloth-p.x*2.7+p.y*.70);
    }
    world=p;normal=n;color=paint;uv=st;
    sun=(solar*vec4(p,1.)).xyz*.5+.5;gl_Position=view*vec4(p,1.);
  }`;
  const fragment=`#version 300 es
  precision highp float;precision highp int;
  in vec3 normal,color,world,sun;in vec2 uv;
  uniform sampler2D atlas;uniform highp sampler2D shadows;
  uniform vec3 eye,light;uniform float lamp;uniform int id,movement,stage,hover;
  out vec4 outColor;
  float sunlight(vec3 n){
    if(any(lessThan(sun,vec3(0.)))||any(greaterThan(sun,vec3(1.))))return 1.;
    vec2 stepSize=1.15/vec2(textureSize(shadows,0));
    float depth=sun.z-.00025-.00065*(1.-abs(dot(n,light))),v=0.;
    for(int j=-1;j<=1;j++)for(int i=-1;i<=1;i++)
      v+=step(depth,texture(shadows,sun.xy+vec2(i,j)*stepSize).r);
    return v/9.;
  }
  void main(){
    vec3 n=normalize(normal);if(dot(n,eye)<0.)n=-n;
    float sunlit=sunlight(n);
    if(stage==1){
      vec2 edge=abs(world.xz)-vec2(7.96);
      float outside=length(max(edge,vec2(0.)))+min(max(edge.x,edge.y),0.);
      float near=exp(-max(0.,outside)*2.35);
      vec2 shift=(world.xz-vec2(.7,-.65))/vec2(10.,10.1);
      float pool=exp(-dot(shift,shift)*.83),halo=exp(-dot(world.xz,world.xz)/790.);
      vec3 paper=mix(vec3(.929,.925,.885),vec3(.981,.968,.918),halo);
      outColor=vec4(paper*(1.-.125*near-.058*pool)*(1.-.092*(1.-sunlit)),0.);return;
    }
    vec3 pigment=color;
    if(uv.x>=0.){vec4 print=texture(atlas,uv);if(print.a<.40)discard;pigment*=print.rgb;}
    float incidence=dot(n,light);
    float ramp=.23*smoothstep(-.13,.0,incidence)+.47*smoothstep(.14,.25,incidence)+.30*smoothstep(.56,.68,incidence);
    vec3 sky=mix(vec3(.63,.694,.725),vec3(.83,.873,.857),.5+.5*n.y);
    vec3 lit=pigment*(sky+sunlit*ramp*vec3(.322,.267,.180));
    lit+=sunlit*smoothstep(.44,.70,incidence)*vec3(.012,.010,.004);
    if(movement==3){
      float phase=world.y>2.2?smoothstep(.35,.91,lamp):smoothstep(.02,.50,lamp);
      float glow=.51+.16*clamp(pigment.g,0.,1.);
      lit=mix(lit,vec3(1.,.775,.425),phase*glow);
    }
    if(id==hover&&hover>0)lit=mix(lit,vec3(1.,.92,.69),.105);
    outColor=vec4(clamp(lit,0.,1.),float(id)/255.);
  }`;
  const shadowFragment=`#version 300 es
  precision highp float;in vec2 uv;uniform sampler2D atlas;out vec4 outColor;
  void main(){if(uv.x>=0.&&texture(atlas,uv).a<.40)discard;outColor=vec4(1.);}`;
  const screenVS=`#version 300 es
  out vec2 st;void main(){
    vec2 p=vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2));
    st=p;gl_Position=vec4(2.*p-1.,0.,1.);
  }`;
  const screenFS=`#version 300 es
  precision highp float;in vec2 st;uniform sampler2D image;
  uniform highp sampler2D depthMap;uniform vec2 stroke;out vec4 outColor;
  void main(){
    vec3 c=texture(image,st).rgb;float z=texture(depthMap,st).r;
    vec2 h=vec2(stroke.x,0.),v=vec2(0.,stroke.y);
    float edge=max(max(texture(depthMap,st+h).r,texture(depthMap,st-h).r),
                   max(texture(depthMap,st+v).r,texture(depthMap,st-v).r))-z;
    float ink=smoothstep(.0017,.009,edge);
    float contact=0.;
    for(int i=0;i<4;i++){
      float a=1.5707963*float(i)+.61;
      float gap=z-texture(depthMap,st+2.8*stroke*vec2(cos(a),sin(a))).r;
      contact+=smoothstep(.0012,.005,gap)*(1.-smoothstep(.018,.067,gap));
    }
    outColor=vec4(c*(1.-.019*contact)*mix(vec3(1.),vec3(.69,.73,.70),ink*.81),1.);
  }`;
  const direction=districtUnit([-.66,1.55,.83]);
  const right=districtUnit(districtCross([0,1,0],direction)),up=districtCross(direction,right);
  const solar=new Float32Array(16);
  for(let j=0;j<3;j++){solar[4*j]=right[j]/13.;solar[4*j+1]=up[j]/13.;solar[4*j+2]=-direction[j]/24.;}
  solar[12]=-right[1]*1.15/13;solar[13]=-up[1]*1.15/13;solar[14]=direction[1]*1.15/24;solar[15]=1;
  function initialize(){
    const deletes=[],buffers=new Map(),blank=gl.createVertexArray();
    deletes.push(()=>gl.deleteVertexArray(blank));
    function makeProgram(vs,fs,names){
      const pr=gl.createProgram();
      for(const [kind,source] of [[gl.VERTEX_SHADER,vs],[gl.FRAGMENT_SHADER,fs]]){
        const sh=gl.createShader(kind);gl.shaderSource(sh,source);gl.compileShader(sh);
        if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(sh));
        gl.attachShader(pr,sh);gl.deleteShader(sh);
      }
      gl.linkProgram(pr);if(!gl.getProgramParameter(pr,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(pr));
      deletes.push(()=>gl.deleteProgram(pr));
      const loc={pr};for(const name of names.split(' '))loc[name]=gl.getUniformLocation(pr,name);
      return loc;
    }
    const motionUniforms='view solar movement angle cloth clothAmplitude clothTop clothHeight atlas';
    const scene=makeProgram(vertex,fragment,motionUniforms+' shadows eye light lamp id stage hover');
    const shadow=makeProgram(vertex,shadowFragment,motionUniforms);
    const screen=makeProgram(screenVS,screenFS,'image depthMap stroke');
    function texture(){
      const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
      deletes.push(()=>gl.deleteTexture(t));return t;
    }
    function target(){const f=gl.createFramebuffer();deletes.push(()=>gl.deleteFramebuffer(f));return f;}
    const atlas=texture();
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,atlasImage);
    gl.generateMipmap(gl.TEXTURE_2D);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    const anisotropy=gl.getExtension('EXT_texture_filter_anisotropic');
    if(anisotropy)gl.texParameterf(gl.TEXTURE_2D,anisotropy.TEXTURE_MAX_ANISOTROPY_EXT,
      Math.min(4,gl.getParameter(anisotropy.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
    const sunTarget=target(),sunDepth=texture(),fb=target(),paint=texture(),depth=texture();
    const drizzle=typeof createDistrictDrizzle==='function'?createDistrictDrizzle(gl,batches):null;
    if(drizzle?.dispose)deletes.push(()=>drizzle.dispose());
    const maxEdge=Math.min(4096,gl.getParameter(gl.MAX_TEXTURE_SIZE),...gl.getParameter(gl.MAX_VIEWPORT_DIMS));
    const shadowSize=Math.min(maxEdge,window.matchMedia('(pointer:coarse)').matches?1536:2048);
    gl.bindTexture(gl.TEXTURE_2D,sunDepth);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.DEPTH_COMPONENT24,shadowSize,shadowSize,0,gl.DEPTH_COMPONENT,gl.UNSIGNED_INT,null);
    gl.bindFramebuffer(gl.FRAMEBUFFER,sunTarget);
    gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.TEXTURE_2D,sunDepth,0);
    gl.drawBuffers([gl.NONE]);gl.readBuffer(gl.NONE);
    function check(){if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw Error('Incomplete WebGL drawing target');}
    check();
    let w=0,h=0,shadowDetail='',shadowAngle=0,shadowCloth=0,shadowTime=-Infinity;
    function bind(unit,t){gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,t);}
    function resize(state,rect){
      const q=Math.min(state.quality||1,maxEdge/Math.max(rect.width,rect.height,1));
      const width=Math.max(1,Math.round(rect.width*q)),height=Math.max(1,Math.round(rect.height*q));
      if(w===width&&h===height)return;
      canvas.width=w=width;canvas.height=h=height;
      gl.bindFramebuffer(gl.FRAMEBUFFER,fb);
      bind(0,paint);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA8,w,h,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
      gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,paint,0);
      bind(0,depth);gl.texImage2D(gl.TEXTURE_2D,0,gl.DEPTH_COMPONENT24,w,h,0,gl.DEPTH_COMPONENT,gl.UNSIGNED_INT,null);
      gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.TEXTURE_2D,depth,0);check();
    }
    function drawBatch(g,loc){
      if(!buffers.has(g)){
        const vao=gl.createVertexArray(),buf=gl.createBuffer();
        gl.bindVertexArray(vao);gl.bindBuffer(gl.ARRAY_BUFFER,buf);
        gl.bufferData(gl.ARRAY_BUFFER,g.data.subarray(0,g.used),gl.STATIC_DRAW);
        for(const [attrib,size,offset] of [[0,3,0],[1,3,12],[2,3,24],[3,2,36]]){
          gl.enableVertexAttribArray(attrib);gl.vertexAttribPointer(attrib,size,gl.FLOAT,false,44,offset);
        }
        buffers.set(g,vao);deletes.push(()=>{gl.deleteVertexArray(vao);gl.deleteBuffer(buf);});
      }
      gl.bindVertexArray(buffers.get(g));
      gl.uniform1i(loc.movement,{wheel:1,cloth:2,lamp:3}[g.motion]||0);
      if(g.motion==='cloth'){
        gl.uniform1f(loc.clothTop,g.hi[1]);gl.uniform1f(loc.clothHeight,g.hi[1]-g.lo[1]);
      }
      if(loc.id)gl.uniform1i(loc.id,g.id);
      gl.drawArrays(gl.TRIANGLES,0,g.used/11);
    }
    function shared(loc,view,state){
      gl.useProgram(loc.pr);gl.uniformMatrix4fv(loc.view,false,view);
      gl.uniformMatrix4fv(loc.solar,false,solar);
      gl.uniform1f(loc.angle,state.wheelAngle||0);gl.uniform1f(loc.cloth,state.clothTime||0);
      gl.uniform1f(loc.clothAmplitude,state.clothAmplitude??1);
      bind(0,atlas);gl.uniform1i(loc.atlas,0);
    }
    function visibleDetail(g,state,pixels){
      if(!g.nearOnly||!state.mobile&&!state.economy)return true;
      const owner=g.id>10?g.id-10:g.id;
      if(owner&&state.focus===owner)return true;
      if(pixels<(state.economy?55:37))return false;
      const m=state.matrix,b=g.lo,t=g.hi;
      // Project the box, including its screen radius, so a neighbour's distant
      // detail batch never needs an upload while looking closely at the shop.
      for(let i=0;i<2;i++){
        const x=m[i],y=m[4+i],z=m[8+i];
        const center=(x*(b[0]+t[0])+y*(b[1]+t[1])+z*(b[2]+t[2]))*.5+m[12+i];
        const radius=(Math.abs(x)*(t[0]-b[0])+Math.abs(y)*(t[1]-b[1])+Math.abs(z)*(t[2]-b[2]))*.5;
        if(Math.abs(center)-radius>1.07)return false;
      }
      return true;
    }
    function draw(state){
      const rect=canvas.getBoundingClientRect();resize(state,rect);
      const m=state.matrix,pixels=Math.hypot(m[0],m[4],m[8])*rect.width*.5;
      const visible=batches.filter(g=>visibleDetail(g,state,pixels));
      const lod=visible.map(g=>g.id+'/'+g.nearOnly+'/'+g.motion).join(',');
      const angle=state.wheelAngle||0,cloth=state.clothTime||0,now=performance.now();
      const changed=angle!==shadowAngle||cloth!==shadowCloth;
      gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LESS);gl.disable(gl.BLEND);gl.disable(gl.DITHER);
      if(lod!==shadowDetail||(changed&&(now-shadowTime>(state.economy?340:state.mobile?180:110)||cloth===0&&shadowCloth>0))){
        shadowDetail=lod;shadowAngle=angle;shadowCloth=cloth;shadowTime=now;
        gl.bindFramebuffer(gl.FRAMEBUFFER,sunTarget);gl.viewport(0,0,shadowSize,shadowSize);
        gl.clearDepth(1);gl.clear(gl.DEPTH_BUFFER_BIT);gl.enable(gl.POLYGON_OFFSET_FILL);gl.polygonOffset(1.35,2.0);
        shared(shadow,solar,state);for(const b of visible)drawBatch(b,shadow);
        gl.disable(gl.POLYGON_OFFSET_FILL);
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER,fb);gl.viewport(0,0,w,h);
      gl.clearColor(.948,.941,.898,0);gl.clearDepth(1);gl.clear(gl.DEPTH_BUFFER_BIT|gl.COLOR_BUFFER_BIT);
      shared(scene,m,state);bind(1,sunDepth);gl.uniform1i(scene.shadows,1);
      gl.uniform3fv(scene.eye,state.eye||[.2,.5,.8]);gl.uniform3fv(scene.light,direction);
      gl.uniform1f(scene.lamp,state.lamp||0);gl.uniform1i(scene.hover,state.hover||0);
      if(!state.eye||state.eye[1]>.025){gl.uniform1i(scene.stage,1);drawBatch(floor,scene);}
      gl.uniform1i(scene.stage,0);for(const b of visible)drawBatch(b,scene);
      gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.disable(gl.DEPTH_TEST);gl.useProgram(screen.pr);
      bind(0,paint);bind(1,depth);gl.uniform1i(screen.image,0);gl.uniform1i(screen.depthMap,1);
      const radius=Math.max(.85,.68*w/Math.max(1,rect.width));
      gl.uniform2f(screen.stroke,radius/w,radius/h);
      gl.bindVertexArray(blank);gl.drawArrays(gl.TRIANGLES,0,3);gl.bindVertexArray(null);
      if(drizzle&&state.rainAmount>0)drizzle.draw({...state,depth,width:w,height:h});
    }
    function pick(x,y,touch,focus){
      const rect=canvas.getBoundingClientRect();
      if(!w||!rect.width||!rect.height)return 0;
      const cx=Math.floor((x-rect.left)*w/rect.width),cy=h-1-Math.floor((y-rect.top)*h/rect.height);
      if(cx<0||cy<0||cx>=w||cy>=h)return 0;
      const r=(touch===true||touch==='touch')?Math.ceil(8*w/rect.width):0;
      const l=Math.max(0,cx-r),bottom=Math.max(0,cy-r);
      const pw=Math.min(w,cx+r+1)-l,ph=Math.min(h,cy+r+1)-bottom;
      if(hitBytes.length<pw*ph*4)hitBytes=new Uint8Array(pw*ph*4);
      gl.bindFramebuffer(gl.READ_FRAMEBUFFER,fb);gl.readPixels(l,bottom,pw,ph,gl.RGBA,gl.UNSIGNED_BYTE,hitBytes);
      gl.bindFramebuffer(gl.READ_FRAMEBUFFER,null);
      const direct=hitBytes[4*((cy-bottom)*pw+cx-l)+3];
      if(!r||direct>10||direct!==0&&direct!==focus)return direct;
      let result=direct,nearest=r*r;
      for(let j=0;j<ph;j++)for(let i=0;i<pw;i++){
        const id=hitBytes[4*(j*pw+i)+3];
        if(!id||(direct>0&&id!==focus+10))continue;
        const d=(l+i-cx)**2+(bottom+j-cy)**2;
        if(d<nearest){nearest=d;result=id;}
      }
      return result;
    }
    return {draw,pick,dispose(){for(const fn of deletes)fn();}};
  }
  resources=initialize();
  function paint(state){lastState=state;if(!gl.isContextLost())resources.draw(state);}
  function onLoss(e){e.preventDefault();}
  function onRestore(){resources=initialize();if(lastState)paint(lastState);}
  canvas.addEventListener('webglcontextlost',onLoss);
  canvas.addEventListener('webglcontextrestored',onRestore);
  return {draw:paint,pick(x,y,touch){return gl.isContextLost()?0:resources.pick(x,y,touch,lastState?.focus||0);},
    dispose(){canvas.removeEventListener('webglcontextlost',onLoss);canvas.removeEventListener('webglcontextrestored',onRestore);resources.dispose();}};
}
