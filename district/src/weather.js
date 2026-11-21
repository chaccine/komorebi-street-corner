// Project the actual roof panels, foliage, awnings and pavement along the fall
// vector once. A drop stops at its first receiving surface, from any viewpoint.
function buildDistrictRainShelter(batches,leanX,leanZ){
  const cells=97,scale=(cells-1)/16,heights=new Float32Array(cells*cells);
  heights.fill(-.145);
  for(const batch of batches){
    if(batch.motion==='wheel'||batch.motion==='cloth')continue;
    const v=batch.data;
    for(let i=0;i<batch.used;i+=33){
      const ay=v[i+1],by=v[i+12],cy=v[i+23];
      if(Math.max(ay,by,cy)<-.14)continue;
      const ax=(v[i]+ay*leanX+8)*scale,az=(v[i+2]+ay*leanZ+8)*scale;
      const bx=(v[i+11]+by*leanX+8)*scale-ax,bz=(v[i+13]+by*leanZ+8)*scale-az;
      const cx=(v[i+22]+cy*leanX+8)*scale-ax,cz=(v[i+24]+cy*leanZ+8)*scale-az;
      const area=bx*cz-bz*cx;
      if(Math.abs(area)<.0001)continue;
      const x0=Math.max(0,Math.ceil(ax+Math.min(0,bx,cx))),x1=Math.min(cells-1,Math.floor(ax+Math.max(0,bx,cx)));
      const z0=Math.max(0,Math.ceil(az+Math.min(0,bz,cz))),z1=Math.min(cells-1,Math.floor(az+Math.max(0,bz,cz)));
      for(let z=z0;z<=z1;z++)for(let x=x0;x<=x1;x++){
        const u=((x-ax)*cz-(z-az)*cx)/area,w=(bx*(z-az)-bz*(x-ax))/area;
        if(u<0||w<0||u+w>1)continue;
        const key=z*cells+x,y=ay+u*(by-ay)+w*(cy-ay);
        if(y>heights[key])heights[key]=y;
      }
    }
  }
  return (x,z)=>{
    const col=Math.max(0,Math.min(cells-2,Math.floor((x+8)*scale)));
    const row=Math.max(0,Math.min(cells-2,Math.floor((z+8)*scale))),i=row*cells+col;
    return Math.max(heights[i],heights[i+1],heights[i+cells],heights[i+cells+1]);
  };
}

function createDistrictDrizzle(gl,batches=[]){
  const leanX=.070,leanZ=-.023;
  const shelter=buildDistrictRainShelter(batches,leanX,leanZ);
  const vertex=`#version 300 es
  precision highp float;
  layout(location=0) in vec3 tip;
  layout(location=1) in vec3 brush;
  uniform mat4 matrix;
  uniform vec2 viewport;
  out vec2 uv;
  out float opacity;
  void main(){
    float side=float(2*(gl_VertexID&1)-1),along=float(gl_VertexID>>1);
    vec4 a=matrix*vec4(tip,1.);
    vec4 b=matrix*vec4(tip+brush.x*vec3(-.070,1.,.023),1.);
    vec2 tangent=(b.xy-a.xy)*.5*viewport;
    float size=length(tangent);
    vec2 normal=size>.001?vec2(tangent.y,-tangent.x)/size:vec2(1.,0.);
    float ppu=length(vec3(matrix[0].x,matrix[1].x,matrix[2].x))*viewport.x*.5;
    float radius=clamp(brush.y*ppu,.8,3.4);
    gl_Position=mix(a,b,along);
    gl_Position.xy+=normal*radius*side*2./viewport;
    uv=vec2(side,along);opacity=brush.z;
  }`;
  const fragment=`#version 300 es
  precision highp float;
  in vec2 uv;
  in float opacity;
  uniform highp sampler2D sceneDepth;
  out vec4 color;
  void main(){
    if(gl_FragCoord.z>texelFetch(sceneDepth,ivec2(gl_FragCoord.xy),0).r+.000025)discard;
    float tail=uv.y;
    float width=mix(.78,.36,tail);
    float soft=(1.-smoothstep(width*.16,width+.16,abs(uv.x)))*smoothstep(0.,.13,tail)*(1.-smoothstep(.60,1.,tail));
    vec3 ink=mix(vec3(.53,.68,.65),vec3(.93,.97,.82),(.28+.58*(1.-tail))*(1.-.24*abs(uv.x)));
    color=vec4(ink,opacity*soft);
  }`;
  function compile(type,source){
    const s=gl.createShader(type);
    gl.shaderSource(s,source);gl.compileShader(s);
    if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){
      const error=gl.getShaderInfoLog(s);gl.deleteShader(s);throw Error(error);
    }
    return s;
  }
  const program=gl.createProgram(),vs=compile(gl.VERTEX_SHADER,vertex),fs=compile(gl.FRAGMENT_SHADER,fragment);
  gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);
  gl.deleteShader(vs);gl.deleteShader(fs);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS)){const msg=gl.getProgramInfoLog(program);gl.deleteProgram(program);throw Error(msg);}
  const uniforms={};
  for(const name of ['matrix','viewport','sceneDepth'])uniforms[name]=gl.getUniformLocation(program,name);
  const count=164,data=new Float32Array(count*6),vao=gl.createVertexArray(),buffer=gl.createBuffer();
  const oldVao=gl.getParameter(gl.VERTEX_ARRAY_BINDING),oldBuffer=gl.getParameter(gl.ARRAY_BUFFER_BINDING);
  gl.bindVertexArray(vao);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  gl.bufferData(gl.ARRAY_BUFFER,data.byteLength,gl.DYNAMIC_DRAW);
  for(let i=0;i<2;i++){
    gl.enableVertexAttribArray(i);gl.vertexAttribPointer(i,3,gl.FLOAT,false,24,i*12);gl.vertexAttribDivisor(i,1);
  }
  gl.bindVertexArray(oldVao);gl.bindBuffer(gl.ARRAY_BUFFER,oldBuffer);
  function noise(n){
    n=Math.imul(n^(n>>>16),0x7feb352d);n=Math.imul(n^(n>>>15),0x846ca68b);
    return ((n^(n>>>16))>>>0)/4294967296;
  }
  const tracks=Array.from({length:count},(_,i)=>({
    period:1.70+noise(173+i)*1.01,offset:noise(1321+i)*2.78,speed:6.3+noise(271+i)*2.0,
    length:.21+noise(731+i)*.24,width:.013+.007*noise(539+i),opacity:.54+.28*noise(97+i),cycle:-1
  }));
  function draw({matrix,depth,width,height,rainTime,rainAmount,mobile,economy}){
    if(!rainAmount||!depth||!Number.isFinite(rainTime))return;
    const limit=economy?69:mobile?106:count,amount=Math.min(1,Math.max(0,rainAmount));
    let n=0;
    for(let i=0;i<limit;i++){
      const t=tracks[i],time=rainTime+t.offset,cycle=Math.floor(time/t.period);
      if(t.cycle!==cycle){
        t.cycle=cycle;
        const key=Math.imul(cycle+11,10607)+i*383;
        t.x=-7.51+noise(key)*15.03;t.z=-7.73+noise(key+4)*15.32;
        t.top=5.80+noise(key+19)*2.04;t.floor=shelter(t.x,t.z);
        t.gate=noise(key+9);
      }
      if(t.gate>amount)continue;
      const y=t.top-t.speed*(time-cycle*t.period);
      if(y<=t.floor)continue;
      const x=t.x-y*leanX,z=t.z-y*leanZ;
      // At street level the handheld camera pays only for the local shower.
      const sx=matrix[0]*x+matrix[4]*y+matrix[8]*z+matrix[12];
      const sy=matrix[1]*x+matrix[5]*y+matrix[9]*z+matrix[13];
      if(Math.abs(sx)>1.08||Math.abs(sy)>1.15)continue;
      let j=n++*6;
      data[j++]=x;data[j++]=y;data[j++]=z;
      data[j++]=t.length;data[j++]=t.width;
      data[j]=amount*t.opacity*Math.min(1,(t.top-y)/.29);
    }
    if(!n)return;
    // The renderer enters from its opaque image pass with blending disabled.
    const previousProgram=gl.getParameter(gl.CURRENT_PROGRAM),previousVao=gl.getParameter(gl.VERTEX_ARRAY_BINDING);
    const previousBuffer=gl.getParameter(gl.ARRAY_BUFFER_BINDING),previousUnit=gl.getParameter(gl.ACTIVE_TEXTURE);
    gl.activeTexture(gl.TEXTURE1);const previousTexture=gl.getParameter(gl.TEXTURE_BINDING_2D);
    gl.bindTexture(gl.TEXTURE_2D,depth);gl.useProgram(program);
    gl.uniformMatrix4fv(uniforms.matrix,false,matrix);gl.uniform2f(uniforms.viewport,width,height);gl.uniform1i(uniforms.sceneDepth,1);
    gl.bindVertexArray(vao);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
    gl.bufferSubData(gl.ARRAY_BUFFER,0,data,0,n*6);
    gl.enable(gl.BLEND);gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ZERO,gl.ONE);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP,0,4,n);
    gl.disable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ZERO);
    gl.bindVertexArray(previousVao);gl.bindBuffer(gl.ARRAY_BUFFER,previousBuffer);gl.useProgram(previousProgram);
    gl.bindTexture(gl.TEXTURE_2D,previousTexture);gl.activeTexture(previousUnit);
  }
  function dispose(){gl.deleteVertexArray(vao);gl.deleteBuffer(buffer);gl.deleteProgram(program);}
  return {draw,dispose};
}
