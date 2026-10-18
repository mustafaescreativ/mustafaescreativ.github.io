/* First-party original WebGL sculpture. No third-party Spline scene or remote model. */
(() => {
'use strict';
const canvas=document.getElementById('signature-canvas'),card=document.getElementById('scene-card');
if(!canvas||!card||matchMedia('(prefers-reduced-motion: reduce)').matches) return;
let gl;try{gl=canvas.getContext('webgl',{alpha:true,antialias:true,depth:true,powerPreference:'low-power'})}catch(_e){}if(!gl)return;
const vsrc=`
attribute vec3 a_pos;attribute vec3 a_norm;
uniform float u_rx;uniform float u_ry;uniform float u_rz;uniform float u_aspect;uniform float u_size;uniform float u_shift;
varying vec3 v_normal;varying float v_z;
mat3 rotX(float a){float c=cos(a),s=sin(a);return mat3(1.,0.,0., 0.,c,s, 0.,-s,c);}
mat3 rotY(float a){float c=cos(a),s=sin(a);return mat3(c,0.,-s, 0.,1.,0., s,0.,c);}
mat3 rotZ(float a){float c=cos(a),s=sin(a);return mat3(c,s,0., -s,c,0., 0.,0.,1.);}
void main(){mat3 r=rotZ(u_rz)*rotY(u_ry)*rotX(u_rx);vec3 p=r*a_pos*u_size;v_normal=normalize(r*a_norm);v_z=p.z;
float scale=2.8/(3.8-p.z);gl_Position=vec4(p.x*scale/u_aspect + u_shift,p.y*scale,p.z*.08,1.);}`;
const fsrc=`precision mediump float;varying vec3 v_normal;varying float v_z;uniform vec3 u_color;uniform float u_alpha;
void main(){vec3 n=normalize(v_normal);float diffuse=max(dot(n,normalize(vec3(-.45,.8,1.))),0.);float gloss=pow(max(dot(reflect(normalize(vec3(.35,-.65,-1.)),n),vec3(0.,0.,1.)),0.),18.);float edge=pow(1.-abs(n.z),2.);vec3 c=u_color*(.19+.7*diffuse+edge*.29)+vec3(.9,.82,.68)*gloss*.5;gl_FragColor=vec4(c,u_alpha);}`;
function shader(src,type){const sh=gl.createShader(type);gl.shaderSource(sh,src);gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(sh));return sh}
let program;try{program=gl.createProgram();gl.attachShader(program,shader(vsrc,gl.VERTEX_SHADER));gl.attachShader(program,shader(fsrc,gl.FRAGMENT_SHADER));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program))}catch(_e){return}
const segments=120,tubeSteps=15,positions=[],normals=[],indices=[];
for(let i=0;i<=segments;i++){const a=i/segments*Math.PI*2,ca=Math.cos(a),sa=Math.sin(a);for(let j=0;j<=tubeSteps;j++){const b=j/tubeSteps*Math.PI*2,cb=Math.cos(b),sb=Math.sin(b);const major=1.1,tube=.066;positions.push((major+tube*cb)*ca,(major+tube*cb)*sa,tube*sb);normals.push(cb*ca,cb*sa,sb)}}
for(let i=0;i<segments;i++)for(let j=0;j<tubeSteps;j++){let a=i*(tubeSteps+1)+j,b=(i+1)*(tubeSteps+1)+j;indices.push(a,b,a+1,b,b+1,a+1)}
function buffer(data,type,target){const b=gl.createBuffer();gl.bindBuffer(target,b);gl.bufferData(target,new type(data),gl.STATIC_DRAW);return b}
const pb=buffer(positions,Float32Array,gl.ARRAY_BUFFER),nb=buffer(normals,Float32Array,gl.ARRAY_BUFFER),ib=buffer(indices,Uint16Array,gl.ELEMENT_ARRAY_BUFFER);
gl.useProgram(program);function att(key,b){let l=gl.getAttribLocation(program,key);gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.enableVertexAttribArray(l);gl.vertexAttribPointer(l,3,gl.FLOAT,false,0,0)}att('a_pos',pb);att('a_norm',nb);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);
const uni=k=>gl.getUniformLocation(program,k);const rx=uni('u_rx'),ry=uni('u_ry'),rz=uni('u_rz'),aspect=uni('u_aspect'),size=uni('u_size'),shift=uni('u_shift'),col=uni('u_color'),alpha=uni('u_alpha');
gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.clearColor(0,0,0,0);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
let targetX=0,targetY=0,currentX=0,currentY=0,active=true,last=0,intersecting=true,raf=0;
card.addEventListener('pointermove',e=>{let r=card.getBoundingClientRect();targetX=((e.clientY-r.top)/r.height-.5)*.57;targetY=((e.clientX-r.left)/r.width-.5)*.72});card.addEventListener('pointerleave',()=>{targetX=0;targetY=0});
function resize(){const dpr=Math.min(devicePixelRatio||1,1.6),w=Math.max(1,Math.floor(canvas.clientWidth*dpr)),h=Math.max(1,Math.floor(canvas.clientHeight*dpr));if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h)}gl.uniform1f(aspect,w/h)}
function draw(ts){raf=0;if(!active||!intersecting||document.hidden)return;if(last&&ts-last<30){raf=requestAnimationFrame(draw);return}last=ts;resize();currentX+=(targetX-currentX)*.045;currentY+=(targetY-currentY)*.045;const t=ts*.00023;gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
const rings=[{x:.4,y:.9,z:.1,scale:1.08,color:[.85,.67,.43]},{x:1.35,y:-.3,z:.8,scale:.87,color:[.78,.79,.84]},{x:-.7,y:.36,z:-.66,scale:.69,color:[.67,.54,.35]}];
for(let i=0;i<rings.length;i++){const r=rings[i];gl.uniform1f(rx,r.x+currentX+t*(i%2?-1:1)*.27);gl.uniform1f(ry,r.y+currentY+t*.25*(i+1));gl.uniform1f(rz,r.z+t*.11*(i%2?-1:1));gl.uniform1f(size,r.scale*Math.min(1,(canvas.width/canvas.height)*.9));gl.uniform1f(shift,0);gl.uniform3fv(col,new Float32Array(r.color));gl.uniform1f(alpha,.96);gl.drawElements(gl.TRIANGLES,indices.length,gl.UNSIGNED_SHORT,0)}raf=requestAnimationFrame(draw)}
function start(){if(!raf&&active&&intersecting&&!document.hidden)raf=requestAnimationFrame(draw)}
const observer=new IntersectionObserver(entries=>{intersecting=entries[0].isIntersecting; if(intersecting)start();else if(raf){cancelAnimationFrame(raf);raf=0}},{threshold:0});observer.observe(card);
document.addEventListener('visibilitychange',start);canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();active=false;if(raf)cancelAnimationFrame(raf)});
card.classList.add('webgl-ready');start();
})();
