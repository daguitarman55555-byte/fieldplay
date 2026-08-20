const vertex = `#version 300 es
in vec2 position;
out vec2 uv;
void main(){uv=position*.5+.5;gl_Position=vec4(position,0.,1.);}`;

const fragment = `#version 300 es
precision highp float;
in vec2 uv;
out vec4 outColor;
uniform vec2 resolution;
uniform float time;
uniform float motion;
uniform float bloom;
uniform float audioEnergy;
uniform int steps;

float hash21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash21(i),hash21(i+vec2(1,0)),f.x),mix(hash21(i+vec2(0,1)),hash21(i+1.),f.x),f.y);}
vec3 palette(float t){
  vec3 cyan=vec3(.08,.55,1.45), violet=vec3(.45,.12,1.05), gold=vec3(1.2,.42,.07);
  return mix(mix(cyan,violet,smoothstep(.15,.72,t)),gold,smoothstep(.79,1.,t));
}
void main(){
  vec2 p=(gl_FragCoord.xy-.5*resolution)/resolution.y;
  vec2 center=vec2(.27,.01);
  vec2 q=p-center;
  float r=length(q)+.012;
  float a=atan(q.y,q.x);
  float t=time*motion;
  vec3 col=vec3(.0015,.003,.012);

  float stars=pow(hash21(floor(gl_FragCoord.xy*.55)),42.);
  stars*=.32+.68*hash21(floor(gl_FragCoord.xy*.17));
  col+=stars*vec3(.55,.72,1.0)*smoothstep(.14,.5,r);

  float haze=noise(p*3.2+vec2(t*.01,0.));
  haze*=noise(p*7.-vec2(0,t*.015));
  col+=vec3(.015,.035,.11)*haze*smoothstep(.9,.05,abs(p.y+.22+p.x*.12));

  int count=max(1,steps);
  for(int i=0;i<82;i++){
    if(i>=count) break;
    float fi=float(i);
    float seed=fi/float(count);
    float phase=seed*6.28318;
    float band=.045+seed*.72;
    float polarity=mod(fi,2.)*2.-1.;
    float warp=a + polarity*(1.35/r) + t*(.035+seed*.02);
    float line=abs(sin(warp*2.2+phase*5.3+sin(r*15.-t*.12)*.32));
    line=smoothstep(.038,.0,line)*exp(-r*1.18);
    float shell=exp(-pow((r-band)/(.035+seed*.018),2.));
    float tail=smoothstep(-.95,.85,cos(a-phase*.32));
    float energy=line*shell*(.38+.62*tail);
    col+=palette(fract(seed+.12*sin(phase)))*energy*(.032+audioEnergy*.018);
  }

  float core=exp(-r*30.);
  float halo=exp(-r*7.5)/(1.+r*9.);
  col+=vec3(.18,.28,.72)*halo*(.5+bloom*1.2);
  col+=vec3(.72,.82,1.4)*core*(1.8+bloom*2.2+audioEnergy*.6);
  col*=1.-.28*smoothstep(.52,1.05,length(p));
  col=1.-exp(-col*(1.05+bloom*.55));
  col=pow(max(col,0.),vec3(1./2.2));
  outColor=vec4(col,1.);
}`;

export function createCosmicRenderer(canvas) {
  const gl = canvas.getContext('webgl2', { alpha: false, antialias: false, powerPreference: 'high-performance' });
  if (!gl) throw new Error('FieldPlay Cosmic Field requires WebGL2.');
  const program = link(gl, vertex, fragment);
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,3,-1,-1,3]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, 'position');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  const uniforms = Object.fromEntries(['resolution','time','motion','bloom','audioEnergy','steps'].map(name => [name, gl.getUniformLocation(program,name)]));

  function resize(scale) {
    const width = Math.max(1, Math.round(innerWidth * devicePixelRatio * scale));
    const height = Math.max(1, Math.round(innerHeight * devicePixelRatio * scale));
    if (canvas.width !== width || canvas.height !== height) { canvas.width=width; canvas.height=height; }
  }
  function render(state) {
    resize(state.scale);
    gl.viewport(0,0,canvas.width,canvas.height);
    gl.useProgram(program); gl.bindVertexArray(vao);
    gl.uniform2f(uniforms.resolution,canvas.width,canvas.height);
    gl.uniform1f(uniforms.time,state.time);
    gl.uniform1f(uniforms.motion,state.motion);
    gl.uniform1f(uniforms.bloom,state.bloom);
    gl.uniform1f(uniforms.audioEnergy,state.audioEnergy);
    gl.uniform1i(uniforms.steps,state.steps);
    gl.drawArrays(gl.TRIANGLES,0,3);
  }
  function dispose(){gl.deleteBuffer(buffer);gl.deleteVertexArray(vao);gl.deleteProgram(program);}
  return { gl, render, dispose };
}

function link(gl, vsSource, fsSource){
  const shaders=[compile(gl,gl.VERTEX_SHADER,vsSource),compile(gl,gl.FRAGMENT_SHADER,fsSource)];
  const program=gl.createProgram(); shaders.forEach(s=>gl.attachShader(program,s)); gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
  shaders.forEach(s=>gl.deleteShader(s)); return program;
}
function compile(gl,type,source){const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(shader));return shader;}
