const _u="uniform",_a="attribute",_vv="varying vec",_vf="varying float ",_vm="void main() {",_sc=(a,t)=>`vec2 ${a}=vec2(sin(${t}),cos(${t}));`,_f="\nfloat n=3.0;vec3 xyz=floor(rgb*(n-0.001));float idx=(xyz.x*n*n+xyz.y*n+xyz.z+0.5)/(n*n*n);vec3 rgb2=texture2D(u_palette,vec2(idx,0.5)).rgb;gl_FragColor=vec4(rgb2*u_filter+(1.0-u_filter)*rgb,1);",_g=`\nprecision mediump float;${_u} sampler2D u_palette;${_u} sampler2D u_image;${_u} float u_filter;`,shaders={block:{vertex:`\n${_u} mat4 u_transform;${_a} vec3 a_position;${_a} vec2 a_texCoord;${_vv}3 qa;${_vv}2 qb;\n${_vm}\nqa=(u_transform*vec4(a_position,1)).xyz;qb=a_texCoord;gl_Position=u_transform*vec4(a_position,1);}`,fragment:`\n${_g}\n${_vv}3 qa;${_vv}2 qb;\n${_vm}\nvec3 rgb=texture2D(u_image,qb).rgb;rgb *= 1.0-0.75*min(max(0.0,qa.z),1.0);${_f}\n}`},quad:{vertex:`\n${_u} mat4 u_transform;${_a} vec2 a_position;${_a} vec2 a_texCoord;${_vv}2 qb;\n${_vm}\nqb=a_texCoord;gl_Position=u_transform*vec4(a_position,0,1);}`,fragment:`\n${_g}\n${_u} mat4 u_texTransform;${_vv}2 qb;\n${_vm}\nvec4 tc=u_texTransform*vec4(qb,0,1);vec3 rgb=texture2D(u_image,tc.xy).rgb;${_f}\n}`},particle:{vertex:`\n${_u} mat4 u_transform;${_u} vec3 u_delta;${_u} float u_age;${_u} float u_size;${_u} float u_nonce;${_a} vec3 a_position;${_a} float a_entropy;${_vf}qc;\n${_vm}\nfloat qo=fract(a_entropy+u_nonce);qc=qo;float qp=(0.5*qo+0.5)*6.0*pow(u_age,0.5);float qf=u_age*6.28*4.0*(qo-0.5);float qn=-atan(u_delta.z,u_delta.x);float qg=-atan(-length(u_delta.xz),u_delta.y);float qh=6.28*fract(qo*256.0);float qi=3.14*fract(qo*65535.0);${_sc("sc","qf")}${_sc("ab","qn")}${_sc("fg","qg")}${_sc("st","qh")}${_sc("uv","qi")}mat4 qm=mat4(\n1,0,0,0,0,fg.x,fg.y,0,0,-fg.y,fg.x,0,0,0,0,1\n);mat4 qk=mat4(\nab.x,0,ab.y,0,0,1,0,0,-ab.y,0,ab.x,0,0,0,0,1\n);mat4 ql=mat4(\nsc.x,sc.y,0,0,-sc.y,sc.x,0,0,0,0,1,0,0,0,0,1\n);float invAge=u_size/(1.0+u_age*u_age*9.0);mat4 scale=mat4(\ninvAge,0,0,0,0,invAge,0,0,0,0,invAge,0,0,0,0,1\n);vec4 abc=vec4(st.x*uv.x,st.y*uv.x,uv.y,0);vec4 pos=scale*qk*qm*ql*vec4(a_position,1)+qp*abc;pos.y-=pow(u_age*1.25,2.0);gl_Position=u_transform*pos;}`,fragment:`\n${_g}\n${_vf}qc;\n${_vm}\nvec3 rgb=vec3(fract(qc*16.0),fract(qc*256.0),fract(qc*4096.0));rgb.g *= rgb.r;rgb.b *= rgb.g;${_f}\n}`},powerup:{vertex:`\n${_u} mat4 u_transform;${_u} vec3 u_player;${_u} float u_time;${_a} vec3 a_vtx_pos;${_a} vec3 a_mdl_pos;${_a} vec2 a_texCoord;${_a} float a_type;${_vv}3 qa;${_vv}2 qb;${_vf}qd;${_vf}qe;\n${_vm}\nvec3 mdl=a_mdl_pos;mdl.xz+=0.5;mdl.y+=0.2;mdl.y+=0.05*sin(u_time*3.14);vec3 delta=u_player-mdl;float a1=-atan(delta.z,delta.x);float a2=-atan(-length(delta.xz),delta.y);float a3=0.0;if (a_type==3.0) {\na3=u_time*10.0;}\n${_sc("ab","a1")}${_sc("fg","a2")}${_sc("sc","a3")}mat4 rx=mat4(\n1,0,0,0,0,fg.x,fg.y,0,0,-fg.y,fg.x,0,0,0,0,1\n);mat4 ry=mat4(\nab.x,0,ab.y,0,0,1,0,0,-ab.y,0,ab.x,0,0,0,0,1\n);mat4 rz=mat4(\nsc.x,sc.y,0,0,-sc.y,sc.x,0,0,0,0,1,0,0,0,0,1\n);float s=0.2;mat4 scale=mat4(s,0,0,0,0,s,0,0,0,0,s,0,0,0,0,1);vec4 pos=scale*ry*rx*rz*vec4(a_vtx_pos,1)+vec4(mdl,0);vec4 tpos=u_transform*pos;tpos.xyz *= min(a_type,1.0);vec2 tex=a_texCoord;tex.x=(tex.x+a_type-1.0)/3.0;qa=tpos.xyz;qb=tex;qd=u_time;qe=a_type;gl_Position=tpos;}`,fragment:`\n${_g}\n${_vv}3 qa;${_vv}2 qb;${_vf}qd;${_vf}qe;\n${_vm}\nvec3 rgb=texture2D(u_image,qb).rgb;if (qe==3.0) {\nrgb.r=0.75+0.25*sin(qd*5.0);rgb.g=0.75+0.25*sin(qd*7.0);rgb.b=0.75+0.25*sin(qd*11.0);}\nrgb *= 1.0-0.75*min(max(0.0,qa.z),1.0);${_f}\n}`}};
const matmul=(t,n)=>{const e=[];for(let r=0;r<4;r++)for(let s=0;s<4;s++){let a=0;for(let e=0;e<4;e++)a+=t[4*e+s]*n[4*r+e];e.push(a)}return e},identity=()=>[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],scale=(t,n,e)=>[t,0,0,0,0,n,0,0,0,0,e,0,0,0,0,1],translate=(t,n,e)=>[1,0,0,0,0,1,0,0,0,0,1,0,t,n,e,1],rotate={x:t=>{const n=Math.cos(t),e=Math.sin(t);return[1,0,0,0,0,n,-e,0,0,e,n,0,0,0,0,1]},y:t=>{const n=Math.cos(t),e=Math.sin(t);return[n,0,-e,0,0,1,0,0,e,0,n,0,0,0,0,1]},z:t=>{const n=Math.cos(t),e=Math.sin(t);return[n,-e,0,0,e,n,0,0,0,0,1,0,0,0,0,1]}},perspective=(t,n)=>{const e=t>1?1:1/t,r=t>1?t:1,s=1/Math.tan(n/2);return[e*s,0,0,0,0,r*s,0,0,0,0,.1,1,0,0,0,1]};
const map={start_position:{x:1.5,y:1.5,z:1.5},start_direction:1*Math.PI,blocks:[],blockInfo:[]},powerupTypes={none:0,ammo:1,health:2,exit:3};map.init=(o=>{map.blocks=[],map.blockInfo=[];const p=(o,p)=>Math.floor(Math.random()*(p-o))+o,l=(o,l,t,e,s)=>{t*=5*(l+o),e*=Math.floor(l/2)*Math.floor(o/2);let a=[];for(let p=0;p<l;p++){a.push([]);for(let t=0;t<o;t++)0==p||0==t||p==l-1||t==o-1?a[p].push(s):a[p].push(0)}for(let r=0;r<e;r++){let e=2*p(0,Math.floor(o/2)),r=2*p(0,Math.floor(l/2));a[r][e]=s;for(let m=0;m<t;m++){let t=[];if(e>1&&t.push([r,e-2]),e<o-2&&t.push([r,e+2]),r>1&&t.push([r-2,e]),r<l-2&&t.push([r+2,e]),t.length>0){let o=p(0,t.length-1),l=t[o][0],m=t[o][1];0==a[l][m]&&(a[l][m]=s,a[l+Math.floor((r-l)/2)][m+Math.floor((e-m)/2)]=s,e=m,r=l)}}}return a},t=(o,p,l)=>{let t=[];for(let e=0;e<p;e++){t.push([]);for(let p=0;p<o;p++)t[e].push(l)}return t},e=(o,p,l,t,e,s,a,r,m,c,h,b,k,f,n,u,i,M)=>!!(0!=map.blocks[o][p][l]&&(s&&t>e||!s&&t<e)&&0==map.blocks[o][a][r]&&(h&&m>c||!h&&m<c)&&0==map.blocks[o+2][b][k]&&0==map.blocks[o+2][f][n]&&u<i)&&(map.blocks[o][p][l]=M,map.blocks[o+1][p][l]=0,map.blocks[o+1][b][k]=M,!0),s=7+o,a=7+o;for(let o=0;o<1;o++)map.blocks.push(t(a,s,0==o?2:3)),map.blocks.push(l(a,s,.1,.15,4));map.blocks.push(t(a,s,1));for(let o=1;o<1;o+=2){let p=0;for(let l=0;l<s;l++)for(let t=0;t<a;t++){0==map.blocks[o][l][t]&&0==map.blocks[o+2][l][t]&&l>1&&0==map.blocks[o+2][l-1][t]&&l<s-1&&0==map.blocks[o+2][l+1][t]&&t>1&&0==map.blocks[o+2][l][t-1]&&t<a-1&&0==map.blocks[o+2][l][t+1]&&(map.blocks[o+1][l][t]=0);let r=Math.random();if((e(o,l,t,l-1,1,!0,l-1,t,l+2,s-1,!1,l+1,t,l+2,t,r,.1,6)||e(o,l,t,l+1,s-1,!1,l+1,t,l-2,1,!0,l-1,t,l-2,t,r,.2,8)||e(o,l,t,t-1,1,!0,l,t-1,t+2,a-1,!1,l,t+1,l,t+2,r,.3,9)||e(o,l,t,t+1,a-1,!1,l,t+1,t-2,1,!0,l,t-1,l,t-2,r,.4,7))&&p++,p>=4)break}}map.blocks[1][0][1]=5,map.blocks[map.blocks.length-2][s-2][a-2]=0,map.blocks[map.blocks.length-2][s-1][a-2]=10;let r=0;for(let o=0;o<map.blocks.length;o++){const o=[];for(let p=0;p<map.blocks[0].length;p++){const p=[];for(let o=0;o<map.blocks[0][0].length;o++)p.push({attributeBufferIndex:r++,powerup:powerupTypes.none});o.push(p)}map.blockInfo.push(o)}map.blockInfo[map.blocks.length-2][s-2][a-2].powerup=powerupTypes.exit,map.blockInfo[1][2][5].powerup=powerupTypes.ammo,map.blockInfo[1][5][2].powerup=powerupTypes.health});
const createShader=(e,r,t)=>{const a=e.createShader(r);return e.shaderSource(a,t),e.compileShader(a),a},createProgram=(e,r,t)=>{const a=e.createProgram();return e.attachShader(a,r),e.attachShader(a,t),e.linkProgram(a),a},analyzeProgram=(e,r)=>{const t={program:r,_attributes:{},_uniforms:{},getAttribute:a=>(t._attributes.hasOwnProperty(a)||(t._attributes[a]=e.getAttribLocation(r,`a_${a}`)),t._attributes[a]),getUniform:a=>(t._uniforms.hasOwnProperty(a)||(t._uniforms[a]=e.getUniformLocation(r,`u_${a}`)),t._uniforms[a])};return t},newProgram=(e,r)=>{const t=shaders[r].vertex,a=shaders[r].fragment,E=createShader(e,e.VERTEX_SHADER,t),o=createShader(e,e.FRAGMENT_SHADER,a),n=createProgram(e,E,o);return analyzeProgram(e,n)},uploadBuffer=(e,r)=>{const t=e.createBuffer();return e.bindBuffer(e.ARRAY_BUFFER,t),e.bufferData(e.ARRAY_BUFFER,new Float32Array(r),e.STATIC_DRAW),t},uploadTexture=(e,r)=>{const t=e.createTexture();return e.bindTexture(e.TEXTURE_2D,t),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.NEAREST),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.NEAREST),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),e.texImage2D(e.TEXTURE_2D,0,e.RGB,e.RGB,e.UNSIGNED_BYTE,r),t},createRenderer=(e,r)=>{const t={uniform:{sampler2D:{},float:{},vec3:{},mat4:{}},attribute:{float:{},vec2:{},vec3:{}}};return{data:t,render:a=>{e.useProgram(r.program);let E=0;Object.getOwnPropertyNames(t.uniform.sampler2D).forEach(a=>{const o=t.uniform.sampler2D[a],n=r.getUniform(a);e.activeTexture(e.TEXTURE0+E),e.bindTexture(e.TEXTURE_2D,o),e.uniform1i(n,E),E++}),Object.getOwnPropertyNames(t.uniform.float).forEach(a=>{const E=t.uniform.float[a],o=r.getUniform(a);e.uniform1f(o,E)}),Object.getOwnPropertyNames(t.uniform.vec3).forEach(a=>{const E=t.uniform.vec3[a],o=r.getUniform(a);e.uniform3fv(o,new Float32Array(E))}),Object.getOwnPropertyNames(t.uniform.mat4).forEach(a=>{const E=t.uniform.mat4[a],o=r.getUniform(a);e.uniformMatrix4fv(o,!1,new Float32Array(E))}),Object.getOwnPropertyNames(t.attribute.float).forEach(a=>{const E=t.attribute.float[a],o=r.getAttribute(a);e.enableVertexAttribArray(o),e.bindBuffer(e.ARRAY_BUFFER,E),e.vertexAttribPointer(o,1,e.FLOAT,!1,0,0)}),Object.getOwnPropertyNames(t.attribute.vec2).forEach(a=>{const E=t.attribute.vec2[a],o=r.getAttribute(a);e.enableVertexAttribArray(o),e.bindBuffer(e.ARRAY_BUFFER,E),e.vertexAttribPointer(o,2,e.FLOAT,!1,0,0)}),Object.getOwnPropertyNames(t.attribute.vec3).forEach(a=>{const E=t.attribute.vec3[a],o=r.getAttribute(a);e.enableVertexAttribArray(o),e.bindBuffer(e.ARRAY_BUFFER,E),e.vertexAttribPointer(o,3,e.FLOAT,!1,0,0)}),e.drawArrays(e.TRIANGLES,0,a)}}},renderToTexture=(e,r,t,a)=>{const E=e.createTexture(),o=e.createFramebuffer();return e.bindTexture(e.TEXTURE_2D,E),e.texImage2D(e.TEXTURE_2D,0,e.RGB,r,t,0,e.RGB,e.UNSIGNED_BYTE,null),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.NEAREST),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.NEAREST),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),e.bindFramebuffer(e.FRAMEBUFFER,o),e.framebufferTexture2D(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,E,0),e.bindFramebuffer(e.FRAMEBUFFER,o),e.viewport(0,0,r,t),e.clearColor(0,0,0,1),e.clear(e.COLOR_BUFFER_BIT),e.disable(e.CULL_FACE),a(),e.enable(e.CULL_FACE),e.bindFramebuffer(e.FRAMEBUFFER,null),e.deleteFramebuffer(o),E};
const flatten=t=>{const e=[];return t.forEach(t=>{t.forEach(t=>{e.push(t)})}),e},newQuad=(t,e,a,r,o)=>{const n=newProgram(t,"quad"),s=[-1,-1,1,-1,1,1,-1,-1,1,1,-1,1],u=uploadBuffer(t,s),f=uploadBuffer(t,[0,1,1,1,1,0,0,1,1,0,0,0]);let d=identity();d=matmul(d,translate(r/o,0,0)),d=matmul(d,scale(1/o,1,1));const l=createRenderer(t,n);l.data.uniform.sampler2D.image=a,l.data.uniform.sampler2D.palette=e,l.data.uniform.float.filter=1,l.data.uniform.mat4.texTransform=d,l.data.attribute.vec2.position=u,l.data.attribute.vec2.texCoord=f;const i=s.length/2;return(t,e)=>{l.data.uniform.mat4.transform=e,l.render(i)}},addBlockToMesh=(t,e,a,r,o)=>{var n=o||1;const s=[e+n,a+n,r],u=[e+n,a+n,r+n],f=[e+n,a,r],d=[e+n,a,r+n],l=[e,a+n,r],i=[e,a+n,r+n],p=[e,a,r],c=[e,a,r+n];flatten([p,s,l,p,f,s,f,u,s,f,d,u,d,i,u,d,c,i,c,l,i,c,p,l,l,u,i,l,s,u,c,f,p,c,d,f]).forEach(e=>t.vertices.push(e));const m=[0,1,1,0,0,0,0,1,1,1,1,0];flatten([m,m,m,m,m,m]).forEach(e=>t.texCoords.push(e))},addRampToMesh=(t,e,a,r,o)=>{const n=.5,s=translate(n+a,n+r,n+o),u=rotate.y(-Math.PI/2*e),f=matmul(s,u),d=(t,e,a)=>matmul(f,[t,e,a,1]).splice(0,3),l=d(.5,.5,.5),i=d(.5,-n,-n),p=d(.5,-n,.5),c=d(-n,.5,.5),m=d(-n,-n,-n),h=d(-n,-n,.5);flatten([m,l,c,m,i,l,i,p,l,p,c,l,p,h,c,h,m,c,m,p,i,m,h,p]).forEach(e=>t.vertices.push(e));const v=[0,1,1,0,0,0,0,1,1,1,1,0];flatten([v,[0,1,1,1,1,0],v,[0,1,1,1,0,0],v]).forEach(e=>t.texCoords.push(e))},addPowerupToMesh=(t,e,a,r,o)=>{const n=.5,s=[.5,.5,0],u=[-n,-n,0];flatten([u,s,[-n,.5,0],u,[.5,-n,0],s]).forEach(e=>t.vertices.push(e)),[0,1,1,0,0,0,0,1,1,1,1,0].forEach(e=>t.texCoords.push(e));const f=[e,a,r];flatten([f,f,f,f,f,f]).forEach(e=>t.positions.push(e)),[o,o,o,o,o,o].forEach(e=>t.types.push(e))},newMeshRenderer=(t,e)=>{const a=e.program,r=uploadBuffer(t,e.vertices),o=uploadBuffer(t,e.texCoords),n=createRenderer(t,a);n.data.uniform.sampler2D.image=e.texture,n.data.uniform.sampler2D.palette=e.palette,n.data.uniform.float.filter=1,n.data.attribute.vec3.position=r,n.data.attribute.vec2.texCoord=o;const s=e.vertices.length/3;return t=>{n.data.uniform.mat4.transform=t,n.render(s)}},newPowerupRenderer=(t,e)=>{const a=e.program,r=uploadBuffer(t,e.vertices),o=uploadBuffer(t,e.positions),n=uploadBuffer(t,e.texCoords),s=uploadBuffer(t,e.types),u=createRenderer(t,a);u.data.uniform.sampler2D.image=e.texture,u.data.uniform.sampler2D.palette=e.palette,u.data.uniform.float.filter=1,u.data.attribute.vec3.vtx_pos=r,u.data.attribute.vec3.mdl_pos=o,u.data.attribute.vec2.texCoord=n,u.data.attribute.float.type=s;const f=e.vertices.length/3;return{render:(t,e,a,r,o)=>{u.data.uniform.mat4.transform=t,u.data.uniform.vec3.player=[a,r,o],u.data.uniform.float.time=e,u.render(f)},typeBufferId:s,typeData:e.types,stale:!1}};
const createEmitter=(t,e)=>{const a=2*-Math.PI/3,r=t=>[.5*Math.sin(a*t),.5*Math.cos(a*t),0],n=[],o=[],l=(t,e)=>e.forEach(e=>t.push(e));for(let t=0;t<50;t++){l(n,flatten([r(0),r(1),r(2)]));const t=Math.random();l(o,[t,t,t])}const d=newProgram(t,"particle"),i=uploadBuffer(t,n),f=uploadBuffer(t,o),m=createRenderer(t,d);m.data.uniform.sampler2D.palette=e,m.data.uniform.float.filter=1,m.data.attribute.vec3.position=i,m.data.attribute.float.entropy=f;const s=n.length/3;return{renderer:m,render:()=>{m.render(s)}}},spawnEmitter=(t,e,a,r,n)=>{let o=identity();o=matmul(o,translate(e,a,r)),o=matmul(o,scale(1/8,1/8,1/8));const l={age:0},d=Math.random();return{render:(i,f,m)=>{const s=[m.state.player.location.x-e,m.state.player.location.y-a,m.state.player.location.z-r];t.renderer.data.uniform.mat4.transform=matmul(i,o),t.renderer.data.uniform.vec3.delta=s,t.renderer.data.uniform.float.age=l.age,t.renderer.data.uniform.float.size=n,t.renderer.data.uniform.float.nonce=d,t.render()},state:l}};
const audio=(()=>{const e=new AudioContext;return{playNote:t=>{const a=e.currentTime,n=a+.25,o=e.createOscillator();o.frequency.setValueAtTime(t,a);const i=e.createGain();i.gain.setValueAtTime(.05,a),o.connect(i),i.connect(e.destination),o.start(a),o.stop(n)},playDrum:t=>{const a=e.currentTime,n=a+.25,o=e.createOscillator();o.frequency.setValueAtTime(t,a),o.frequency.exponentialRampToValueAtTime(5e-4,n);const i=e.createGain();i.gain.setValueAtTime(.05,a),i.gain.exponentialRampToValueAtTime(5e-4,n),o.connect(i),i.connect(e.destination),o.start(a),o.stop(n)},playTheme:()=>{let e=0;for(let t=0;t<4;t++){for(let t=0;t<3;t++)setTimeout(()=>audio.playDrum(220),e+1200*t/3);e+=1200;for(let t=.25;t<2.25;t++)setTimeout(()=>audio.playDrum(220),e+800*t/3);e+=800;for(let t=0;t<16;t++)setTimeout(()=>audio.playDrum(220),e+2e3*t/16);e+=2e3}}}})();
const byte=t=>Math.floor(255*t),getRgb2=(t,e,n)=>[byte(t),byte(e),byte(n)],randomTexture=(t,e,n,a)=>{const c=document.createElement("canvas").getContext("2d");c.canvas.width=t,c.canvas.height=t;for(let l=0;l<t;l++)for(let o=0;o<t;o++){const t=Math.random(),r=getRgb2(t*e,t*n,t*a);c.fillStyle=`rgb(${r[0]}, ${r[1]}, ${r[2]})`,c.fillRect(l,o,1,1)}return c.canvas},solidTexture=(t,e,n)=>{const a=document.createElement("canvas").getContext("2d");a.canvas.width=1,a.canvas.height=1;const c=getRgb2(t,e,n);return a.fillStyle=`rgb(${c[0]}, ${c[1]}, ${c[2]})`,a.fillRect(0,0,1,1),a.canvas},solidTextureStack=(...t)=>{const e=document.createElement("canvas").getContext("2d");e.canvas.width=t.length,e.canvas.height=1;for(let n=0;n<t.length;n++){const a=getRgb2(...t[n]);e.fillStyle=`rgb(${a[0]}, ${a[1]}, ${a[2]})`,e.fillRect(n,0,1,1)}return e.canvas},paletteTexture=()=>{const t=document.createElement("canvas").getContext("2d");t.canvas.width=27,t.canvas.height=1;for(let e=0;e<3;e++)for(let n=0;n<3;n++)for(let a=0;a<3;a++){const c=getRgb2(e/2,n/2,a/2);t.fillStyle=`rgb(${c[0]}, ${c[1]}, ${c[2]})`;let l=3*e*3+3*n+a;t.fillRect(l,0,1,1)}return t.canvas};
const getCollisions=(o,t,l,a)=>{let e=0,r=0,n=0,s=0,i=0;l>0&&0!=o[t][l-1][a]&&8!=o[t][l-1][a]&&(n=1),l<o[0].length-1&&0!=o[t][l+1][a]&&6!=o[t][l+1][a]&&(s=1),a>0&&0!=o[t][l][a-1]&&7!=o[t][l][a-1]&&(e=1),a<o[0][0].length-1&&0!=o[t][l][a+1]&&9!=o[t][l][a+1]&&(r=1);const p=0==o[t][l][a],h=0==o[t-1][l][a];return!(t>0)||p&&h||(i=[6,7,8,9].includes(o[t][l][a])?o[t][l][a]:[6,7,8,9].includes(o[t-1][l][a])?-o[t-1][l][a]:1),[n,s,e,r,i]},getPosition=(o,t,l)=>o<.25?.25*t+(1-t)*o:o>=.75?.75*l+(1-l)*o:o,getPositionY=(o,t,l,a)=>{let e;const r=l>(e=6==a?t+.5:-6==a?t-.5:8==a?1-t+.5:-8==a?1-t-.5:7==a?1-o+.5:-7==a?1-o-.5:9==a?o+.5:-9==a?o-.5:0==a?-1:.5);return[Math.max(l,e),r]},getCoords=o=>[o.x,o.y,o.z],getIntCoords=o=>[Math.floor(o.x),Math.floor(o.y),Math.floor(o.z)],newGame=()=>{const o={levelStatus:null,renderFuncGenArgs:null,renderFuncGen:null,renderFunc:null,level:1,limits:{health:3,ammo:25},player:{location:{x:map.start_position.x,y:map.start_position.y,z:map.start_position.z},direction:map.start_direction,altitude:0,fallSpeed:0,health:3,ammo:15,hitBox:.5},input:{forward:!1,backward:!1,left:!1,right:!1,pointerLocked:!1,jumping:!1},orbs:[],emitterSpawns:[],emitters:[]};let t=null;o.sendOrb=(()=>{if(0==o.player.ammo)return;o.player.ammo--;const t=Math.sin(o.player.direction),l=Math.cos(o.player.direction),a=Math.sin(o.player.altitude),e=Math.cos(o.player.altitude),r={active:!0,position:{x:o.player.location.x,y:o.player.location.y,z:o.player.location.z},velocity:{x:.25*t*e,y:.25*a,z:.25*l*e},explode:o=>{audio.playDrum(250),r.active=!1;const[t,l,a]=getCoords(r.position);o.push([t,l,a,1])}};audio.playDrum(500),o.orbs.push(r)});const l=(t,l,a)=>{o.levelStatus=a;const e=()=>{map.init(t),o.levelStatus=null,o.level=t,o.player.location.x=map.start_position.x,o.player.location.y=map.start_position.y,o.player.location.z=map.start_position.z,o.player.direction=map.start_direction,o.player.altitude=0,o.player.fallSpeed=0,o.player.health=3,o.player.ammo=15,o.renderFunc=o.renderFuncGen(...o.renderFuncGenArgs)};l?setTimeout(e,2e3):e()},a=[[5,4,3],[6,0,2],[7,0,1]],e=Math.PI/4;let r=0;return{state:o,update:n=>{const s=Math.min(n-r,160)/1e3;r=n;let i=0,p=0;const h=2*s,c=[1+o.input.forward-o.input.backward,1+o.input.right-o.input.left];if(1!=c[0]||1!=c[1]){const t=a[c[0]][c[1]]*e,l=o.player.direction+t;p+=h*Math.cos(l),i+=h*Math.sin(l)}o.input.jumping&&0==o.player.fallSpeed&&(o.player.fallSpeed-=.04);let u=-o.player.fallSpeed;if(0!=i||0!=u||0!=p){const[t,l,a]=getCoords(o.player.location),[e,r,n]=getIntCoords(o.player.location),h=getCollisions(map.blocks,r,n,e),c=getPosition(t-e+i,h[2],h[3]);o.player.location.x=e+c;const y=getPosition(a-n+p,h[0],h[1]);o.player.location.z=n+y;const m=l-r,[d,f]=getPositionY(c,y,m+u,h[4]);o.player.location.y=r+d,f?o.player.fallSpeed+=.16*s:o.player.fallSpeed=0}const[y,m,d]=getIntCoords(o.player.location),f=map.blockInfo[m][d][y].powerup;if(f!=powerupTypes.none){let a=!0;f==powerupTypes.ammo?o.player.ammo=Math.min(o.player.ammo+5,o.limits.ammo):f==powerupTypes.health?o.player.health=Math.min(o.player.health+1,o.limits.health):f==powerupTypes.exit&&(audio.playNote(440),setTimeout(()=>audio.playNote(554),200),setTimeout(()=>audio.playNote(659),400),l(o.level+1,!0,"next level"),a=!1),map.blockInfo[m][d][y].powerup=powerupTypes.none;let e=map.blockInfo[m][d][y].attributeBufferIndex;e*=6;for(let o=0;o<6;o++)t.typeData[e+o]=powerupTypes.none;t.stale=e,a&&audio.playNote(659)}o.orbs.forEach(t=>{t.position.x+=t.velocity.x,t.position.y+=t.velocity.y,t.position.z+=t.velocity.z,t.velocity.y-=.16*s;const l=Math.floor(t.position.x),a=Math.floor(t.position.y),e=Math.floor(t.position.z);0!=map.blocks[a][e][l]&&t.explode(o.emitterSpawns)}),o.emitters.forEach(o=>{o.state.age+=3*s});for(let t=0;t<o.orbs.length;t++)o.orbs[t].active||o.orbs.splice(t--,1);for(let t=0;t<o.emitters.length;t++)o.emitters[t].state.age>1&&o.emitters.splice(t--,1)},setPowerupRenderer:o=>{t=o},doDamage:t=>{o.player.health-=t,o.player.health<=0?(audio.playNote(440),setTimeout(()=>audio.playNote(370),200),setTimeout(()=>audio.playNote(349),400),l(1,!0,"game over")):audio.playNote(466)},goToLevel:l}},newBaddie=(o,t)=>{for(var l=0,a=0;0!=map.blocks[1][Math.floor(a)][Math.floor(l)];)l=Math.floor(Math.random()*(map.blocks[0].length-2))+1.5,a=Math.floor(Math.random()*(map.blocks[0].length-2))+1.5;const e={location:{x:l,y:1.5,z:a},hitTime:0,hitBox:.25,health:3};addBlockToMesh(t,-.5,-.5,-.5),e.render=newMeshRenderer(o,t),e.findFirstChoice=((o,t)=>{for(var l=[[0,0]];null!=t[o][0];)l.push(t[o][1]),o=t[o][0];return l[l.length-1]}),e.bfs=((o,t,l,a,r,n,s)=>{var i=[],p=[],h={},c=t+"|"+l;h[c]=[null,null],t==a&&l==r||i.push(c);for(var u=[[-1,0],[1,0],[0,-1],[0,1]];i.length>0;){var y=i.shift(),m=y.indexOf("|");if(t=parseInt(y.substring(0,m)),l=parseInt(y.substring(m+1)),o<=0||o>=map.blocks.length||t<=0||t>=map.blocks[o].length||l<=0||l>=map.blocks[o][t].length)p.push(y);else{if(t==a&&l==r)return e.findFirstChoice(y,h);if(n.includes(map.blocks[o][t][l]))return[o,t,l];if(s||0==map.blocks[o][t][l]){var d=getCollisions(map.blocks,o,t,l);u.forEach((o,a)=>{var e=t+o[0]+"|"+(l+o[1]);p.includes(e)||i.includes(e)||!s&&d[a]||(h[e]=[y,o],i.push(e))}),p.push(y)}else p.push(y)}}return[0,0]}),e.findRamp=((o,t,l,a)=>{var r=e.bfs(o+a,t,l,null,null,[6,7,8,9],a<0);if(2==r.length)return r;var n,s,i=map.blocks[r[0]][r[1]][r[2]];return 6==i?(n=0==a?-1:1,s=0):7==i?(n=0,s=0==a?1:-1):8==i?(n=0==a?1:-1,s=0):9==i&&(n=0,s=0==a?-1:1),t==r[1]+n&&l==r[2]+s?(e.shortGoal[0]=-1*n,e.shortGoal[1]=-1*s,e.shortGoal[2]=t+3*e.shortGoal[0],e.shortGoal[3]=l+3*e.shortGoal[1],e.shortGoal[4]=e.location.y,e.shortGoal[5]=e.location.y+2,a<0&&(e.shortGoal[5]=e.location.y-2),null):e.bfs(o,t,l,r[1]+n,r[2]+s,[],!1)}),e.getGoal=((o,t,l,a,r)=>{var n=[0,0];return l==Math.floor(t.y)&&(n=e.bfs(l,a,r,Math.floor(t.z),Math.floor(t.x),[],!1)),0==n[0]&&0==n[1]&&l<Math.floor(t.y)&&(n=e.findRamp(l,a,r,0)),null!=n&&0==n[0]&&0==n[1]&&(n=e.findRamp(l,a,r,-1)),n}),e.shortGoal=[null,null,null,null,null,null];let r=0;return e.update=((o,t)=>{const l=Math.min(o-r,160)/1e3;r=o,0==e.hitTime&&(e.hitTime=o);const a=Math.floor(e.location.y),n=Math.floor(e.location.z),s=Math.floor(e.location.x);if(null==e.shortGoal[0]){var i=e.getGoal(o,t,a,n,s);null!=i&&(e.shortGoal[0]=i[0],e.shortGoal[1]=i[1],e.shortGoal[3]=s+.5*e.shortGoal[1],e.shortGoal[2]=n+.5*e.shortGoal[0])}if(e.location.x+=e.shortGoal[1]*l,e.location.z+=e.shortGoal[0]*l,null!=e.shortGoal[4]){var p=(3-Math.abs(e.shortGoal[2]-e.location.z))/2.9,h=(3-Math.abs(e.shortGoal[3]-e.location.x))/2.9,c=e.shortGoal[5]>e.shortGoal[4];c&&e.location.y>=e.shortGoal[5]||!c&&e.location.y<=e.shortGoal[5]||p<0||h<0?(e.shortGoal[4]=e.shortGoal[5]=null,e.location.y=Math.floor(e.location.y)+.5):e.location.y=c?e.shortGoal[4]+2*Math.abs(e.shortGoal[0])*p+2*Math.abs(e.shortGoal[1])*h:e.shortGoal[4]-2*Math.abs(e.shortGoal[0])*p-2*Math.abs(e.shortGoal[1])*h}(e.shortGoal[1]>0&&e.location.x>e.shortGoal[3]||e.shortGoal[1]<0&&e.location.x<e.shortGoal[3]||e.shortGoal[0]>0&&e.location.z>e.shortGoal[2]||e.shortGoal[0]<0&&e.location.z<e.shortGoal[2]||0==e.shortGoal[1]&&0==e.shortGoal[0])&&(e.shortGoal[0]=e.shortGoal[1]=null)}),e.explode=(o=>{e.health=0,audio.playNote(440);const[t,l,a]=getIntCoords(e.location);o.push([t,l,a,5])}),e};
const setup=()=>{const e={w:"forward",a:"left",s:"backward",d:"right"," ":"jumping"},t=document.getElementsByTagName("canvas")[0],a=(e=>{const t=e.getContext("webgl",{alpha:!1,antialias:!1});return t.enable(t.CULL_FACE),t.frontFace(t.CCW),t.cullFace(t.BACK),t})(t),r=uploadTexture(a,paletteTexture()),l={},n=uploadTexture(a,img_text),o="abcdefghijklmnopqrstuvwxyz0123456789.,!?-+:/@ ";for(let e=0;e<o.length;e++){const t=newQuad(a,r,n,e,o.length);l[o[e]]=t}const s=(e,t,a)=>{for(let r=0;r<t.length;r++)l[t[r]](e,a),a=matmul(a,translate(2,0,0))},u=newGame();u.state.renderFuncGenArgs=[t,a,u,r,s,(e,t)=>{const a=t.length;return renderToTexture(e,192,256,()=>{let r=identity();r=matmul(r,translate(-.5,-.5,0)),r=matmul(r,scale(.5,.5,1)),r=matmul(r,scale(1/a,-1/a,1)),r=matmul(r,translate(1,-1,0));for(let a=0;a<t.length;a++)s(e,t[a],r),r=matmul(r,translate(0,-2,0))})}],u.state.renderFuncGen=getGameRenderer,u.goToLevel(1,!1,null),t.addEventListener("keydown",t=>{e.hasOwnProperty(t.key)&&(u.state.input[e[t.key]]=!0)}),t.addEventListener("keyup",t=>{e.hasOwnProperty(t.key)&&(u.state.input[e[t.key]]=!1)}),t.addEventListener("click",e=>{u.state.input.pointerLocked||t.requestPointerLock()}),t.addEventListener("mousedown",e=>{u.state.input.pointerLocked&&u.state.sendOrb()}),t.addEventListener("mousemove",e=>{u.state.input.pointerLocked&&(u.state.player.direction+=.0015*e.movementX,u.state.player.altitude-=.0015*e.movementY,u.state.player.altitude=Math.min(u.state.player.altitude,+Math.PI/2),u.state.player.altitude=Math.max(u.state.player.altitude,-Math.PI/2))}),document.addEventListener("pointerlockchange",e=>{const a=document.pointerLockElement===t;u.state.levelStatus=a?null:"click to play",!u.state.input.pointerLocked&&a?(u.state.input.pointerLocked=document.pointerLockElement===t,u.state.input.pointerLocked&&audio.playNote(440)):a||(u.state.input.pointerLocked=!1,audio.playNote(415))}),setInterval(audio.playTheme,6e4),u.state.levelStatus="click to play",requestAnimationFrame(u.state.renderFunc)},getGameRenderer=(e,t,a,r,l,n)=>{const o=""+a.state.level,s=n(t,["+              +","","level:          ".slice(0,16-o.length)+o,"","move:    w/a/s/d","","jump:      space","","shoot:     click","","","   objective:"," get out alive","","   good luck!","+              +"]),u=n(t,["+   +"," got "," out ","alive","+   +"]),i=newProgram(t,"block"),d=e=>({program:i,palette:r,texture:e,vertices:[],texCoords:[],render:null}),m=newProgram(t,"powerup"),c=d(uploadTexture(t,randomTexture(8,0,.2,.7))),p=uploadTexture(t,solidTexture(.8,.4,.1)),h=d(p);addBlockToMesh(h,-.5,-.5,-.5),h.render=newMeshRenderer(t,h);const y=createEmitter(t,r);for(var x=d(uploadTexture(t,solidTexture(.9,.2,.2))),T=[],w=0;w<3;w++)T.push(newBaddie(t,x));const g=uploadTexture(t,solidTexture(.5,.5,.7)),f=uploadTexture(t,solidTexture(.7,0,0)),k=newQuad(t,r,g,0,1),v=newQuad(t,r,f,0,1),E=p,b=uploadTexture(t,solidTexture(.5,.5,.5)),L=newQuad(t,r,E,0,1),B=newQuad(t,r,b,0,1),F=uploadTexture(t,solidTexture(.8,.8,.8)),M=newQuad(t,r,F,0,1),P={1:d(uploadTexture(t,randomTexture(16,.7,0,0))),2:d(uploadTexture(t,randomTexture(16,0,.7,0))),3:d(uploadTexture(t,randomTexture(8,.5,.5,.3))),4:d(uploadTexture(t,randomTexture(8,.7,.7,.7))),5:d(s),10:d(u),ramps:c},S=solidTextureStack([.8,.4,.1],[.5,.5,.7],[1,1,1]),R=(e=>({program:m,palette:r,texture:e,vertices:[],texCoords:[],positions:[],types:[],render:null}))(uploadTexture(t,S));for(let e=0;e<map.blocks.length;e++)for(let t=0;t<map.blocks[0].length;t++)for(let a=0;a<map.blocks[0][0].length;a++){let r=map.blocks[e][t][a];const l=r>=6&&r<=9;if(P.hasOwnProperty(r)||l)if(l){const l=r-6;addRampToMesh(P.ramps,l,a,e,t)}else addBlockToMesh(P[r],a,e,t);const n=map.blockInfo[e][t][a].powerup;addPowerupToMesh(R,a,e,t,n)}Object.getOwnPropertyNames(P).forEach(e=>{P[e].render=newMeshRenderer(t,P[e])}),R.renderer=newPowerupRenderer(t,R),a.setPowerupRenderer(R.renderer);let z=0;return r=>{requestAnimationFrame(a.state.renderFunc),z=r,null==a.state.levelStatus&&a.update(r),null==a.state.levelStatus&&T.forEach(e=>{e.update(r,a.state.player.location)}),T.forEach(e=>{const t=e.hitBox;a.state.orbs.forEach(r=>{const l=e.location.x-r.position.x,n=e.location.y-r.position.y,o=e.location.z-r.position.z;Math.abs(l)<t&&Math.abs(n)<t&&Math.abs(o)<t&&(r.explode(a.state.emitterSpawns),e.health-=1,e.health<=0?e.explode(a.state.emitterSpawns):audio.playNote(392))})}),T.forEach(e=>{if(e.health<=0)return;const t=e.hitBox+a.state.player.hitBox,r=e.location.x-a.state.player.location.x,l=e.location.y-a.state.player.location.y,n=e.location.z-a.state.player.location.z;Math.abs(r)<t&&Math.abs(l)<t&&Math.abs(n)<t&&(a.doDamage(1),e.explode(a.state.emitterSpawns))});for(let e=0;e<T.length;e++)T[e].health<=0&&T.splice(e--,1);t.viewport(0,0,t.drawingBufferWidth,t.drawingBufferHeight),t.clearColor(1,1,1,1),t.clear(t.COLOR_BUFFER_BIT|t.DEPTH_BUFFER_BIT),t.enable(t.DEPTH_TEST);const n=e.clientWidth/e.clientHeight,o=1.2*Math.PI/2;let s=identity();s=matmul(s,perspective(n,o)),s=matmul(s,translate(0,-.01,-1)),s=matmul(s,rotate.x(-a.state.player.altitude)),s=matmul(s,rotate.y(-a.state.player.direction));const u=translate(-a.state.player.location.x,-a.state.player.location.y,-a.state.player.location.z);if(s=matmul(s,u),Object.getOwnPropertyNames(P).forEach(e=>{P[e].vertices.length>0&&P[e].render(s)}),0!=R.renderer.stale){const e=R.renderer.stale;R.renderer.stale=!1,t.bindBuffer(t.ARRAY_BUFFER,R.renderer.typeBufferId);const a=R.renderer.typeData.slice(e,e+6);t.bufferSubData(t.ARRAY_BUFFER,4*e,new Float32Array(a))}const i=a.state.player.location;R.renderer.render(s,.001*r,i.x,i.y,i.z),T.forEach(e=>{let t;t=matmul(s,translate(e.location.x,e.location.y,e.location.z)),t=matmul(t,scale(.5,.5,.5)),e.render(t)}),a.state.orbs.forEach(e=>{let t=matmul(s,translate(e.position.x,e.position.y,e.position.z));t=matmul(t,scale(.05,.05,.05)),h.render(t)}),a.state.emitterSpawns.length>0&&(a.state.emitterSpawns.forEach(e=>{a.state.emitters.push(spawnEmitter(y,...e))}),a.state.emitterSpawns=[]),a.state.emitters.forEach(e=>{e.render(s,r,a)}),t.disable(t.DEPTH_TEST),s=identity(),s=matmul(s,scale(.5,.05,1)),s=matmul(s,translate(0,-19,0)),v(t,s);let d=a.state.player.health/a.state.limits.health;s=identity(),s=matmul(s,translate(-.5,0,0)),s=matmul(s,scale(d/2,.05,1)),s=matmul(s,translate(1,-19,0)),k(t,s),s=identity(),s=matmul(s,scale(.5,.05,1)),s=matmul(s,translate(0,-17,0)),B(t,s),d=a.state.player.ammo/a.state.limits.ammo,s=identity(),s=matmul(s,translate(-.5,0,0)),s=matmul(s,scale(d/2,.05,1)),s=matmul(s,translate(1,-17,0)),L(t,s);for(let e=0;e<5;e++)s=identity(),s=matmul(s,translate(-1/360,0,0)),s=matmul(s,rotate.z(e*Math.PI*2/3)),s=matmul(s,scale(1/360,.01,1)),s=matmul(s,translate(0,2.2,0)),M(t,s);if(null!=a.state.levelStatus){const e=a.state.levelStatus.length;s=identity(),s=matmul(s,translate(-e/30,0,0)),s=matmul(s,scale(12/360,.12,1)),s=matmul(s,translate(1,0,0)),l(t,a.state.levelStatus,s)}}};