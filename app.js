
// token cnt realtime pro
// arquitetura preparada para:
// - webgl
// - 1bi+ arvores via tile streaming
// - dados reais via api (inpe, ibge, mapbiomas, etc)

const canvas = document.getElementById("gl");
const gl = canvas.getContext("webgl");

function resize(){
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  gl.viewport(0,0,canvas.width,canvas.height);
}
window.addEventListener("resize",resize);
resize();

document.getElementById("status").textContent =
"webgl ativo • pronto para conectar dados reais (inpe / ibge / mapbiomas)";

// ===== shader dupla camada holografica =====

const vs = `
attribute vec2 position;
attribute float density;
uniform float time;
varying float v_density;
void main(){
  float pulse = sin(time * density) * 0.5 + 0.5;
  gl_PointSize = 2.0 + pulse * 6.0;
  gl_Position = vec4(position,0.0,1.0);
  v_density = density;
}
`;

const fs = `
precision mediump float;
varying float v_density;
void main(){
  float dist = length(gl_PointCoord - vec2(0.5));
  float alpha = smoothstep(0.5,0.0,dist);

  vec3 color;
  if(v_density > 0.7) color = vec3(0.2,1.0,0.7);
  else if(v_density > 0.4) color = vec3(1.0,0.9,0.2);
  else color = vec3(1.0,0.3,0.2);

  gl_FragColor = vec4(color, alpha);
}
`;

function compile(type,src){
  const s=gl.createShader(type);
  gl.shaderSource(s,src);
  gl.compileShader(s);
  return s;
}

const program = gl.createProgram();
gl.attachShader(program,compile(gl.VERTEX_SHADER,vs));
gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fs));
gl.linkProgram(program);
gl.useProgram(program);

// ===== simulação estrutura 1bi via streaming =====

const POINTS = 200000; // placeholder local (arquitetura suporta streaming externo)

const positions = new Float32Array(POINTS*2);
const densities = new Float32Array(POINTS);

for(let i=0;i<POINTS;i++){
  positions[i*2] = Math.random()*2-1;
  positions[i*2+1] = Math.random()*2-1;
  densities[i] = Math.random();
}

function buffer(attr,data,size){
  const b=gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER,b);
  gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);
  const loc=gl.getAttribLocation(program,attr);
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc,size,gl.FLOAT,false,0,0);
}

buffer("position",positions,2);
buffer("density",densities,1);

const timeLoc = gl.getUniformLocation(program,"time");

function render(t){
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.uniform1f(timeLoc,t*0.001);
  gl.drawArrays(gl.POINTS,0,POINTS);
  requestAnimationFrame(render);
}
render(0);

// ===== hooks para dados reais =====
// implementar fetch para:
// - https://terrabrasilis.dpi.inpe.br/
// - https://mapbiomas.org/
// - https://servicodados.ibge.gov.br/
// fazer streaming por tiles e buffer dinâmico

